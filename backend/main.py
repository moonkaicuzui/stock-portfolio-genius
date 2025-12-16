"""
Stock Portfolio Genius - Backend API
FastAPI Application Entry Point
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List

from core.config import settings
from models import init_db, get_db
from services.market_data import get_market_data_manager
from services.price_collector import get_price_collector
from api.portfolio import router as portfolio_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create data directory
    os.makedirs("data", exist_ok=True)

    # Initialize database
    init_db()
    logger.info("Database initialized")

    # Initialize market data manager
    manager = get_market_data_manager(
        finnhub_key=settings.FINNHUB_API_KEY,
        tiingo_key=settings.TIINGO_API_KEY,
        alphavantage_key=settings.ALPHA_VANTAGE_API_KEY
    )
    logger.info("Market data manager initialized")

    # Start price collector (background scheduler)
    collector = get_price_collector()
    await collector.start()
    logger.info("Price collector started (auto-collecting every 1 hour)")

    yield

    # Shutdown
    await collector.stop()
    logger.info("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="미국 주식 투자 분석 및 포트폴리오 관리 시스템",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(portfolio_router)


# ============ Health Check ============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    manager = get_market_data_manager()
    provider_status = manager.get_provider_status()

    return {
        "status": "healthy",
        "database": "connected",
        "providers": [
            {
                "name": p.name,
                "available": p.is_available,
                "requests_remaining": p.requests_remaining
            }
            for p in provider_status
        ]
    }


# ============ Market Data API ============

@app.get("/api/stocks/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """종목 검색"""
    try:
        manager = get_market_data_manager()
        results = await manager.search(q)
        return {"results": results}
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{symbol}")
async def get_stock_info(symbol: str):
    """주식 정보 및 시세 조회"""
    try:
        manager = get_market_data_manager()
        data = await manager.get_quote_with_info(symbol)

        if not data.get("currentPrice"):
            raise HTTPException(status_code=404, detail=f"Stock not found: {symbol}")

        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stock info error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{symbol}/quote")
async def get_stock_quote(symbol: str, realtime: bool = False):
    """실시간 시세 조회"""
    try:
        manager = get_market_data_manager()
        quote = await manager.get_quote(symbol, prefer_realtime=realtime)

        if not quote:
            raise HTTPException(status_code=404, detail=f"Quote not found: {symbol}")

        return {
            "ticker": quote.ticker,
            "price": quote.current_price,
            "previousClose": quote.previous_close,
            "open": quote.open_price,
            "high": quote.high,
            "low": quote.low,
            "volume": quote.volume,
            "change": quote.change,
            "changePercent": quote.change_percent,
            "timestamp": quote.timestamp.isoformat(),
            "source": quote.source
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quote error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{symbol}/history")
async def get_historical_data(
    symbol: str,
    period: str = Query("1y", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)$"),
    interval: str = Query("1d", regex="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|5d|1wk|1mo|3mo)$")
):
    """과거 주가 데이터 조회"""
    try:
        manager = get_market_data_manager()
        data = await manager.get_historical(symbol, period, interval)

        if not data:
            raise HTTPException(status_code=404, detail=f"Historical data not found: {symbol}")

        return {
            "symbol": symbol.upper(),
            "period": period,
            "interval": interval,
            "count": len(data),
            "data": [
                {
                    "timestamp": ohlcv.timestamp.isoformat(),
                    "open": ohlcv.open,
                    "high": ohlcv.high,
                    "low": ohlcv.low,
                    "close": ohlcv.close,
                    "volume": ohlcv.volume
                }
                for ohlcv in data
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Historical error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/batch/quotes")
async def get_batch_quotes(symbols: str = Query(..., description="Comma-separated symbols")):
    """여러 종목 시세 일괄 조회"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not symbol_list:
            raise HTTPException(status_code=400, detail="No symbols provided")

        if len(symbol_list) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 symbols allowed")

        manager = get_market_data_manager()
        quotes = await manager.get_multiple_quotes(symbol_list)

        return {
            "count": len(quotes),
            "quotes": {
                ticker: {
                    "price": q.current_price,
                    "change": q.change,
                    "changePercent": q.change_percent,
                    "volume": q.volume
                }
                for ticker, q in quotes.items()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch quotes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/crypto/btc")
async def get_btc_price():
    """비트코인 가격 조회"""
    try:
        manager = get_market_data_manager()
        price = await manager.get_btc_price()

        if not price:
            raise HTTPException(status_code=404, detail="BTC price not available")

        return {"symbol": "BTC", "price": price, "currency": "USD"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"BTC price error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Provider Status API ============

@app.get("/api/providers/status")
async def get_provider_status():
    """데이터 프로바이더 상태 조회"""
    manager = get_market_data_manager()
    status = manager.get_provider_status()

    return {
        "providers": [
            {
                "name": p.name,
                "available": p.is_available,
                "requestsRemaining": p.requests_remaining,
                "resetTime": p.reset_time.isoformat() if p.reset_time else None,
                "lastError": p.last_error
            }
            for p in status
        ]
    }


@app.post("/api/cache/clear")
async def clear_cache(symbol: Optional[str] = None):
    """캐시 초기화"""
    manager = get_market_data_manager()
    manager.clear_cache(symbol)
    return {"message": f"Cache cleared for {symbol or 'all'}"}


# ============ Price Collector API ============

@app.get("/api/collector/status")
async def get_collector_status():
    """가격 수집기 상태 조회"""
    collector = get_price_collector()
    return collector.get_stats()


@app.get("/api/collector/history/{symbol}")
async def get_collected_history(symbol: str, days: int = Query(30, ge=1, le=365)):
    """수집된 가격 히스토리 조회"""
    collector = get_price_collector()
    history = collector.get_history(symbol.upper(), days)

    return {
        "symbol": symbol.upper(),
        "days": days,
        "count": len(history),
        "data": history
    }


@app.post("/api/collector/collect")
async def trigger_collection():
    """수동 가격 수집 트리거"""
    collector = get_price_collector()
    await collector.collect_prices()
    return {"message": "Price collection triggered", "stats": collector.get_stats()}


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
