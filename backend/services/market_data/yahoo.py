"""
Yahoo Finance Data Provider (yfinance)
- 무료, 무제한 (단, 15분 지연)
- Primary source for historical data
"""

import yfinance as yf
from datetime import datetime
from typing import Optional, List, Dict, Any
import pandas as pd
import logging

from .base import MarketDataProvider, StockQuote, StockInfo, OHLCV

logger = logging.getLogger(__name__)


class YahooFinanceProvider(MarketDataProvider):
    """Yahoo Finance 데이터 프로바이더"""

    name = "yahoo"
    priority = 1  # Primary provider
    rate_limit = None  # No rate limit
    daily_limit = None

    def __init__(self):
        super().__init__()
        self._cache: Dict[str, Any] = {}

    async def get_quote(self, ticker: str) -> Optional[StockQuote]:
        """실시간 시세 조회 (15분 지연)"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            if not info or "regularMarketPrice" not in info:
                return None

            current_price = info.get("regularMarketPrice", 0)
            previous_close = info.get("regularMarketPreviousClose", current_price)
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close else 0

            return StockQuote(
                ticker=ticker.upper(),
                current_price=current_price,
                previous_close=previous_close,
                open_price=info.get("regularMarketOpen", 0),
                high=info.get("regularMarketDayHigh", 0),
                low=info.get("regularMarketDayLow", 0),
                volume=info.get("regularMarketVolume", 0),
                change=change,
                change_percent=change_percent,
                timestamp=datetime.utcnow(),
                source=self.name
            )
        except Exception as e:
            logger.error(f"Yahoo Finance quote error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            if not info:
                return None

            return StockInfo(
                ticker=ticker.upper(),
                name=info.get("longName") or info.get("shortName", ticker),
                sector=info.get("sector"),
                industry=info.get("industry"),
                market_cap=info.get("marketCap"),
                pe_ratio=info.get("trailingPE"),
                eps=info.get("trailingEps"),
                dividend_yield=info.get("dividendYield"),
                fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
                fifty_two_week_low=info.get("fiftyTwoWeekLow"),
                avg_volume=info.get("averageVolume"),
                description=info.get("longBusinessSummary")
            )
        except Exception as e:
            logger.error(f"Yahoo Finance info error for {ticker}: {e}")
            self.last_error = str(e)
            return None

    async def get_historical(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> List[OHLCV]:
        """과거 가격 데이터 조회"""
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period=period, interval=interval)

            if df.empty:
                return []

            result = []
            for timestamp, row in df.iterrows():
                result.append(OHLCV(
                    timestamp=timestamp.to_pydatetime(),
                    open=row["Open"],
                    high=row["High"],
                    low=row["Low"],
                    close=row["Close"],
                    volume=int(row["Volume"])
                ))

            return result
        except Exception as e:
            logger.error(f"Yahoo Finance historical error for {ticker}: {e}")
            self.last_error = str(e)
            return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색"""
        try:
            # yfinance doesn't have a direct search API
            # Try to get info for the exact ticker
            stock = yf.Ticker(query.upper())
            info = stock.info

            if info and info.get("regularMarketPrice"):
                return [{
                    "symbol": query.upper(),
                    "name": info.get("longName") or info.get("shortName", query),
                    "type": info.get("quoteType", "EQUITY"),
                    "exchange": info.get("exchange", ""),
                }]
            return []
        except Exception as e:
            logger.error(f"Yahoo Finance search error for {query}: {e}")
            return []

    async def get_crypto_price(self, symbol: str = "BTC") -> Optional[float]:
        """암호화폐 가격 조회"""
        try:
            ticker = f"{symbol}-USD"
            stock = yf.Ticker(ticker)
            info = stock.info
            return info.get("regularMarketPrice")
        except Exception as e:
            logger.error(f"Yahoo Finance crypto error for {symbol}: {e}")
            return None
