"""
Database Models for Stock Portfolio Genius
SQLAlchemy ORM Models with SQLite
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, Text, ForeignKey, JSON, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from enum import Enum

# Database Setup
DATABASE_URL = "sqlite:///./data/portfolio.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============ Enums ============

class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class AlertConditionType(str, Enum):
    PRICE_ABOVE = "price_above"
    PRICE_BELOW = "price_below"
    RSI_ABOVE = "rsi_above"
    RSI_BELOW = "rsi_below"
    MACD_CROSS_UP = "macd_cross_up"
    MACD_CROSS_DOWN = "macd_cross_down"
    VOLUME_SPIKE = "volume_spike"
    PERCENT_CHANGE = "percent_change"


class PredictionType(str, Enum):
    PRICE_TARGET = "price_target"
    PRICE_RANGE = "price_range"
    DIRECTION = "direction"
    TIMING = "timing"
    CORRELATION = "correlation"
    SCENARIO = "scenario"


class PredictionStatus(str, Enum):
    PENDING = "pending"
    TRACKING = "tracking"
    COMPLETED = "completed"


class AccuracyGrade(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAIL = "fail"


# ============ Core Models ============

class Holding(Base):
    """보유 종목"""
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), nullable=False, unique=True, index=True)
    quantity = Column(Float, nullable=False, default=0)
    avg_cost = Column(Float, nullable=False, default=0)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    sector = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="holding")


class Transaction(Base):
    """거래 이력"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), ForeignKey("holdings.ticker"), nullable=False, index=True)
    transaction_type = Column(String(4), nullable=False)  # BUY or SELL
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    fees = Column(Float, default=0)
    transaction_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    holding = relationship("Holding", back_populates="transactions")
    journal = relationship("TradeJournal", back_populates="transaction", uselist=False)
    learning_data = relationship("TradeLearningData", back_populates="transaction", uselist=False)


class Watchlist(Base):
    """워치리스트"""
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    """워치리스트 항목"""
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    ticker = Column(String(10), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    alert_price_above = Column(Float, nullable=True)
    alert_price_below = Column(Float, nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")


class Alert(Base):
    """알림 설정"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    condition_type = Column(String(50), nullable=False)
    condition_value = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TradeJournal(Base):
    """매매 일지"""
    __tablename__ = "trade_journal"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    entry_reason = Column(Text, nullable=True)
    exit_reason = Column(Text, nullable=True)
    planned_target = Column(Float, nullable=True)
    planned_stop_loss = Column(Float, nullable=True)
    actual_result = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    emotion_tag = Column(String(20), nullable=True)  # confident, fearful, greedy, neutral
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="journal")


class PriceCache(Base):
    """가격 캐시"""
    __tablename__ = "price_cache"

    ticker = Column(String(10), primary_key=True)
    data = Column(JSON, nullable=False)
    fetched_at = Column(DateTime, nullable=False)
    source = Column(String(20), nullable=False)  # yahoo, finnhub, tiingo, etc.


class PriceHistory(Base):
    """가격 히스토리 (자동 수집)"""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=True)
    source = Column(String(20), nullable=False)  # finnhub, yahoo, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        # 같은 종목, 같은 날짜는 중복 방지
        UniqueConstraint('ticker', 'date', name='uix_ticker_date'),
    )


class Settings(Base):
    """설정"""
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)


class AIRule(Base):
    """AI 규칙"""
    __tablename__ = "ai_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # buy_signal, sell_signal, alert
    conditions = Column(JSON, nullable=False)
    message_template = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============ Learning System Models ============

class TradeLearningData(Base):
    """거래 학습 데이터"""
    __tablename__ = "trade_learning_data"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)

    # 진입 시점 시장 상황
    entry_rsi = Column(Float, nullable=True)
    entry_macd_signal = Column(String(20), nullable=True)
    entry_sma_relation = Column(String(20), nullable=True)
    entry_volume_ratio = Column(Float, nullable=True)
    entry_btc_price = Column(Float, nullable=True)
    entry_btc_change_24h = Column(Float, nullable=True)
    entry_vix = Column(Float, nullable=True)
    entry_sector_momentum = Column(Float, nullable=True)
    market_condition_tag = Column(String(50), nullable=True)

    # 결과
    profit_pct = Column(Float, nullable=True)
    win = Column(Boolean, nullable=True)
    holding_days = Column(Integer, nullable=True)
    max_drawdown_pct = Column(Float, nullable=True)
    max_gain_pct = Column(Float, nullable=True)
    hit_target = Column(Boolean, nullable=True)
    hit_stoploss = Column(Boolean, nullable=True)

    # AI 관련
    ai_suggestion = Column(String(10), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    user_followed_ai = Column(Boolean, nullable=True)
    user_feedback = Column(String(20), nullable=True)  # helpful, not_helpful, neutral
    user_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="learning_data")


class PersonalizedRule(Base):
    """개인화된 규칙 가중치"""
    __tablename__ = "personalized_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False, unique=True)
    original_weight = Column(Float, default=1.0)
    adjusted_weight = Column(Float, default=1.0)

    # 전체 통계
    total_trades = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    winrate = Column(Float, nullable=True)
    avg_profit = Column(Float, nullable=True)

    # 세분화 통계 (JSON)
    by_ticker_stats = Column(JSON, nullable=True)
    by_market_condition_stats = Column(JSON, nullable=True)

    confidence_level = Column(String(10), nullable=True)  # low, medium, high
    last_updated = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DiscoveredPattern(Base):
    """자동 발견된 패턴"""
    __tablename__ = "discovered_patterns"

    id = Column(Integer, primary_key=True, index=True)
    pattern_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    conditions = Column(JSON, nullable=False)

    # 통계
    occurrences = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    winrate = Column(Float, nullable=True)
    avg_profit = Column(Float, nullable=True)
    avg_holding_days = Column(Float, nullable=True)

    # 상태
    status = Column(String(20), default="suggested")  # suggested, approved, active, rejected
    user_approved_at = Column(DateTime, nullable=True)

    discovery_date = Column(DateTime, default=datetime.utcnow)


class AdvisorProgress(Base):
    """비서 레벨 & 경험치"""
    __tablename__ = "advisor_progress"

    id = Column(Integer, primary_key=True, index=True)
    current_level = Column(Integer, default=1)
    total_trades = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)

    # 레벨업 기록
    level_2_unlocked_at = Column(DateTime, nullable=True)
    level_3_unlocked_at = Column(DateTime, nullable=True)
    level_4_unlocked_at = Column(DateTime, nullable=True)

    # 학습 통계
    patterns_discovered = Column(Integer, default=0)
    patterns_approved = Column(Integer, default=0)
    rules_optimized = Column(Integer, default=0)

    last_learning_update = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIFeedbackHistory(Base):
    """피드백 히스토리"""
    __tablename__ = "ai_feedback_history"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_type = Column(String(20), nullable=True)  # buy, sell, hold, alert
    ticker = Column(String(10), nullable=True)
    suggestion_text = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)

    user_feedback = Column(String(20), nullable=True)  # helpful, not_helpful, neutral
    user_notes = Column(Text, nullable=True)

    # 나중에 결과 추적
    actual_outcome = Column(Text, nullable=True)
    outcome_profit_pct = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# ============ Prediction Tracking Models ============

class Prediction(Base):
    """예측 기록"""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(50), unique=True, nullable=False, index=True)

    # 예측 내용
    prediction_type = Column(String(20), nullable=False)
    ticker = Column(String(10), nullable=True)
    current_price = Column(Float, nullable=True)
    target_price = Column(Float, nullable=True)
    direction = Column(String(10), nullable=True)  # up, down, sideways
    expected_change_pct = Column(Float, nullable=True)
    deadline = Column(DateTime, nullable=True)
    confidence = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)

    # 예측 시점 컨텍스트 (JSON)
    context_at_prediction = Column(JSON, nullable=True)
    rules_applied = Column(JSON, nullable=True)

    # 상태
    status = Column(String(20), default="tracking")  # pending, tracking, completed

    # 추적 히스토리 (JSON 배열)
    tracking_history = Column(JSON, nullable=True)
    peak_price = Column(Float, nullable=True)
    peak_date = Column(DateTime, nullable=True)
    lowest_price = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    result = relationship("PredictionResult", back_populates="prediction", uselist=False)


class PredictionResult(Base):
    """예측 결과"""
    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(50), ForeignKey("predictions.prediction_id"), nullable=False)

    # 결과
    completed_at = Column(DateTime, nullable=True)
    completion_reason = Column(String(50), nullable=True)  # target_reached, deadline_expired, manual_close
    final_price = Column(Float, nullable=True)
    actual_change_pct = Column(Float, nullable=True)
    days_to_target = Column(Integer, nullable=True)

    # 정확도 평가
    accuracy_grade = Column(String(20), nullable=True)  # success, partial, fail
    price_accuracy_pct = Column(Float, nullable=True)
    timing_accuracy = Column(String(20), nullable=True)  # early, on_time, late, missed
    timing_variance_days = Column(Integer, nullable=True)

    # 결과 시점 컨텍스트 (JSON)
    context_at_completion = Column(JSON, nullable=True)

    # 학습 포인트 (JSON)
    auto_learnings = Column(JSON, nullable=True)
    user_notes = Column(Text, nullable=True)
    pattern_tags = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prediction = relationship("Prediction", back_populates="result")


class AccumulatedKnowledge(Base):
    """축적된 노하우"""
    __tablename__ = "accumulated_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    knowledge_type = Column(String(50), nullable=False)  # pattern, insight, bias, ticker_specific
    category = Column(String(100), nullable=True)

    # 내용
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True)

    # 통계
    success_rate = Column(Float, nullable=True)
    sample_size = Column(Integer, nullable=True)
    confidence_level = Column(String(20), nullable=True)

    # 메타
    is_active = Column(Boolean, default=True)
    last_validated = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PredictionAccuracyStats(Base):
    """예측 정확도 집계 (캐시 테이블)"""
    __tablename__ = "prediction_accuracy_stats"

    id = Column(Integer, primary_key=True, index=True)

    # 분류 기준
    category_type = Column(String(50), nullable=False)  # overall, by_ticker, by_type, by_market_condition
    category_value = Column(String(100), nullable=True)

    # 통계
    total_predictions = Column(Integer, default=0)
    successes = Column(Integer, default=0)
    partials = Column(Integer, default=0)
    failures = Column(Integer, default=0)
    success_rate = Column(Float, nullable=True)
    avg_price_accuracy = Column(Float, nullable=True)
    avg_timing_variance_days = Column(Float, nullable=True)

    # 기간
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ Database Functions ============

def init_db():
    """데이터베이스 초기화"""
    import os
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)

    # 기본 워치리스트 생성
    db = SessionLocal()
    try:
        if not db.query(Watchlist).first():
            default_watchlist = Watchlist(name="관심 종목")
            db.add(default_watchlist)
            db.commit()

        # 기본 설정 생성
        if not db.query(Settings).filter(Settings.key == "api_keys").first():
            db.add(Settings(key="api_keys", value={}))
            db.commit()

        # 비서 진행도 초기화
        if not db.query(AdvisorProgress).first():
            db.add(AdvisorProgress())
            db.commit()

    finally:
        db.close()


def get_db():
    """데이터베이스 세션 생성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
