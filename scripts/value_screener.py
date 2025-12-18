#!/usr/bin/env python3
"""
Value Investing Screener
Fetches fundamental & technical data, calculates composite Value Score
"""

import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import Optional, Dict, List, Any

try:
    import yfinance as yf
    import numpy as np
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'yfinance', 'numpy'])
    import yfinance as yf
    import numpy as np


# S&P 500 대표 종목 (초기 스크리닝용)
DEFAULT_SYMBOLS = [
    # Tech
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "AMD", "INTC", "CRM",
    # Finance
    "JPM", "BAC", "WFC", "GS", "MS", "V", "MA", "AXP", "BLK", "C",
    # Healthcare
    "JNJ", "UNH", "PFE", "ABBV", "MRK", "TMO", "ABT", "DHR", "LLY", "BMY",
    # Consumer
    "PG", "KO", "PEP", "WMT", "COST", "HD", "MCD", "NKE", "SBUX", "DIS",
    # Industrial
    "CAT", "BA", "GE", "MMM", "HON", "UPS", "RTX", "LMT", "DE", "UNP",
    # Energy
    "XOM", "CVX", "COP", "SLB", "EOG", "PSX", "VLO", "MPC", "OXY", "KMI"
]

# 10년 미국 국채 수익률 (기준값, 실제로는 API로 가져와야 함)
TREASURY_YIELD_10Y = 4.5  # %


def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """RSI (Relative Strength Index) 계산"""
    if len(prices) < period + 1:
        return 50.0  # 기본값

    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return round(rsi, 2)


def calculate_bollinger_position(prices: List[float], period: int = 20) -> float:
    """볼린저 밴드 내 위치 (0-100%)"""
    if len(prices) < period:
        return 50.0

    recent_prices = prices[-period:]
    sma = np.mean(recent_prices)
    std = np.std(recent_prices)

    if std == 0:
        return 50.0

    upper_band = sma + (2 * std)
    lower_band = sma - (2 * std)

    current_price = prices[-1]
    position = (current_price - lower_band) / (upper_band - lower_band) * 100
    return round(max(0, min(100, position)), 2)


def get_growth_tier(revenue_growth: float, earnings_growth: float) -> str:
    """성장률 기반 티어 분류"""
    avg_growth = (revenue_growth + earnings_growth) / 2 if earnings_growth else revenue_growth

    if avg_growth >= 25:
        return "hypergrowth"
    elif avg_growth >= 15:
        return "high_growth"
    elif avg_growth >= 5:
        return "moderate_growth"
    elif avg_growth >= 0:
        return "stable"
    else:
        return "declining"


def calculate_per_score(trailing_pe: float, forward_pe: float, growth_tier: str) -> float:
    """PER 점수 계산 (0-100)"""
    # 성장 티어별 가중치
    tier_weights = {
        "hypergrowth": {"trailing": 0.3, "forward": 0.7},
        "high_growth": {"trailing": 0.4, "forward": 0.6},
        "moderate_growth": {"trailing": 0.5, "forward": 0.5},
        "stable": {"trailing": 0.6, "forward": 0.4},
        "declining": {"trailing": 0.7, "forward": 0.3}
    }

    weights = tier_weights.get(growth_tier, {"trailing": 0.5, "forward": 0.5})

    # PER 점수 (낮을수록 좋음, 0-50 범위를 100-0으로 변환)
    def pe_to_score(pe: float) -> float:
        if pe <= 0 or pe > 100:
            return 0
        if pe <= 10:
            return 100
        elif pe <= 15:
            return 80
        elif pe <= 20:
            return 60
        elif pe <= 30:
            return 40
        elif pe <= 50:
            return 20
        else:
            return 0

    trailing_score = pe_to_score(trailing_pe) if trailing_pe and trailing_pe > 0 else 50
    forward_score = pe_to_score(forward_pe) if forward_pe and forward_pe > 0 else 50

    weighted_score = (trailing_score * weights["trailing"]) + (forward_score * weights["forward"])
    return round(weighted_score, 2)


def calculate_pbr_score(pbr: float) -> float:
    """PBR 점수 계산 (0-100)"""
    if pbr <= 0 or pbr > 20:
        return 0
    if pbr <= 1:
        return 100
    elif pbr <= 1.5:
        return 80
    elif pbr <= 2:
        return 60
    elif pbr <= 3:
        return 40
    elif pbr <= 5:
        return 20
    else:
        return 10


def calculate_psr_score(psr: float) -> float:
    """PSR 점수 계산 (0-100)"""
    if psr <= 0 or psr > 20:
        return 0
    if psr <= 1:
        return 100
    elif psr <= 2:
        return 80
    elif psr <= 3:
        return 60
    elif psr <= 5:
        return 40
    elif psr <= 10:
        return 20
    else:
        return 10


def calculate_ev_ebitda_score(ev_ebitda: float) -> float:
    """EV/EBITDA 점수 계산 (0-100)"""
    if ev_ebitda <= 0 or ev_ebitda > 50:
        return 0
    if ev_ebitda <= 6:
        return 100
    elif ev_ebitda <= 8:
        return 80
    elif ev_ebitda <= 10:
        return 60
    elif ev_ebitda <= 15:
        return 40
    elif ev_ebitda <= 20:
        return 20
    else:
        return 10


def calculate_earnings_yield_score(earnings_yield: float, treasury_yield: float = TREASURY_YIELD_10Y) -> float:
    """Earnings Yield 스프레드 점수 계산 (0-100)"""
    spread = earnings_yield - treasury_yield

    if spread >= 5:
        return 100
    elif spread >= 3:
        return 80
    elif spread >= 1:
        return 60
    elif spread >= 0:
        return 40
    elif spread >= -2:
        return 20
    else:
        return 0


def calculate_technical_score(
    price: float,
    sma_50: float,
    sma_200: float,
    rsi: float,
    week_52_high: float,
    week_52_low: float,
    bollinger_position: float
) -> float:
    """기술적 지표 점수 계산 (0-100)"""
    scores = []

    # SMA 50 vs 200 (골든크로스/데드크로스)
    if sma_50 > 0 and sma_200 > 0:
        if sma_50 > sma_200:
            sma_score = 70 + min(30, (sma_50 / sma_200 - 1) * 100)
        else:
            sma_score = 30 - min(30, (1 - sma_50 / sma_200) * 100)
        scores.append(max(0, min(100, sma_score)))

    # RSI (30-70이 중립, 극단값일수록 점수 변동)
    if rsi <= 30:
        rsi_score = 90  # 과매도 - 매수 기회
    elif rsi <= 40:
        rsi_score = 70
    elif rsi <= 60:
        rsi_score = 50  # 중립
    elif rsi <= 70:
        rsi_score = 40
    else:
        rsi_score = 20  # 과매수 - 주의
    scores.append(rsi_score)

    # 52주 고점/저점 대비 위치
    if week_52_high > 0 and week_52_low > 0 and week_52_high > week_52_low:
        position_52w = (price - week_52_low) / (week_52_high - week_52_low) * 100
        # 저점 근처가 매수 기회 (가치 투자 관점)
        if position_52w <= 20:
            pos_score = 90
        elif position_52w <= 40:
            pos_score = 70
        elif position_52w <= 60:
            pos_score = 50
        elif position_52w <= 80:
            pos_score = 30
        else:
            pos_score = 10
        scores.append(pos_score)

    # 볼린저 밴드 위치
    if bollinger_position <= 20:
        bb_score = 80  # 하단 밴드 근처 - 매수 기회
    elif bollinger_position <= 40:
        bb_score = 60
    elif bollinger_position <= 60:
        bb_score = 50
    elif bollinger_position <= 80:
        bb_score = 40
    else:
        bb_score = 20  # 상단 밴드 근처 - 주의
    scores.append(bb_score)

    return round(np.mean(scores), 2) if scores else 50.0


def calculate_value_score(fundamental_score: float, technical_score: float) -> float:
    """종합 Value Score 계산 (0-100)

    기본 가중치: 펀더멘털 70% + 기술적 30%
    """
    return round(fundamental_score * 0.7 + technical_score * 0.3, 2)


def fetch_stock_valuation(symbol: str) -> Optional[Dict[str, Any]]:
    """개별 종목의 밸류에이션 데이터 수집"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="1y")

        if hist.empty:
            print(f"  ⚠️ {symbol}: No historical data")
            return None

        # 기본 정보
        current_price = hist['Close'].iloc[-1]
        prices = hist['Close'].tolist()

        # 펀더멘털 지표
        trailing_pe = info.get('trailingPE', 0) or 0
        forward_pe = info.get('forwardPE', 0) or 0
        pb_ratio = info.get('priceToBook', 0) or 0
        ps_ratio = info.get('priceToSalesTrailing12Months', 0) or 0
        ev_ebitda = info.get('enterpriseToEbitda', 0) or 0

        # Earnings Yield 계산
        earnings_yield = (1 / trailing_pe * 100) if trailing_pe and trailing_pe > 0 else 0

        # 성장률
        revenue_growth = (info.get('revenueGrowth', 0) or 0) * 100
        earnings_growth = (info.get('earningsGrowth', 0) or 0) * 100

        # 성장 티어
        growth_tier = get_growth_tier(revenue_growth, earnings_growth)

        # 기술적 지표
        sma_50 = np.mean(prices[-50:]) if len(prices) >= 50 else current_price
        sma_200 = np.mean(prices[-200:]) if len(prices) >= 200 else current_price
        rsi = calculate_rsi(prices)
        week_52_high = info.get('fiftyTwoWeekHigh', 0) or max(prices)
        week_52_low = info.get('fiftyTwoWeekLow', 0) or min(prices)
        bollinger_position = calculate_bollinger_position(prices)

        # 점수 계산
        per_score = calculate_per_score(trailing_pe, forward_pe, growth_tier)
        pbr_score = calculate_pbr_score(pb_ratio)
        psr_score = calculate_psr_score(ps_ratio)
        ev_ebitda_score = calculate_ev_ebitda_score(ev_ebitda)
        ey_score = calculate_earnings_yield_score(earnings_yield)

        # 펀더멘털 종합 점수 (가중 평균)
        fundamental_weights = {
            "per": 0.30,
            "pbr": 0.20,
            "psr": 0.15,
            "ev_ebitda": 0.20,
            "earnings_yield": 0.15
        }

        fundamental_score = (
            per_score * fundamental_weights["per"] +
            pbr_score * fundamental_weights["pbr"] +
            psr_score * fundamental_weights["psr"] +
            ev_ebitda_score * fundamental_weights["ev_ebitda"] +
            ey_score * fundamental_weights["earnings_yield"]
        )

        # 기술적 종합 점수
        technical_score = calculate_technical_score(
            current_price, sma_50, sma_200, rsi,
            week_52_high, week_52_low, bollinger_position
        )

        # 최종 Value Score
        value_score = calculate_value_score(fundamental_score, technical_score)

        # 투자 등급 결정
        if value_score >= 80:
            grade = "A+"
            recommendation = "Strong Buy"
        elif value_score >= 70:
            grade = "A"
            recommendation = "Buy"
        elif value_score >= 60:
            grade = "B+"
            recommendation = "Moderate Buy"
        elif value_score >= 50:
            grade = "B"
            recommendation = "Hold"
        elif value_score >= 40:
            grade = "C"
            recommendation = "Weak Hold"
        else:
            grade = "D"
            recommendation = "Avoid"

        return {
            "symbol": symbol,
            "name": info.get('shortName', symbol),
            "sector": info.get('sector', 'Unknown'),
            "industry": info.get('industry', 'Unknown'),
            "price": round(current_price, 2),
            "market_cap": info.get('marketCap', 0),

            # 펀더멘털 지표
            "fundamentals": {
                "trailing_pe": round(trailing_pe, 2),
                "forward_pe": round(forward_pe, 2),
                "pb_ratio": round(pb_ratio, 2),
                "ps_ratio": round(ps_ratio, 2),
                "ev_ebitda": round(ev_ebitda, 2),
                "earnings_yield": round(earnings_yield, 2),
                "revenue_growth": round(revenue_growth, 2),
                "earnings_growth": round(earnings_growth, 2),
                "growth_tier": growth_tier
            },

            # 기술적 지표
            "technicals": {
                "sma_50": round(sma_50, 2),
                "sma_200": round(sma_200, 2),
                "rsi": rsi,
                "week_52_high": round(week_52_high, 2),
                "week_52_low": round(week_52_low, 2),
                "bollinger_position": bollinger_position,
                "price_vs_sma50": round((current_price / sma_50 - 1) * 100, 2) if sma_50 else 0,
                "price_vs_sma200": round((current_price / sma_200 - 1) * 100, 2) if sma_200 else 0
            },

            # 점수
            "scores": {
                "per_score": per_score,
                "pbr_score": pbr_score,
                "psr_score": psr_score,
                "ev_ebitda_score": ev_ebitda_score,
                "earnings_yield_score": ey_score,
                "fundamental_score": round(fundamental_score, 2),
                "technical_score": technical_score,
                "value_score": value_score
            },

            # 투자 등급
            "grade": grade,
            "recommendation": recommendation,

            "fetched_at": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"  ❌ {symbol}: Error - {e}")
        return None


def run_screener(symbols: List[str] = None, min_score: float = 0) -> Dict[str, Any]:
    """스크리너 실행"""
    if symbols is None:
        symbols = DEFAULT_SYMBOLS

    print(f"\n🔍 Value Screener: Analyzing {len(symbols)} stocks...")
    print("=" * 60)

    results = []
    failed = []

    for i, symbol in enumerate(symbols, 1):
        print(f"  [{i}/{len(symbols)}] Fetching {symbol}...", end=" ")
        data = fetch_stock_valuation(symbol)
        if data:
            if data["scores"]["value_score"] >= min_score:
                results.append(data)
                print(f"✅ Score: {data['scores']['value_score']}")
            else:
                print(f"⏭️ Score: {data['scores']['value_score']} (below {min_score})")
        else:
            failed.append(symbol)
            print("❌ Failed")

    # 점수 기준 정렬
    results.sort(key=lambda x: x["scores"]["value_score"], reverse=True)

    # 통계
    if results:
        scores = [r["scores"]["value_score"] for r in results]
        stats = {
            "total_analyzed": len(symbols),
            "successful": len(results),
            "failed": len(failed),
            "avg_score": round(np.mean(scores), 2),
            "max_score": max(scores),
            "min_score": min(scores),
            "grade_distribution": {
                "A+": len([r for r in results if r["grade"] == "A+"]),
                "A": len([r for r in results if r["grade"] == "A"]),
                "B+": len([r for r in results if r["grade"] == "B+"]),
                "B": len([r for r in results if r["grade"] == "B"]),
                "C": len([r for r in results if r["grade"] == "C"]),
                "D": len([r for r in results if r["grade"] == "D"])
            }
        }
    else:
        stats = {
            "total_analyzed": len(symbols),
            "successful": 0,
            "failed": len(failed),
            "avg_score": 0,
            "max_score": 0,
            "min_score": 0,
            "grade_distribution": {}
        }

    return {
        "screener_results": results,
        "statistics": stats,
        "failed_symbols": failed,
        "last_updated": datetime.now().isoformat(),
        "screening_criteria": {
            "min_score": min_score,
            "symbols_count": len(symbols)
        }
    }


def main():
    """메인 실행"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # 스크리너 실행
    screener_data = run_screener(min_score=0)

    # 결과 저장
    data_path = project_root / "data" / "screener.json"
    with open(data_path, 'w') as f:
        json.dump(screener_data, f, indent=2)
    print(f"\n📁 Saved screener data to {data_path}")

    # docs 폴더에도 저장 (GitHub Pages용)
    docs_data_path = project_root / "docs" / "screener.json"
    with open(docs_data_path, 'w') as f:
        json.dump(screener_data, f, indent=2)
    print(f"📁 Saved screener data to {docs_data_path}")

    # 결과 요약 출력
    stats = screener_data["statistics"]
    print("\n" + "=" * 60)
    print("📊 SCREENER RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total Analyzed: {stats['total_analyzed']}")
    print(f"Successful: {stats['successful']}")
    print(f"Failed: {stats['failed']}")
    print(f"Average Score: {stats['avg_score']}")
    print(f"Score Range: {stats['min_score']} - {stats['max_score']}")
    print("\nGrade Distribution:")
    for grade, count in stats['grade_distribution'].items():
        print(f"  {grade}: {count} stocks")

    # Top 10 출력
    print("\n🏆 TOP 10 VALUE STOCKS:")
    print("-" * 60)
    for i, stock in enumerate(screener_data["screener_results"][:10], 1):
        print(f"{i:2}. {stock['symbol']:6} | Score: {stock['scores']['value_score']:5.1f} | "
              f"Grade: {stock['grade']:2} | {stock['recommendation']}")
        print(f"    PER: {stock['fundamentals']['trailing_pe']:6.1f} | "
              f"PBR: {stock['fundamentals']['pb_ratio']:5.2f} | "
              f"RSI: {stock['technicals']['rsi']:5.1f}")

    return screener_data


if __name__ == "__main__":
    main()
