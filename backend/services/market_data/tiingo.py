"""
Tiingo Data Provider
- 1000 requests/day (free tier)
- Real-time data
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging

from .base import MarketDataProvider, StockQuote, StockInfo, OHLCV

logger = logging.getLogger(__name__)


class TiingoProvider(MarketDataProvider):
    """Tiingo 데이터 프로바이더"""

    name = "tiingo"
    priority = 3
    rate_limit = None
    daily_limit = 1000
    base_url = "https://api.tiingo.com"

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        if not api_key:
            self.is_available = False
            logger.warning("Tiingo API key not provided")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Token {self.api_key}"
        }

    async def get_quote(self, ticker: str) -> Optional[StockQuote]:
        """실시간 시세 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/iex/{ticker.upper()}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()

                if not data or len(data) == 0:
                    return None

                self._increment_request()
                item = data[0]

                current_price = item.get("last") or item.get("tngoLast", 0)
                prev_close = item.get("prevClose", current_price)
                change = current_price - prev_close
                change_percent = (change / prev_close * 100) if prev_close else 0

                return StockQuote(
                    ticker=ticker.upper(),
                    current_price=current_price,
                    previous_close=prev_close,
                    open_price=item.get("open", 0),
                    high=item.get("high", 0),
                    low=item.get("low", 0),
                    volume=item.get("volume", 0),
                    change=change,
                    change_percent=change_percent,
                    timestamp=datetime.utcnow(),
                    source=self.name
                )
        except Exception as e:
            logger.error(f"Tiingo quote error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tiingo/daily/{ticker.upper()}",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return None

                self._increment_request()

                return StockInfo(
                    ticker=ticker.upper(),
                    name=data.get("name", ticker),
                    sector=None,
                    industry=None,
                    market_cap=None,
                    pe_ratio=None,
                    eps=None,
                    dividend_yield=None,
                    fifty_two_week_high=None,
                    fifty_two_week_low=None,
                    avg_volume=None,
                    description=data.get("description")
                )
        except Exception as e:
            logger.error(f"Tiingo info error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_historical(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> List[OHLCV]:
        """과거 가격 데이터 조회"""
        if not self.api_key or not self._check_rate_limit():
            return []

        try:
            # Calculate date range
            end_date = datetime.now()
            period_map = {
                "1d": 1, "5d": 5, "1mo": 30, "3mo": 90,
                "6mo": 180, "1y": 365, "2y": 730, "5y": 1825
            }
            days = period_map.get(period, 365)
            start_date = end_date - timedelta(days=days)

            # Map interval to Tiingo resample frequency
            resample_map = {
                "1d": "daily", "1wk": "weekly", "1mo": "monthly"
            }
            resample_freq = resample_map.get(interval, "daily")

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tiingo/daily/{ticker.upper()}/prices",
                    headers=self._get_headers(),
                    params={
                        "startDate": start_date.strftime("%Y-%m-%d"),
                        "endDate": end_date.strftime("%Y-%m-%d"),
                        "resampleFreq": resample_freq
                    }
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return []

                self._increment_request()

                result = []
                for item in data:
                    result.append(OHLCV(
                        timestamp=datetime.fromisoformat(item["date"].replace("Z", "+00:00")),
                        open=item["open"],
                        high=item["high"],
                        low=item["low"],
                        close=item["close"],
                        volume=int(item["volume"])
                    ))

                return result
        except Exception as e:
            logger.error(f"Tiingo historical error for {ticker}: {e}")
            self.last_error = str(e)
            return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색 (Tiingo doesn't have a search endpoint)"""
        return []

    async def get_crypto_price(self, symbol: str = "btcusd") -> Optional[float]:
        """암호화폐 가격 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tiingo/crypto/prices",
                    headers=self._get_headers(),
                    params={"tickers": symbol.lower()}
                )
                response.raise_for_status()
                data = response.json()

                if not data or len(data) == 0:
                    return None

                self._increment_request()
                return data[0].get("priceData", [{}])[0].get("close")
        except Exception as e:
            logger.error(f"Tiingo crypto error for {symbol}: {e}")
            return None
