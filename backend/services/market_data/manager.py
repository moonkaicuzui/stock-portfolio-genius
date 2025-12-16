"""
Market Data Manager
- Multi-provider fallback system
- Caching with TTL
- Automatic provider switching
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from dataclasses import dataclass

from .base import MarketDataProvider, StockQuote, StockInfo, OHLCV, ProviderStatus
from .yahoo import YahooFinanceProvider
from .finnhub import FinnhubProvider
from .tiingo import TiingoProvider
from .alphavantage import AlphaVantageProvider

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """캐시 엔트리"""
    data: Any
    timestamp: datetime
    source: str


class MarketDataManager:
    """
    다중 프로바이더 시장 데이터 매니저

    우선순위:
    1. yfinance (Yahoo Finance) - 무제한, 15분 지연
    2. Finnhub - 60회/분, 실시간
    3. Tiingo - 1000회/일, 실시간
    4. Alpha Vantage - 25회/일, 실시간

    폴백 시스템: API 실패 시 자동으로 다음 API 시도
    캐싱: 메모리 캐시 (1분 TTL for 시세, 1시간 TTL for 정보)
    """

    QUOTE_CACHE_TTL = 60  # 1 minute
    INFO_CACHE_TTL = 3600  # 1 hour
    HISTORICAL_CACHE_TTL = 300  # 5 minutes

    def __init__(
        self,
        finnhub_key: Optional[str] = None,
        tiingo_key: Optional[str] = None,
        alphavantage_key: Optional[str] = None
    ):
        # Initialize providers
        self.providers: List[MarketDataProvider] = [
            YahooFinanceProvider(),
            FinnhubProvider(finnhub_key),
            TiingoProvider(tiingo_key),
            AlphaVantageProvider(alphavantage_key),
        ]

        # Sort by priority
        self.providers.sort(key=lambda p: p.priority)

        # Cache
        self._quote_cache: Dict[str, CacheEntry] = {}
        self._info_cache: Dict[str, CacheEntry] = {}
        self._historical_cache: Dict[str, CacheEntry] = {}

        logger.info(f"MarketDataManager initialized with {len(self.providers)} providers")

    def _is_cache_valid(self, cache_entry: Optional[CacheEntry], ttl_seconds: int) -> bool:
        """캐시 유효성 검사"""
        if not cache_entry:
            return False
        age = (datetime.utcnow() - cache_entry.timestamp).total_seconds()
        return age < ttl_seconds

    async def get_quote(self, ticker: str, prefer_realtime: bool = False) -> Optional[StockQuote]:
        """
        실시간 시세 조회

        Args:
            ticker: 종목 심볼
            prefer_realtime: True이면 실시간 데이터 소스 우선

        Returns:
            StockQuote or None
        """
        ticker = ticker.upper()
        cache_key = ticker

        # Check cache
        if not prefer_realtime and self._is_cache_valid(
            self._quote_cache.get(cache_key),
            self.QUOTE_CACHE_TTL
        ):
            logger.debug(f"Quote cache hit for {ticker}")
            return self._quote_cache[cache_key].data

        # Try providers in priority order
        providers = self.providers.copy()
        if prefer_realtime:
            # Put realtime providers first (non-Yahoo)
            providers.sort(key=lambda p: 0 if p.name != "yahoo" else 1)

        for provider in providers:
            if not provider.is_available:
                continue

            try:
                quote = await provider.get_quote(ticker)
                if quote:
                    # Cache the result
                    self._quote_cache[cache_key] = CacheEntry(
                        data=quote,
                        timestamp=datetime.utcnow(),
                        source=provider.name
                    )
                    logger.debug(f"Quote fetched from {provider.name} for {ticker}")
                    return quote
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed for {ticker}: {e}")
                continue

        logger.error(f"All providers failed for quote {ticker}")
        return None

    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        ticker = ticker.upper()
        cache_key = ticker

        # Check cache
        if self._is_cache_valid(
            self._info_cache.get(cache_key),
            self.INFO_CACHE_TTL
        ):
            logger.debug(f"Info cache hit for {ticker}")
            return self._info_cache[cache_key].data

        # Try providers
        for provider in self.providers:
            if not provider.is_available:
                continue

            try:
                info = await provider.get_info(ticker)
                if info:
                    self._info_cache[cache_key] = CacheEntry(
                        data=info,
                        timestamp=datetime.utcnow(),
                        source=provider.name
                    )
                    logger.debug(f"Info fetched from {provider.name} for {ticker}")
                    return info
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed for info {ticker}: {e}")
                continue

        logger.error(f"All providers failed for info {ticker}")
        return None

    async def get_historical(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> List[OHLCV]:
        """과거 가격 데이터 조회"""
        ticker = ticker.upper()
        cache_key = f"{ticker}_{period}_{interval}"

        # Check cache
        if self._is_cache_valid(
            self._historical_cache.get(cache_key),
            self.HISTORICAL_CACHE_TTL
        ):
            logger.debug(f"Historical cache hit for {cache_key}")
            return self._historical_cache[cache_key].data

        # Try providers
        for provider in self.providers:
            if not provider.is_available:
                continue

            try:
                data = await provider.get_historical(ticker, period, interval)
                if data:
                    self._historical_cache[cache_key] = CacheEntry(
                        data=data,
                        timestamp=datetime.utcnow(),
                        source=provider.name
                    )
                    logger.debug(f"Historical fetched from {provider.name} for {cache_key}")
                    return data
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed for historical {ticker}: {e}")
                continue

        logger.error(f"All providers failed for historical {ticker}")
        return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색"""
        for provider in self.providers:
            if not provider.is_available:
                continue

            try:
                results = await provider.search(query)
                if results:
                    return results
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed for search {query}: {e}")
                continue

        return []

    async def get_multiple_quotes(self, tickers: List[str]) -> Dict[str, StockQuote]:
        """여러 종목 시세 일괄 조회"""
        tasks = [self.get_quote(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        quotes = {}
        for ticker, result in zip(tickers, results):
            if isinstance(result, StockQuote):
                quotes[ticker.upper()] = result

        return quotes

    async def get_btc_price(self) -> Optional[float]:
        """비트코인 가격 조회"""
        # Use Yahoo Finance for crypto
        yahoo = self.providers[0]  # Yahoo is always first
        if hasattr(yahoo, 'get_crypto_price'):
            return await yahoo.get_crypto_price("BTC")
        return None

    def get_provider_status(self) -> List[ProviderStatus]:
        """모든 프로바이더 상태 조회"""
        return [provider.get_status() for provider in self.providers]

    def clear_cache(self, ticker: Optional[str] = None):
        """캐시 초기화"""
        if ticker:
            ticker = ticker.upper()
            self._quote_cache.pop(ticker, None)
            self._info_cache.pop(ticker, None)
            # Clear historical cache for this ticker
            keys_to_remove = [k for k in self._historical_cache if k.startswith(ticker)]
            for key in keys_to_remove:
                self._historical_cache.pop(key, None)
        else:
            self._quote_cache.clear()
            self._info_cache.clear()
            self._historical_cache.clear()

    async def get_quote_with_info(self, ticker: str) -> Dict[str, Any]:
        """시세와 기본 정보를 함께 조회"""
        quote, info = await asyncio.gather(
            self.get_quote(ticker),
            self.get_info(ticker),
            return_exceptions=True
        )

        result = {"ticker": ticker.upper()}

        if isinstance(quote, StockQuote):
            result.update({
                "currentPrice": quote.current_price,
                "previousClose": quote.previous_close,
                "open": quote.open_price,
                "high": quote.high,
                "low": quote.low,
                "volume": quote.volume,
                "change": quote.change,
                "changePercent": quote.change_percent,
                "timestamp": quote.timestamp.isoformat(),
                "priceSource": quote.source,
            })

        if isinstance(info, StockInfo):
            result.update({
                "name": info.name,
                "sector": info.sector,
                "industry": info.industry,
                "marketCap": info.market_cap,
                "peRatio": info.pe_ratio,
                "eps": info.eps,
                "dividendYield": info.dividend_yield,
                "fiftyTwoWeekHigh": info.fifty_two_week_high,
                "fiftyTwoWeekLow": info.fifty_two_week_low,
                "avgVolume": info.avg_volume,
                "description": info.description,
            })

        return result


# Global instance
_manager: Optional[MarketDataManager] = None


def get_market_data_manager(
    finnhub_key: Optional[str] = None,
    tiingo_key: Optional[str] = None,
    alphavantage_key: Optional[str] = None
) -> MarketDataManager:
    """MarketDataManager 싱글톤 인스턴스 반환"""
    global _manager
    if _manager is None:
        _manager = MarketDataManager(
            finnhub_key=finnhub_key,
            tiingo_key=tiingo_key,
            alphavantage_key=alphavantage_key
        )
    return _manager
