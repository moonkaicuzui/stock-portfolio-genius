"""
Base Provider Interface for Market Data
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass
class StockQuote:
    """실시간 시세 데이터"""
    ticker: str
    current_price: float
    previous_close: float
    open_price: float
    high: float
    low: float
    volume: int
    change: float
    change_percent: float
    timestamp: datetime
    source: str


@dataclass
class StockInfo:
    """주식 기본 정보"""
    ticker: str
    name: str
    sector: Optional[str]
    industry: Optional[str]
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    eps: Optional[float]
    dividend_yield: Optional[float]
    fifty_two_week_high: Optional[float]
    fifty_two_week_low: Optional[float]
    avg_volume: Optional[int]
    description: Optional[str]


@dataclass
class OHLCV:
    """캔들 데이터"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass
class ProviderStatus:
    """프로바이더 상태"""
    name: str
    is_available: bool
    requests_remaining: Optional[int]
    reset_time: Optional[datetime]
    last_error: Optional[str]


class MarketDataProvider(ABC):
    """시장 데이터 프로바이더 기본 클래스"""

    name: str = "base"
    priority: int = 0  # 낮을수록 우선순위 높음
    rate_limit: Optional[int] = None  # 분당 요청 수
    daily_limit: Optional[int] = None  # 일일 요청 수

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.request_count = 0
        self.daily_request_count = 0
        self.last_reset = datetime.utcnow()
        self.last_error: Optional[str] = None
        self.is_available = True

    @abstractmethod
    async def get_quote(self, ticker: str) -> Optional[StockQuote]:
        """실시간 시세 조회"""
        pass

    @abstractmethod
    async def get_info(self, ticker: str) -> Optional[StockInfo]:
        """주식 기본 정보 조회"""
        pass

    @abstractmethod
    async def get_historical(
        self,
        ticker: str,
        period: str = "1y",
        interval: str = "1d"
    ) -> List[OHLCV]:
        """과거 가격 데이터 조회"""
        pass

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """종목 검색 (기본 구현: 빈 리스트)"""
        return []

    def get_status(self) -> ProviderStatus:
        """프로바이더 상태 조회"""
        return ProviderStatus(
            name=self.name,
            is_available=self.is_available,
            requests_remaining=self._get_remaining_requests(),
            reset_time=self._get_reset_time(),
            last_error=self.last_error
        )

    def _get_remaining_requests(self) -> Optional[int]:
        """남은 요청 수 계산"""
        if self.rate_limit:
            return max(0, self.rate_limit - self.request_count)
        return None

    def _get_reset_time(self) -> Optional[datetime]:
        """리셋 시간 계산"""
        if self.rate_limit:
            from datetime import timedelta
            return self.last_reset + timedelta(minutes=1)
        return None

    def _check_rate_limit(self) -> bool:
        """Rate limit 체크"""
        from datetime import timedelta

        now = datetime.utcnow()

        # 분당 리셋
        if now - self.last_reset > timedelta(minutes=1):
            self.request_count = 0
            self.last_reset = now

        # 일일 리셋 (자정 기준)
        if now.date() > self.last_reset.date():
            self.daily_request_count = 0

        # Rate limit 체크
        if self.rate_limit and self.request_count >= self.rate_limit:
            return False

        if self.daily_limit and self.daily_request_count >= self.daily_limit:
            return False

        return True

    def _increment_request(self):
        """요청 카운트 증가"""
        self.request_count += 1
        self.daily_request_count += 1
