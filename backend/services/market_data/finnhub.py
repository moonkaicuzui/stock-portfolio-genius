"""
Finnhub Data Provider
- 60 requests/minute (free tier)
- Real-time data
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging

from .base import MarketDataProvider, StockQuote, StockInfo, OHLCV

logger = logging.getLogger(__name__)


class FinnhubProvider(MarketDataProvider):
    """Finnhub 데이터 프로바이더"""

    name = "finnhub"
    priority = 2
    rate_limit = 60  # 60 requests per minute
    daily_limit = None
    base_url = "https://finnhub.io/api/v1"

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        if not api_key:
            self.is_available = False
            logger.warning("Finnhub API key not provided")

    async def get_quote(self, ticker: str) -> Optional[StockQuote]:
        """실시간 시세 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/quote",
                    params={"symbol": ticker.upper(), "token": self.api_key}
                )
                response.raise_for_status()
                data = response.json()

                if not data or data.get("c") == 0:
                    return None

                self._increment_request()

                current_price = data.get("c", 0)
                previous_close = data.get("pc", current_price)
                change = data.get("d", 0)
                change_percent = data.get("dp", 0)

                return StockQuote(
                    ticker=ticker.upper(),
                    current_price=current_price,
                    previous_close=previous_close,
                    open_price=data.get("o", 0),
                    high=data.get("h", 0),
                    low=data.get("l", 0),
                    volume=0,  # Not provided in quote endpoint
                    change=change,
                    change_percent=change_percent,
                    timestamp=datetime.utcnow(),
                    source=self.name
                )
        except Exception as e:
            logger.error(f"Finnhub quote error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/stock/profile2",
                    params={"symbol": ticker.upper(), "token": self.api_key}
                )
                response.raise_for_status()
                data = response.json()

                if not data:
                    return None

                self._increment_request()

                return StockInfo(
                    ticker=ticker.upper(),
                    name=data.get("name", ticker),
                    sector=data.get("finnhubIndustry"),
                    industry=data.get("finnhubIndustry"),
                    market_cap=data.get("marketCapitalization", 0) * 1_000_000 if data.get("marketCapitalization") else None,
                    pe_ratio=None,  # Not provided
                    eps=None,
                    dividend_yield=None,
                    fifty_two_week_high=None,
                    fifty_two_week_low=None,
                    avg_volume=None,
                    description=None
                )
        except Exception as e:
            logger.error(f"Finnhub info error for {ticker}: {e}")
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
            # Calculate date range based on period
            end_date = datetime.now()
            period_map = {
                "1d": 1, "5d": 5, "1mo": 30, "3mo": 90,
                "6mo": 180, "1y": 365, "2y": 730, "5y": 1825
            }
            days = period_map.get(period, 365)
            start_date = end_date - timedelta(days=days)

            # Map interval to Finnhub resolution
            resolution_map = {
                "1m": "1", "5m": "5", "15m": "15", "30m": "30",
                "60m": "60", "1h": "60", "1d": "D", "1wk": "W", "1mo": "M"
            }
            resolution = resolution_map.get(interval, "D")

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/stock/candle",
                    params={
                        "symbol": ticker.upper(),
                        "resolution": resolution,
                        "from": int(start_date.timestamp()),
                        "to": int(end_date.timestamp()),
                        "token": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                if data.get("s") != "ok" or not data.get("t"):
                    return []

                self._increment_request()

                result = []
                for i in range(len(data["t"])):
                    result.append(OHLCV(
                        timestamp=datetime.fromtimestamp(data["t"][i]),
                        open=data["o"][i],
                        high=data["h"][i],
                        low=data["l"][i],
                        close=data["c"][i],
                        volume=int(data["v"][i])
                    ))

                return result
        except Exception as e:
            logger.error(f"Finnhub historical error for {ticker}: {e}")
            self.last_error = str(e)
            return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색"""
        if not self.api_key or not self._check_rate_limit():
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params={"q": query, "token": self.api_key}
                )
                response.raise_for_status()
                data = response.json()

                self._increment_request()

                results = []
                for item in data.get("result", [])[:10]:
                    results.append({
                        "symbol": item.get("symbol"),
                        "name": item.get("description"),
                        "type": item.get("type"),
                        "exchange": item.get("displaySymbol", "")
                    })

                return results
        except Exception as e:
            logger.error(f"Finnhub search error for {query}: {e}")
            self.last_error = str(e)
            return []
