"""
Alpha Vantage Data Provider
- 25 requests/day (free tier)
- Real-time data
"""

import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

from .base import MarketDataProvider, StockQuote, StockInfo, OHLCV

logger = logging.getLogger(__name__)


class AlphaVantageProvider(MarketDataProvider):
    """Alpha Vantage 데이터 프로바이더"""

    name = "alphavantage"
    priority = 4  # Lowest priority due to strict daily limit
    rate_limit = 5  # 5 requests per minute
    daily_limit = 25
    base_url = "https://www.alphavantage.co/query"

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        if not api_key:
            self.is_available = False
            logger.warning("Alpha Vantage API key not provided")

    async def get_quote(self, ticker: str) -> Optional[StockQuote]:
        """실시간 시세 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "GLOBAL_QUOTE",
                        "symbol": ticker.upper(),
                        "apikey": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                quote = data.get("Global Quote")
                if not quote or not quote.get("05. price"):
                    return None

                self._increment_request()

                current_price = float(quote.get("05. price", 0))
                previous_close = float(quote.get("08. previous close", current_price))
                change = float(quote.get("09. change", 0))
                change_percent = float(quote.get("10. change percent", "0%").replace("%", ""))

                return StockQuote(
                    ticker=ticker.upper(),
                    current_price=current_price,
                    previous_close=previous_close,
                    open_price=float(quote.get("02. open", 0)),
                    high=float(quote.get("03. high", 0)),
                    low=float(quote.get("04. low", 0)),
                    volume=int(quote.get("06. volume", 0)),
                    change=change,
                    change_percent=change_percent,
                    timestamp=datetime.utcnow(),
                    source=self.name
                )
        except Exception as e:
            logger.error(f"Alpha Vantage quote error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        if not self.api_key or not self._check_rate_limit():
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "OVERVIEW",
                        "symbol": ticker.upper(),
                        "apikey": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                if not data or "Symbol" not in data:
                    return None

                self._increment_request()

                return StockInfo(
                    ticker=ticker.upper(),
                    name=data.get("Name", ticker),
                    sector=data.get("Sector"),
                    industry=data.get("Industry"),
                    market_cap=float(data.get("MarketCapitalization", 0)) if data.get("MarketCapitalization") else None,
                    pe_ratio=float(data.get("PERatio", 0)) if data.get("PERatio") and data.get("PERatio") != "None" else None,
                    eps=float(data.get("EPS", 0)) if data.get("EPS") and data.get("EPS") != "None" else None,
                    dividend_yield=float(data.get("DividendYield", 0)) if data.get("DividendYield") and data.get("DividendYield") != "None" else None,
                    fifty_two_week_high=float(data.get("52WeekHigh", 0)) if data.get("52WeekHigh") else None,
                    fifty_two_week_low=float(data.get("52WeekLow", 0)) if data.get("52WeekLow") else None,
                    avg_volume=None,
                    description=data.get("Description")
                )
        except Exception as e:
            logger.error(f"Alpha Vantage info error for {ticker}: {e}")
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
            # Determine function and outputsize based on period
            outputsize = "full" if period in ["2y", "5y", "10y", "max"] else "compact"

            # Map interval to Alpha Vantage function
            if interval in ["1m", "5m", "15m", "30m", "60m", "1h"]:
                function = "TIME_SERIES_INTRADAY"
                interval_param = interval.replace("m", "min").replace("1h", "60min")
            else:
                function = "TIME_SERIES_DAILY"
                interval_param = None

            params = {
                "function": function,
                "symbol": ticker.upper(),
                "outputsize": outputsize,
                "apikey": self.api_key
            }
            if interval_param:
                params["interval"] = interval_param

            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()

                # Find the time series key
                time_series_key = None
                for key in data.keys():
                    if "Time Series" in key:
                        time_series_key = key
                        break

                if not time_series_key or time_series_key not in data:
                    return []

                self._increment_request()

                result = []
                time_series = data[time_series_key]

                for date_str, values in time_series.items():
                    try:
                        if " " in date_str:
                            timestamp = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                        else:
                            timestamp = datetime.strptime(date_str, "%Y-%m-%d")

                        result.append(OHLCV(
                            timestamp=timestamp,
                            open=float(values.get("1. open", 0)),
                            high=float(values.get("2. high", 0)),
                            low=float(values.get("3. low", 0)),
                            close=float(values.get("4. close", 0)),
                            volume=int(values.get("5. volume", 0))
                        ))
                    except Exception:
                        continue

                # Sort by timestamp ascending
                result.sort(key=lambda x: x.timestamp)

                # Limit based on period
                period_days = {
                    "1d": 1, "5d": 5, "1mo": 22, "3mo": 66,
                    "6mo": 132, "1y": 252, "2y": 504, "5y": 1260
                }
                max_records = period_days.get(period, 252)
                return result[-max_records:] if len(result) > max_records else result

        except Exception as e:
            logger.error(f"Alpha Vantage historical error for {ticker}: {e}")
            self.last_error = str(e)
            return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색"""
        if not self.api_key or not self._check_rate_limit():
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "function": "SYMBOL_SEARCH",
                        "keywords": query,
                        "apikey": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()

                matches = data.get("bestMatches", [])
                if not matches:
                    return []

                self._increment_request()

                results = []
                for item in matches[:10]:
                    results.append({
                        "symbol": item.get("1. symbol"),
                        "name": item.get("2. name"),
                        "type": item.get("3. type"),
                        "exchange": item.get("4. region", "")
                    })

                return results
        except Exception as e:
            logger.error(f"Alpha Vantage search error for {query}: {e}")
            self.last_error = str(e)
            return []
