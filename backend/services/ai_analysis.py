"""
AI 포트폴리오 분석 서비스 (Groq 전용)
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Groq 설정
GROQ_AVAILABLE = False
GROQ_MODEL = "llama-3.1-70b-versatile"

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("groq not installed")


def get_provider_status() -> Dict[str, Any]:
    """AI Provider 상태 반환"""
    groq_key = os.environ.get("GROQ_API_KEY")

    return {
        "groq": {
            "library_installed": GROQ_AVAILABLE,
            "api_key_set": bool(groq_key),
            "ready": GROQ_AVAILABLE and bool(groq_key)
        }
    }


def create_analysis_prompt(portfolio_data: Dict) -> str:
    """분석용 프롬프트 생성"""
    holdings = portfolio_data.get("holdings", [])

    # 포트폴리오 계산
    total_value = sum(h.get("value", 0) for h in holdings)
    total_cost = sum(h.get("shares", 0) * h.get("avg_price", 0) for h in holdings)
    total_return = ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0

    # 승자/패자 분류
    sorted_holdings = sorted(holdings, key=lambda x: x.get("gain_loss_pct", 0), reverse=True)
    winners = [h for h in sorted_holdings if h.get("gain_loss_pct", 0) > 0][:3]
    losers = [h for h in sorted_holdings if h.get("gain_loss_pct", 0) <= 0][-3:]

    winners_text = "\n".join([f"  - {w['symbol']}: +{w.get('gain_loss_pct', 0):.1f}%" for w in winners]) or "  - 없음"
    losers_text = "\n".join([f"  - {l['symbol']}: {l.get('gain_loss_pct', 0):.1f}%" for l in losers]) or "  - 없음"

    prompt = f"""당신은 16권의 투자 명저를 읽은 전문 투자 어드바이저입니다.
참고 서적: 벤저민 그레이엄(현명한 투자자), 피터 린치(전설로 떠나는 월가의 영웅),
워런 버핏, 하워드 막스(투자에 대한 생각), 레이 달리오(원칙), 찰리 멍거 등

아래 포트폴리오 분석 데이터를 보고, 투자자에게 도움이 되는 인사이트를 제공해주세요.

## 포트폴리오 현황
- 총 평가금액: ${total_value:,.2f}
- 총 수익률: {total_return:.1f}%
- 종목 수: {len(holdings)}개

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


def parse_ai_response(text: str) -> Optional[Dict]:
    """AI 응답에서 JSON 추출"""
    try:
        # JSON 블록 추출
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        result = json.loads(text.strip())
        result["ai_provider"] = "groq"
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        return None


async def analyze_with_groq(prompt: str) -> Optional[Dict]:
    """Groq API 분석"""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or not GROQ_AVAILABLE:
        return None

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "당신은 전문 투자 분석가입니다. 항상 유효한 JSON으로만 응답합니다."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            temperature=0.3,
            max_tokens=1500
        )

        text = response.choices[0].message.content
        return parse_ai_response(text)
    except Exception as e:
        logger.error(f"Groq error: {e}")
        return None


async def analyze_portfolio(portfolio_data: Dict) -> Dict:
    """포트폴리오 AI 분석 실행"""
    prompt = create_analysis_prompt(portfolio_data)

    result = await analyze_with_groq(prompt)
    if result:
        logger.info("AI analysis completed with Groq")
        return {
            "success": True,
            "generated_at": datetime.now().isoformat(),
            "insights": result
        }

    # Groq 실패
    logger.warning("Groq AI analysis failed")
    return {
        "success": False,
        "generated_at": datetime.now().isoformat(),
        "error": "AI 분석을 사용할 수 없습니다. GROQ_API_KEY를 확인해주세요.",
        "insights": {
            "ai_provider": "none",
            "market_insight": "AI 분석을 사용할 수 없습니다.",
            "portfolio_insight": "GROQ_API_KEY를 설정해주세요.",
            "action_items": [],
            "book_wisdom": {
                "book": "현명한 투자자",
                "author": "벤저민 그레이엄",
                "quote": "투자의 핵심은 안전마진을 확보하는 것입니다."
            },
            "risk_warning": "AI 분석 없이 규칙 기반 데이터만 제공됩니다."
        }
    }
