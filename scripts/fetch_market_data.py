#!/usr/bin/env python3
"""
시장 데이터 수집 스크립트
VIX, Fear & Greed Index, CAPE, Yield Curve 등 실시간 데이터 수집
"""

import json
import os
from datetime import datetime
from pathlib import Path

import requests
import yfinance as yf


def fetch_vix():
    """VIX (변동성 지수) 가져오기 - Yahoo Finance"""
    try:
        vix = yf.Ticker("^VIX")
        data = vix.history(period="1d")
        if not data.empty:
            value = float(data['Close'].iloc[-1])
            return {"value": round(value, 2), "source": "Yahoo Finance", "success": True}
    except Exception as e:
        print(f"VIX 수집 오류: {e}")
    return {"value": 20.0, "source": "기본값", "success": False}


def fetch_fear_greed():
    """CNN Fear & Greed Index 가져오기"""
    try:
        url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            score = data.get("fear_and_greed", {}).get("score", 50)
            rating = data.get("fear_and_greed", {}).get("rating", "Neutral")
            return {
                "value": int(score),
                "rating": rating,
                "source": "CNN",
                "success": True
            }
    except Exception as e:
        print(f"Fear & Greed 수집 오류: {e}")
    return {"value": 50, "rating": "Neutral", "source": "기본값", "success": False}


def fetch_sp500_pe():
    """S&P 500 P/E 비율 가져오기"""
    try:
        spy = yf.Ticker("SPY")
        info = spy.info
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        if pe_ratio:
            return {"value": round(float(pe_ratio), 2), "source": "Yahoo Finance", "success": True}
    except Exception as e:
        print(f"S&P 500 P/E 수집 오류: {e}")
    return {"value": 25.0, "source": "기본값", "success": False}


def fetch_cape():
    """Shiller CAPE 비율 가져오기 (multpl.com 스크래핑)"""
    try:
        url = "https://www.multpl.com/shiller-pe/table/by-month"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            # 간단한 파싱 - 첫 번째 숫자 값 추출
            import re
            # 테이블에서 최신 CAPE 값 찾기
            match = re.search(r'<td class="right">(\d+\.\d+)</td>', response.text)
            if match:
                value = float(match.group(1))
                return {"value": round(value, 2), "source": "multpl.com", "success": True}
    except Exception as e:
        print(f"CAPE 수집 오류: {e}")
    return {"value": 30.0, "source": "기본값", "success": False}


def fetch_yield_curve():
    """수익률 곡선 (10년-2년 스프레드) - FRED 또는 Yahoo Finance"""
    try:
        # 10년 국채 수익률
        tnx = yf.Ticker("^TNX")
        tnx_data = tnx.history(period="1d")

        # 2년 국채 수익률
        twx = yf.Ticker("^IRX")  # 13주 T-Bill (2년 국채 대용)
        twx_data = twx.history(period="1d")

        if not tnx_data.empty:
            ten_year = float(tnx_data['Close'].iloc[-1])
            # 2년 국채 데이터가 없으면 추정
            two_year = float(twx_data['Close'].iloc[-1]) if not twx_data.empty else ten_year - 0.5
            spread = ten_year - two_year
            return {
                "value": round(spread, 2),
                "ten_year": round(ten_year, 2),
                "two_year": round(two_year, 2),
                "source": "Yahoo Finance",
                "success": True
            }
    except Exception as e:
        print(f"수익률 곡선 수집 오류: {e}")
    return {"value": 0.5, "ten_year": 4.5, "two_year": 4.0, "source": "기본값", "success": False}


def fetch_market_indices():
    """주요 시장 지수 가져오기"""
    indices = {
        "sp500": "^GSPC",
        "nasdaq": "^IXIC",
        "dow": "^DJI",
        "kospi": "^KS11",
        "kosdaq": "^KQ11"
    }

    result = {}
    for name, symbol in indices.items():
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="5d")
            if len(data) >= 2:
                current = float(data['Close'].iloc[-1])
                prev = float(data['Close'].iloc[-2])
                change_pct = ((current - prev) / prev) * 100
                result[name] = {
                    "value": round(current, 2),
                    "change_pct": round(change_pct, 2),
                    "success": True
                }
            elif len(data) == 1:
                result[name] = {
                    "value": round(float(data['Close'].iloc[-1]), 2),
                    "change_pct": 0,
                    "success": True
                }
        except Exception as e:
            print(f"{name} 수집 오류: {e}")
            result[name] = {"value": 0, "change_pct": 0, "success": False}

    return result


def determine_market_cycle(vix_value, sp500_change, fear_greed):
    """시장 사이클 판단"""
    # 간단한 휴리스틱 기반 사이클 판단
    score = 0

    # VIX 기반 (낮으면 확장, 높으면 수축)
    if vix_value < 15:
        score += 2
    elif vix_value < 20:
        score += 1
    elif vix_value > 30:
        score -= 2
    elif vix_value > 25:
        score -= 1

    # 공포탐욕 지수 기반
    if fear_greed > 70:
        score += 1  # 탐욕 = 정점 근처
    elif fear_greed > 50:
        score += 2  # 약간 탐욕 = 확장
    elif fear_greed < 30:
        score -= 1  # 공포 = 저점 근처
    elif fear_greed < 50:
        score -= 0.5

    # S&P 500 변화 기반
    if sp500_change > 1:
        score += 1
    elif sp500_change < -1:
        score -= 1

    # 사이클 결정
    if score >= 2:
        return "expansion"
    elif score >= 0.5:
        return "peak"
    elif score >= -1:
        return "contraction"
    else:
        return "trough"


def main():
    """메인 함수 - 모든 시장 데이터 수집 및 저장"""
    print("시장 데이터 수집 시작...")

    # 데이터 수집
    vix_data = fetch_vix()
    fear_greed_data = fetch_fear_greed()
    cape_data = fetch_cape()
    yield_curve_data = fetch_yield_curve()
    sp500_pe_data = fetch_sp500_pe()
    indices_data = fetch_market_indices()

    # 시장 사이클 판단
    sp500_change = indices_data.get("sp500", {}).get("change_pct", 0)
    market_cycle = determine_market_cycle(
        vix_data["value"],
        sp500_change,
        fear_greed_data["value"]
    )

    # 결과 조합
    market_data = {
        "last_updated": datetime.now().isoformat(),
        "vix": vix_data,
        "fear_greed": fear_greed_data,
        "cape": cape_data,
        "yield_curve": yield_curve_data,
        "sp500_pe": sp500_pe_data,
        "indices": indices_data,
        "market_cycle": market_cycle,
        "data_quality": {
            "vix": vix_data["success"],
            "fear_greed": fear_greed_data["success"],
            "cape": cape_data["success"],
            "yield_curve": yield_curve_data["success"]
        }
    }

    # JSON 파일로 저장
    script_dir = Path(__file__).parent
    output_path = script_dir.parent / "docs" / "market-data.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(market_data, f, ensure_ascii=False, indent=2)

    print(f"시장 데이터 저장 완료: {output_path}")
    print(f"VIX: {vix_data['value']} ({vix_data['source']})")
    print(f"Fear & Greed: {fear_greed_data['value']} ({fear_greed_data['source']})")
    print(f"CAPE: {cape_data['value']} ({cape_data['source']})")
    print(f"Yield Curve: {yield_curve_data['value']}bp ({yield_curve_data['source']})")
    print(f"Market Cycle: {market_cycle}")

    return market_data


if __name__ == "__main__":
    main()
