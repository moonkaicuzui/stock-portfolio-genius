#!/usr/bin/env python3
"""
포트폴리오 분석 시스템
- 규칙 기반 분석: 항상 실행 (계산, 수치, 신호)
- AI 분석: 규칙 결과를 바탕으로 인사이트 제공 (Groq → Gemini → Ollama 폴백)
"""

import json
import os
import requests
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# ============================================================
# Provider 설정
# ============================================================

PROVIDERS = {
    "groq": {
        "available": False,
        "model": "llama-3.1-70b-versatile",
        "env_key": "GROQ_API_KEY"
    },
    "gemini": {
        "available": False,
        "model": "gemini-1.5-flash",
        "env_key": "GEMINI_API_KEY"
    },
    "ollama": {
        "available": False,
        "model": "llama3.1:8b",
        "url": "http://localhost:11434"
    }
}

# Groq 라이브러리 확인
try:
    from groq import Groq
    PROVIDERS["groq"]["available"] = True
except ImportError:
    pass

# Google Generative AI 라이브러리 확인
try:
    import google.generativeai as genai
    PROVIDERS["gemini"]["available"] = True
except ImportError:
    pass

# Ollama 연결 확인 (로컬)
def check_ollama():
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code == 200:
            PROVIDERS["ollama"]["available"] = True
            return True
    except:
        pass
    return False


# ============================================================
# 데이터 로딩
# ============================================================

def load_portfolio_data() -> Optional[Dict]:
    """포트폴리오 데이터 로드"""
    script_dir = Path(__file__).parent
    data_path = script_dir.parent / "data" / "portfolio.json"

    if data_path.exists():
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def load_market_data() -> Optional[Dict]:
    """시장 데이터 로드"""
    script_dir = Path(__file__).parent
    market_path = script_dir.parent / "docs" / "market-data.json"

    if market_path.exists():
        with open(market_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


# ============================================================
# 규칙 기반 분석 (항상 실행)
# ============================================================

def analyze_with_rules(portfolio: Dict, market_data: Optional[Dict]) -> Dict:
    """
    규칙 기반 분석: 계산, 수치, 신호
    - 포트폴리오 메트릭스
    - 기술적 지표 신호
    - 리스크 수치
    - 점수 계산
    """
    holdings = portfolio.get('holdings', [])
    prices = portfolio.get('prices', {})

    # 포트폴리오 계산
    total_value = 0
    total_cost = 0
    holdings_analysis = []
    sector_exposure = {}
    leverage_exposure = 0

    for h in holdings:
        symbol = h['symbol']
        shares = h['shares']
        avg_price = h['avg_price']
        current = prices.get(symbol, {}).get('price', avg_price)
        sector = h.get('sector', '기타')

        cost = shares * avg_price
        value = shares * current
        gain_pct = ((value - cost) / cost * 100) if cost > 0 else 0

        total_value += value
        total_cost += cost

        # 섹터 집중도
        sector_exposure[sector] = sector_exposure.get(sector, 0) + value

        # 레버리지 ETF 체크
        if symbol in ['SOXL', 'TQQQ', 'UPRO', 'SPXL', 'TECL']:
            leverage_exposure += value

        holdings_analysis.append({
            'symbol': symbol,
            'name': h.get('name', symbol),
            'shares': shares,
            'avg_price': avg_price,
            'current_price': current,
            'value': round(value, 2),
            'gain_loss_pct': round(gain_pct, 2),
            'sector': sector
        })

    total_return = ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0

    # 섹터 집중도 계산
    sector_concentration = {}
    max_sector = None
    max_sector_pct = 0
    for sector, value in sector_exposure.items():
        pct = (value / total_value * 100) if total_value > 0 else 0
        sector_concentration[sector] = round(pct, 1)
        if pct > max_sector_pct:
            max_sector_pct = pct
            max_sector = sector

    # 레버리지 비중
    leverage_pct = (leverage_exposure / total_value * 100) if total_value > 0 else 0

    # 기술적 지표 신호 수집
    technical_signals = []
    if market_data and 'technical_indicators' in market_data:
        for symbol, indicators in market_data['technical_indicators'].items():
            if any(h['symbol'] == symbol for h in holdings):
                rsi = indicators.get('rsi', {})
                if rsi.get('value', 50) > 70:
                    technical_signals.append({
                        'symbol': symbol,
                        'signal': 'RSI 과매수',
                        'value': rsi.get('value'),
                        'action': 'sell_consider'
                    })
                elif rsi.get('value', 50) < 30:
                    technical_signals.append({
                        'symbol': symbol,
                        'signal': 'RSI 과매도',
                        'value': rsi.get('value'),
                        'action': 'buy_consider'
                    })

                macd_signal = indicators.get('macd_signal', '')
                if macd_signal == '상승':
                    technical_signals.append({
                        'symbol': symbol,
                        'signal': 'MACD 상승 크로스',
                        'action': 'bullish'
                    })

    # 시장 지표
    vix = market_data.get('vix', {}).get('value', 20) if market_data else 20
    fear_greed = market_data.get('fear_greed', {}).get('value', 50) if market_data else 50

    # 점수 계산 (규칙 기반)
    score = 50
    # 수익률 반영 (40%)
    if total_return > 20:
        score += 20
    elif total_return > 10:
        score += 15
    elif total_return > 0:
        score += 10
    elif total_return > -10:
        score += 0
    else:
        score -= 10

    # 분산도 반영 (30%)
    if max_sector_pct < 40:
        score += 15  # 잘 분산됨
    elif max_sector_pct < 60:
        score += 10
    elif max_sector_pct < 80:
        score += 5
    else:
        score -= 5  # 집중 리스크

    # 레버리지 리스크 (15%)
    if leverage_pct < 5:
        score += 7
    elif leverage_pct < 15:
        score += 3
    else:
        score -= 5

    # 시장 환경 (15%)
    if vix < 15:
        score += 7
    elif vix < 25:
        score += 3
    else:
        score -= 3

    score = max(0, min(100, score))

    # 승자/패자 분류
    winners = sorted([h for h in holdings_analysis if h['gain_loss_pct'] > 0],
                     key=lambda x: x['gain_loss_pct'], reverse=True)
    losers = sorted([h for h in holdings_analysis if h['gain_loss_pct'] <= 0],
                    key=lambda x: x['gain_loss_pct'])

    return {
        "type": "rule_based",
        "timestamp": datetime.now().isoformat(),
        "portfolio_metrics": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_return_pct": round(total_return, 2),
            "holdings_count": len(holdings)
        },
        "risk_metrics": {
            "sector_concentration": sector_concentration,
            "max_sector": max_sector,
            "max_sector_pct": round(max_sector_pct, 1),
            "leverage_pct": round(leverage_pct, 1)
        },
        "market_conditions": {
            "vix": vix,
            "fear_greed": fear_greed,
            "market_cycle": market_data.get('market_cycle', 'unknown') if market_data else 'unknown'
        },
        "technical_signals": technical_signals,
        "score": score,
        "winners": winners[:5],
        "losers": losers[:5],
        "holdings": holdings_analysis
    }


# ============================================================
# AI 분석 프롬프트
# ============================================================

def create_ai_prompt(rule_analysis: Dict) -> str:
    """규칙 분석 결과를 바탕으로 AI 프롬프트 생성"""

    metrics = rule_analysis['portfolio_metrics']
    risk = rule_analysis['risk_metrics']
    market = rule_analysis['market_conditions']
    signals = rule_analysis['technical_signals']
    winners = rule_analysis['winners']
    losers = rule_analysis['losers']

    signals_text = "\n".join([f"  - {s['symbol']}: {s['signal']}" for s in signals]) or "  - 특별한 신호 없음"
    winners_text = "\n".join([f"  - {w['symbol']}: +{w['gain_loss_pct']}%" for w in winners[:3]]) or "  - 없음"
    losers_text = "\n".join([f"  - {l['symbol']}: {l['gain_loss_pct']}%" for l in losers[:3]]) or "  - 없음"

    prompt = f"""당신은 16권의 투자 명저를 읽은 전문 투자 어드바이저입니다.
참고 서적: 벤저민 그레이엄(현명한 투자자), 피터 린치(전설로 떠나는 월가의 영웅),
워런 버핏, 하워드 막스(투자에 대한 생각), 레이 달리오(원칙), 찰리 멍거 등

아래 포트폴리오 분석 데이터를 보고, 투자자에게 도움이 되는 인사이트를 제공해주세요.

## 포트폴리오 현황
- 총 평가금액: ${metrics['total_value']:,.2f}
- 총 수익률: {metrics['total_return_pct']:.1f}%
- 종목 수: {metrics['holdings_count']}개

## 리스크 현황
- 최대 섹터 집중: {risk['max_sector']} ({risk['max_sector_pct']}%)
- 레버리지 ETF 비중: {risk['leverage_pct']}%

## 시장 상황
- VIX (변동성): {market['vix']}
- Fear & Greed: {market['fear_greed']}
- 시장 사이클: {market['market_cycle']}

## 기술적 신호
{signals_text}

## 수익 TOP 3
{winners_text}

## 손실 TOP 3
{losers_text}

다음 JSON 형식으로 응답해주세요:
{{
  "market_insight": "현재 시장 상황에 대한 해석과 조언 (2-3문장)",
  "portfolio_insight": "이 포트폴리오의 강점과 약점 분석 (2-3문장)",
  "action_items": [
    {{"priority": "high/medium/low", "action": "구체적인 행동 제안", "reason": "투자 명저의 원칙 기반 이유"}}
  ],
  "book_wisdom": {{
    "book": "적용한 책 제목",
    "author": "저자",
    "quote": "관련 인사이트나 인용구"
  }},
  "risk_warning": "주의해야 할 리스크 (1-2문장)"
}}

JSON만 출력하세요."""

    return prompt


# ============================================================
# AI Provider 구현
# ============================================================

def analyze_with_groq(prompt: str) -> Optional[Dict]:
    """Groq API 분석"""
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key or not PROVIDERS["groq"]["available"]:
        return None

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "당신은 전문 투자 분석가입니다. 항상 유효한 JSON으로만 응답합니다."},
                {"role": "user", "content": prompt}
            ],
            model=PROVIDERS["groq"]["model"],
            temperature=0.3,
            max_tokens=1500
        )

        text = response.choices[0].message.content
        return parse_ai_response(text, "groq")
    except Exception as e:
        print(f"Groq 오류: {e}")
        return None


def analyze_with_gemini(prompt: str) -> Optional[Dict]:
    """Gemini API 분석"""
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key or not PROVIDERS["gemini"]["available"]:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(PROVIDERS["gemini"]["model"])
        response = model.generate_content(prompt)

        text = response.text
        return parse_ai_response(text, "gemini")
    except Exception as e:
        print(f"Gemini 오류: {e}")
        return None


def analyze_with_ollama(prompt: str) -> Optional[Dict]:
    """Ollama 로컬 분석"""
    if not PROVIDERS["ollama"]["available"]:
        return None

    try:
        response = requests.post(
            f"{PROVIDERS['ollama']['url']}/api/generate",
            json={
                "model": PROVIDERS["ollama"]["model"],
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        if response.status_code == 200:
            text = response.json().get('response', '')
            return parse_ai_response(text, "ollama")
    except Exception as e:
        print(f"Ollama 오류: {e}")
    return None


def parse_ai_response(text: str, provider: str) -> Optional[Dict]:
    """AI 응답에서 JSON 추출"""
    try:
        # JSON 블록 추출
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())
        result["ai_provider"] = provider
        return result
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 오류 ({provider}): {e}")
        return None


# ============================================================
# 메인 분석 함수
# ============================================================

def run_analysis() -> Dict:
    """전체 분석 실행"""
    print("=" * 50)
    print("포트폴리오 분석 시작")
    print("=" * 50)

    # 데이터 로드
    portfolio = load_portfolio_data()
    if not portfolio:
        print("❌ 포트폴리오 데이터를 찾을 수 없습니다.")
        return {"error": "포트폴리오 데이터 없음"}

    market_data = load_market_data()
    print(f"✅ 포트폴리오 로드: {len(portfolio.get('holdings', []))}개 종목")

    # 1단계: 규칙 기반 분석 (항상 실행)
    print("\n📊 규칙 기반 분석 실행...")
    rule_analysis = analyze_with_rules(portfolio, market_data)
    print(f"   점수: {rule_analysis['score']}")
    print(f"   총 수익률: {rule_analysis['portfolio_metrics']['total_return_pct']:.1f}%")

    # 2단계: AI 분석 (폴백 체인)
    print("\n🤖 AI 분석 시도...")
    check_ollama()  # Ollama 상태 확인

    prompt = create_ai_prompt(rule_analysis)
    ai_analysis = None

    # Provider 순서: Groq → Gemini → Ollama
    providers = [
        ("Groq", analyze_with_groq),
        ("Gemini", analyze_with_gemini),
        ("Ollama", analyze_with_ollama)
    ]

    for name, analyzer in providers:
        print(f"   {name} 시도 중...")
        ai_analysis = analyzer(prompt)
        if ai_analysis:
            print(f"   ✅ {name} 성공!")
            break
        else:
            print(f"   ⏭️ {name} 실패, 다음 시도...")

    if not ai_analysis:
        print("   ℹ️ AI 분석 불가, 규칙 기반 결과만 사용")
        ai_analysis = {
            "ai_provider": "none",
            "market_insight": "AI 분석을 사용할 수 없습니다. API 키를 설정하거나 Ollama를 실행해주세요.",
            "portfolio_insight": "규칙 기반 분석 결과를 참고하세요.",
            "action_items": [],
            "book_wisdom": {
                "book": "현명한 투자자",
                "author": "벤저민 그레이엄",
                "quote": "투자의 핵심은 안전마진을 확보하는 것입니다."
            },
            "risk_warning": "AI 인사이트 없이 규칙 기반 데이터만 제공됩니다."
        }

    # 최종 결과 조합
    final_result = {
        "generated_at": datetime.now().isoformat(),
        "rule_based": rule_analysis,
        "ai_insights": ai_analysis
    }

    return final_result


def main():
    """메인 함수"""
    result = run_analysis()

    # 결과 저장
    script_dir = Path(__file__).parent
    output_path = script_dir.parent / "docs" / "ai-analysis.json"

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 분석 결과 저장: {output_path}")
    print(f"   AI Provider: {result['ai_insights'].get('ai_provider', 'unknown')}")
    print(f"   규칙 기반 점수: {result['rule_based']['score']}")

    return result


if __name__ == "__main__":
    main()
