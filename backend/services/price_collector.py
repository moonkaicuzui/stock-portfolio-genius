"""
Price Collector Service
자동으로 보유 종목의 가격을 수집하여 DB에 저장
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func

from models import SessionLocal, Holding, PriceHistory
from services.market_data import get_market_data_manager

logger = logging.getLogger(__name__)


class PriceCollector:
    """가격 수집기 - 보유 종목 가격을 주기적으로 수집"""

    def __init__(self):
        self.is_running = False
        self.collection_interval = 3600  # 1시간 (초)
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """스케줄러 시작"""
        if self.is_running:
            logger.info("Price collector already running")
            return

        self.is_running = True
        self._task = asyncio.create_task(self._run_scheduler())
        logger.info("Price collector started (interval: 1 hour)")

    async def stop(self):
        """스케줄러 중지"""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Price collector stopped")

    async def _run_scheduler(self):
        """스케줄러 메인 루프"""
        # 시작 시 즉시 한번 수집
        await self.collect_prices()

        while self.is_running:
            try:
                # 1시간 대기
                await asyncio.sleep(self.collection_interval)

                # 가격 수집
                await self.collect_prices()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                # 에러 발생해도 계속 실행
                await asyncio.sleep(60)  # 1분 후 재시도

    async def collect_prices(self):
        """모든 보유 종목의 현재 가격 수집"""
        db = SessionLocal()
        try:
            # 보유 종목 조회
            holdings = db.query(Holding).filter(Holding.quantity > 0).all()
            tickers = [h.ticker for h in holdings]

            if not tickers:
                logger.info("No holdings to collect prices for")
                return

            logger.info(f"Collecting prices for {len(tickers)} tickers: {tickers}")

            # 시장 데이터 매니저
            manager = get_market_data_manager()

            # 각 종목 가격 수집
            collected = 0
            for ticker in tickers:
                try:
                    quote = await manager.get_quote(ticker, prefer_realtime=True)

                    if quote:
                        # DB에 저장 (중복 시 업데이트)
                        await self._save_price(db, ticker, quote)
                        collected += 1
                    else:
                        logger.warning(f"No quote data for {ticker}")

                except Exception as e:
                    logger.error(f"Error collecting {ticker}: {e}")

            logger.info(f"Collected {collected}/{len(tickers)} prices")

        except Exception as e:
            logger.error(f"Price collection error: {e}")
        finally:
            db.close()

    async def _save_price(self, db: Session, ticker: str, quote):
        """가격 데이터 DB 저장"""
        try:
            # 오늘 날짜 (시간 제외)
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

            # 이미 오늘 데이터가 있는지 확인
            existing = db.query(PriceHistory).filter(
                PriceHistory.ticker == ticker,
                PriceHistory.date == today
            ).first()

            if existing:
                # 업데이트 (최신 가격으로)
                existing.close = quote.price
                existing.high = max(existing.high or quote.price, quote.high or quote.price)
                existing.low = min(existing.low or quote.price, quote.low or quote.price)
                existing.volume = quote.volume or existing.volume
                existing.source = quote.source
            else:
                # 새로 추가
                price_record = PriceHistory(
                    ticker=ticker,
                    date=today,
                    open=quote.open,
                    high=quote.high,
                    low=quote.low,
                    close=quote.price,
                    volume=quote.volume,
                    source=quote.source
                )
                db.add(price_record)

            db.commit()
            logger.debug(f"Saved price for {ticker}: ${quote.price}")

        except Exception as e:
            db.rollback()
            logger.error(f"Error saving price for {ticker}: {e}")

    async def collect_single(self, ticker: str) -> bool:
        """단일 종목 수집 (수동)"""
        db = SessionLocal()
        try:
            manager = get_market_data_manager()
            quote = await manager.get_quote(ticker, prefer_realtime=True)

            if quote:
                await self._save_price(db, ticker, quote)
                return True
            return False
        finally:
            db.close()

    def get_history(self, ticker: str, days: int = 30) -> List[dict]:
        """저장된 가격 히스토리 조회"""
        db = SessionLocal()
        try:
            since = datetime.now() - timedelta(days=days)
            records = db.query(PriceHistory).filter(
                PriceHistory.ticker == ticker,
                PriceHistory.date >= since
            ).order_by(PriceHistory.date.asc()).all()

            return [
                {
                    "timestamp": r.date.isoformat(),
                    "open": r.open,
                    "high": r.high,
                    "low": r.low,
                    "close": r.close,
                    "volume": r.volume,
                    "source": r.source
                }
                for r in records
            ]
        finally:
            db.close()

    def get_stats(self) -> dict:
        """수집 통계"""
        db = SessionLocal()
        try:
            total_records = db.query(func.count(PriceHistory.id)).scalar()
            unique_tickers = db.query(func.count(func.distinct(PriceHistory.ticker))).scalar()

            latest = db.query(PriceHistory).order_by(
                PriceHistory.created_at.desc()
            ).first()

            return {
                "total_records": total_records,
                "unique_tickers": unique_tickers,
                "last_collection": latest.created_at.isoformat() if latest else None,
                "is_running": self.is_running,
                "interval_seconds": self.collection_interval
            }
        finally:
            db.close()


# 싱글톤 인스턴스
_collector: Optional[PriceCollector] = None


def get_price_collector() -> PriceCollector:
    """가격 수집기 인스턴스 반환"""
    global _collector
    if _collector is None:
        _collector = PriceCollector()
    return _collector
