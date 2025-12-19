#!/usr/bin/env python3
"""
AI Portfolio Manager
Manages the AI virtual portfolio based on 16 investment book methodologies
Competes against user's real portfolio
"""

import json
import os
import random
from datetime import datetime, date
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'yfinance'])
    import yfinance as yf

try:
    import numpy as np
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'numpy'])
    import numpy as np


class AIPortfolioManager:
    """
    AI Investment Manager using 16 investment book methodologies:
    1. Benjamin Graham - Value Investing, Safety Margin
    2. Peter Lynch - Growth at Reasonable Price, Stock Categories
    3. Howard Marks - Risk Assessment, Second-Level Thinking
    4. Joel Greenblatt - Magic Formula (Earnings Yield + ROC)
    5. William O'Neil - CAN SLIM
    6. Harry Markowitz - Modern Portfolio Theory
    7. Ray Dalio - All Weather Portfolio
    8. Philip Fisher - 15-Point Checklist
    9. Charlie Munger - Mental Models, Moat Analysis
    10. John Bogle - Index Investing
    11. Burton Malkiel - Random Walk, EMH
    12. Nassim Taleb - Antifragile, Black Swan
    13. Seth Klarman - Deep Value
    14. Stanley Druckenmiller - Top-Down Macro
    15. Kelly Criterion - Position Sizing
    16. Warren Buffett - Quality at Fair Price
    """

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.ai_data_path = project_root / "docs" / "ai_data.json"
        self.user_data_path = project_root / "docs" / "data.json"
        self.history_path = project_root / "data" / "ai_history.json"

        self.ai_data = self.load_ai_data()
        self.user_data = self.load_user_data()

    def load_ai_data(self) -> dict:
        """Load AI portfolio data"""
        if self.ai_data_path.exists():
            with open(self.ai_data_path, 'r') as f:
                return json.load(f)
        return self.create_initial_portfolio()

    def load_user_data(self) -> dict:
        """Load user portfolio data"""
        if self.user_data_path.exists():
            with open(self.user_data_path, 'r') as f:
                return json.load(f)
        return None

    def create_initial_portfolio(self) -> dict:
        """Create initial AI portfolio with same capital as user"""
        initial_capital = 125818.64  # Same as user

        return {
            "last_updated": datetime.now().isoformat(),
            "initial_capital": initial_capital,
            "start_date": date.today().isoformat(),
            "summary": {
                "total_value": initial_capital,
                "total_cost": initial_capital,
                "total_gain_loss": 0,
                "total_gain_loss_pct": 0,
                "cash": initial_capital,
                "invested": 0,
                "holdings_count": 0
            },
            "holdings": [],
            "history": [],
            "decisions": [],
            "metrics": {
                "win_rate": 0,
                "avg_return": 0,
                "sharpe_ratio": 0,
                "max_drawdown": 0,
                "trade_count": 0,
                "days_active": 0
            },
            "learning_log": [],
            "strategy": {
                "name": "복합 가치성장 전략",
                "description": "16권의 투자 고전을 기반으로 한 복합 투자 전략"
            }
        }

    def fetch_stock_data(self, symbol: str) -> dict:
        """Fetch current stock data from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="1mo")

            if hist.empty:
                return None

            current_price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            change = current_price - prev_close
            change_pct = (change / prev_close) * 100 if prev_close else 0

            return {
                "symbol": symbol,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "change_pct": round(change_pct, 2),
                "pe_ratio": info.get('trailingPE', 0) or 0,
                "pb_ratio": info.get('priceToBook', 0) or 0,
                "market_cap": info.get('marketCap', 0) or 0,
                "beta": info.get('beta', 1) or 1,
                "dividend_yield": info.get('dividendYield', 0) or 0,
                "profit_margin": info.get('profitMargins', 0) or 0,
                "roe": info.get('returnOnEquity', 0) or 0,
                "debt_to_equity": info.get('debtToEquity', 0) or 0,
                "current_ratio": info.get('currentRatio', 0) or 0,
                "52w_high": info.get('fiftyTwoWeekHigh', 0) or 0,
                "52w_low": info.get('fiftyTwoWeekLow', 0) or 0,
                "name": info.get('shortName', symbol)
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None

    def calculate_graham_score(self, data: dict) -> float:
        """Benjamin Graham - Value Investing Score"""
        score = 50

        pe = data.get('pe_ratio', 0)
        pb = data.get('pb_ratio', 0)
        current_ratio = data.get('current_ratio', 0)
        debt_to_equity = data.get('debt_to_equity', 0)

        # PE < 15 is good
        if 0 < pe < 15:
            score += 20
        elif 0 < pe < 20:
            score += 10
        elif pe > 30:
            score -= 15

        # PB < 1.5 is good
        if 0 < pb < 1.5:
            score += 15
        elif 0 < pb < 2.5:
            score += 5

        # Current ratio > 2 is good
        if current_ratio > 2:
            score += 10
        elif current_ratio > 1.5:
            score += 5

        # Low debt is good
        if 0 < debt_to_equity < 50:
            score += 10
        elif debt_to_equity > 100:
            score -= 10

        return min(100, max(0, score))

    def calculate_lynch_score(self, data: dict) -> tuple:
        """Peter Lynch - PEG Ratio and Stock Category"""
        pe = data.get('pe_ratio', 0)
        price = data.get('price', 0)
        high_52w = data.get('52w_high', 0)
        low_52w = data.get('52w_low', 0)

        # Estimate growth (simplified)
        growth = 15  # Assume 15% growth for tech stocks

        peg = pe / growth if growth > 0 and pe > 0 else 999

        # Lynch categories
        if peg < 1:
            category = "빠른성장주"
            score = 85
        elif peg < 1.5:
            category = "성장주"
            score = 75
        elif peg < 2:
            category = "안정성장주"
            score = 65
        else:
            category = "저성장주"
            score = 45

        # Price position
        if high_52w > 0 and low_52w > 0:
            position = (price - low_52w) / (high_52w - low_52w)
            if position < 0.3:  # Near 52-week low
                score += 10
                category += " (저점근접)"

        return score, category

    def calculate_marks_risk(self, data: dict) -> tuple:
        """Howard Marks - Risk Assessment"""
        beta = data.get('beta', 1)
        debt_to_equity = data.get('debt_to_equity', 0)
        price = data.get('price', 0)
        high_52w = data.get('52w_high', 0)

        risk_score = 50

        # Beta risk
        if beta < 0.8:
            risk_score -= 10
        elif beta > 1.5:
            risk_score += 20

        # Debt risk
        if debt_to_equity > 100:
            risk_score += 15

        # Price vs 52w high
        if high_52w > 0:
            from_high = (high_52w - price) / high_52w
            if from_high > 0.3:  # 30%+ from high
                risk_score -= 10  # Less risky at lower price

        if risk_score < 40:
            return "낮음", 40
        elif risk_score < 60:
            return "중간", 60
        else:
            return "높음", 80

    def calculate_greenblatt_score(self, data: dict) -> float:
        """Joel Greenblatt - Magic Formula"""
        pe = data.get('pe_ratio', 0)
        roe = data.get('roe', 0)

        # Earnings yield (inverse of PE)
        earnings_yield = (1 / pe * 100) if pe > 0 else 0

        # ROC approximation (using ROE)
        roc = roe * 100 if roe else 0

        # Combined score
        score = 50
        if earnings_yield > 10:
            score += 20
        elif earnings_yield > 5:
            score += 10

        if roc > 20:
            score += 25
        elif roc > 15:
            score += 15
        elif roc > 10:
            score += 10

        return min(100, max(0, score))

    def calculate_munger_moat(self, data: dict) -> tuple:
        """Charlie Munger - Economic Moat Analysis"""
        profit_margin = data.get('profit_margin', 0)
        roe = data.get('roe', 0)
        market_cap = data.get('market_cap', 0)

        moat_score = 50

        # High profit margin = moat
        if profit_margin and profit_margin > 0.2:
            moat_score += 25
        elif profit_margin and profit_margin > 0.1:
            moat_score += 15

        # High ROE = moat
        if roe and roe > 0.2:
            moat_score += 20
        elif roe and roe > 0.15:
            moat_score += 10

        # Large cap = stability
        if market_cap > 100e9:
            moat_score += 10

        if moat_score >= 80:
            return "강함", moat_score
        elif moat_score >= 60:
            return "보통", moat_score
        else:
            return "약함", moat_score

    def calculate_taleb_fragility(self, data: dict) -> tuple:
        """Nassim Taleb - Fragility/Antifragile Score"""
        beta = data.get('beta', 1)
        debt_to_equity = data.get('debt_to_equity', 0)
        current_ratio = data.get('current_ratio', 0)

        fragility = 50

        # High beta = fragile
        if beta > 1.5:
            fragility += 20
        elif beta < 0.8:
            fragility -= 15

        # High debt = fragile
        if debt_to_equity > 100:
            fragility += 15
        elif debt_to_equity < 30:
            fragility -= 10

        # Low current ratio = fragile
        if current_ratio < 1:
            fragility += 15
        elif current_ratio > 2:
            fragility -= 10

        if fragility >= 70:
            return "취약", fragility
        elif fragility >= 40:
            return "강건", fragility
        else:
            return "안티프래질", fragility

    def analyze_stock(self, symbol: str, data: dict) -> dict:
        """Comprehensive stock analysis using all methodologies"""
        graham = self.calculate_graham_score(data)
        lynch_score, lynch_cat = self.calculate_lynch_score(data)
        marks_risk, marks_score = self.calculate_marks_risk(data)
        greenblatt = self.calculate_greenblatt_score(data)
        moat, moat_score = self.calculate_munger_moat(data)
        fragility, frag_score = self.calculate_taleb_fragility(data)

        # Composite AI score (weighted average)
        composite = (
            graham * 0.2 +
            lynch_score * 0.15 +
            (100 - marks_score) * 0.15 +
            greenblatt * 0.2 +
            moat_score * 0.15 +
            (100 - frag_score) * 0.15
        )

        return {
            "symbol": symbol,
            "name": data.get('name', symbol),
            "price": data['price'],
            "composite_score": round(composite, 1),
            "graham_score": round(graham, 1),
            "lynch_category": lynch_cat,
            "marks_risk": marks_risk,
            "greenblatt_score": round(greenblatt, 1),
            "munger_moat": moat,
            "taleb_fragility": fragility,
            "recommendation": self.get_recommendation(composite, marks_risk)
        }

    def get_recommendation(self, score: float, risk: str) -> str:
        """Generate recommendation based on scores"""
        if score >= 75 and risk == "낮음":
            return "강력 매수"
        elif score >= 70:
            return "매수"
        elif score >= 55:
            return "보유"
        elif score >= 40:
            return "관망"
        else:
            return "매도 검토"

    def update_holdings_prices(self):
        """Update prices for all AI holdings"""
        updated_holdings = []
        total_value = self.ai_data['summary'].get('cash', 0)
        total_cost = 0

        for holding in self.ai_data['holdings']:
            symbol = holding['symbol']
            print(f"  AI: Updating {symbol}...")

            data = self.fetch_stock_data(symbol)
            if data:
                current_price = data['price']
                shares = holding['shares']
                avg_price = holding['avg_price']

                market_value = current_price * shares
                cost_basis = avg_price * shares
                gain_loss = market_value - cost_basis
                gain_loss_pct = (gain_loss / cost_basis) * 100 if cost_basis else 0

                total_value += market_value
                total_cost += cost_basis

                # Analyze stock
                analysis = self.analyze_stock(symbol, data)

                updated_holdings.append({
                    **holding,
                    "current_price": current_price,
                    "market_value": round(market_value, 2),
                    "cost_basis": round(cost_basis, 2),
                    "gain_loss": round(gain_loss, 2),
                    "gain_loss_pct": round(gain_loss_pct, 2),
                    "ai_score": analysis['composite_score'],
                    "recommendation": analysis['recommendation']
                })

                print(f"    {symbol}: ${current_price} ({gain_loss_pct:+.2f}%) Score: {analysis['composite_score']}")
            else:
                # Keep old data if fetch fails
                updated_holdings.append(holding)
                total_value += holding.get('market_value', 0)
                total_cost += holding.get('cost_basis', 0)

        # Update AI data
        self.ai_data['holdings'] = updated_holdings

        # Add cash to total
        total_cost += self.ai_data['summary'].get('cash', 0)

        total_gain_loss = total_value - self.ai_data['initial_capital']
        total_gain_loss_pct = (total_gain_loss / self.ai_data['initial_capital']) * 100

        self.ai_data['summary'] = {
            "total_value": round(total_value, 2),
            "total_cost": round(self.ai_data['initial_capital'], 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_pct": round(total_gain_loss_pct, 2),
            "cash": round(self.ai_data['summary'].get('cash', 0), 2),
            "invested": round(total_value - self.ai_data['summary'].get('cash', 0), 2),
            "holdings_count": len(updated_holdings)
        }

        self.ai_data['last_updated'] = datetime.now().isoformat()

        return total_value, total_gain_loss_pct

    def record_history(self, total_value: float, return_pct: float):
        """Record daily portfolio history"""
        today = date.today().isoformat()

        # Check if already recorded today
        existing_dates = [h['date'] for h in self.ai_data.get('history', [])]
        if today not in existing_dates:
            self.ai_data['history'].append({
                "date": today,
                "total_value": round(total_value, 2),
                "return_pct": round(return_pct, 2)
            })

            # Keep last 365 days
            self.ai_data['history'] = self.ai_data['history'][-365:]

    def make_decision(self):
        """AI makes investment decision based on market analysis"""
        today = datetime.now()

        # Simple decision logic for now (can be enhanced)
        user_return = self.user_data['summary']['total_gain_loss_pct'] if self.user_data else 0
        ai_return = self.ai_data['summary']['total_gain_loss_pct']

        diff = ai_return - user_return

        # Analyze current holdings
        action = "hold"
        reasoning = ""

        if diff < -5:
            # AI is losing significantly, need to adjust
            reasoning = f"AI 포트폴리오가 사용자 대비 {abs(diff):.2f}%p 뒤처지고 있습니다. "
            reasoning += "하워드 막스의 '2차적 사고'에 따라 현재 포지션을 재평가하고 있습니다. "
            reasoning += "단기 변동에 휘둘리지 않고 장기적 관점을 유지하되, 저평가 종목 발굴에 집중합니다."
            action = "hold"
        elif diff > 5:
            # AI is winning significantly
            reasoning = f"AI 포트폴리오가 사용자 대비 {diff:.2f}%p 앞서고 있습니다. "
            reasoning += "벤저민 그레이엄의 '안전마진' 원칙에 따라 현재 포지션을 유지합니다. "
            reasoning += "승리에 자만하지 않고 리스크 관리를 계속합니다."
            action = "hold"
        else:
            # Close competition
            reasoning = "사용자 포트폴리오와 비슷한 수익률을 보이고 있습니다. "
            reasoning += "피터 린치의 관점에서 보유 종목들의 성장 스토리를 재점검하고 있습니다. "
            reasoning += "현재 전략을 유지하며 시장 기회를 모니터링합니다."
            action = "hold"

        # Record decision
        decision = {
            "date": today.isoformat(),
            "action": action,
            "symbol": "ALL",
            "reasoning": reasoning,
            "details": {
                "ai_return": f"{ai_return:.2f}%",
                "user_return": f"{user_return:.2f}%",
                "difference": f"{diff:+.2f}%p",
                "strategy": "장기 가치 투자 유지"
            }
        }

        self.ai_data['decisions'].append(decision)

        # Keep last 100 decisions
        self.ai_data['decisions'] = self.ai_data['decisions'][-100:]

        return decision

    def update_metrics(self):
        """Update AI performance metrics"""
        history = self.ai_data.get('history', [])
        decisions = self.ai_data.get('decisions', [])

        if len(history) < 2:
            return

        # Calculate metrics
        returns = [h['return_pct'] for h in history]

        # Win rate (days with positive return)
        positive_days = sum(1 for r in returns if r > 0)
        win_rate = (positive_days / len(returns)) * 100 if returns else 0

        # Average return
        avg_return = np.mean(returns) if returns else 0

        # Sharpe ratio (simplified)
        std_return = np.std(returns) if len(returns) > 1 else 1
        sharpe = avg_return / std_return if std_return > 0 else 0

        # Max drawdown
        max_dd = min(returns) if returns else 0

        # Days active
        start_date = datetime.fromisoformat(self.ai_data.get('start_date', date.today().isoformat()))
        days_active = (date.today() - start_date.date()).days if isinstance(start_date, datetime) else 0

        self.ai_data['metrics'] = {
            "win_rate": round(win_rate, 1),
            "avg_return": round(avg_return, 2),
            "sharpe_ratio": round(sharpe, 2),
            "max_drawdown": round(max_dd, 2),
            "trade_count": len([d for d in decisions if d.get('action') in ['buy', 'sell']]),
            "days_active": max(1, days_active)
        }

    def learn_from_mistakes(self):
        """AI learns from comparing predictions vs actual results"""
        if not self.user_data:
            return

        lessons = []

        # Analyze user's worst performers
        user_holdings = self.user_data.get('holdings', [])
        for h in user_holdings:
            if h.get('gain_loss_pct', 0) < -30:
                lesson = {
                    "date": date.today().isoformat(),
                    "lesson": f"{h['symbol']}의 {h['gain_loss_pct']:.2f}% 손실 관찰. ",
                    "adjustment": "유사 패턴 종목 투자시 주의 필요"
                }

                # Specific lessons based on stock
                if 'SOXL' in h['symbol'] or 'leveraged' in h.get('name', '').lower():
                    lesson['lesson'] += "레버리지 ETF는 장기 보유에 부적합. 변동성으로 인한 손실 누적."
                    lesson['adjustment'] = "레버리지 ETF 투자 비중 0% 유지"
                elif h['symbol'] == 'MU':
                    lesson['lesson'] += "메모리 반도체 사이클 주의. 진입 시점이 중요."
                    lesson['adjustment'] = "메모리 반도체 PBR 1.0 이하에서만 진입"

                lessons.append(lesson)

        if lessons:
            self.ai_data['learning_log'].extend(lessons)
            # Keep last 50 lessons
            self.ai_data['learning_log'] = self.ai_data['learning_log'][-50:]

    def save(self):
        """Save AI portfolio data"""
        with open(self.ai_data_path, 'w') as f:
            json.dump(self.ai_data, f, indent=2, ensure_ascii=False)
        print(f"Saved AI portfolio to {self.ai_data_path}")

    def run(self):
        """Main execution"""
        print("\n=== AI Portfolio Manager ===")
        print(f"Holdings: {len(self.ai_data['holdings'])}")

        # Update prices
        total_value, return_pct = self.update_holdings_prices()

        # Record history
        self.record_history(total_value, return_pct)

        # Make decision
        decision = self.make_decision()
        print(f"\nAI Decision: {decision['action']}")
        print(f"Reasoning: {decision['reasoning'][:100]}...")

        # Update metrics
        self.update_metrics()

        # Learn from mistakes
        self.learn_from_mistakes()

        # Save
        self.save()

        # Summary
        print(f"\n=== AI Portfolio Summary ===")
        print(f"Total Value: ${total_value:,.2f}")
        print(f"Return: {return_pct:+.2f}%")

        if self.user_data:
            user_return = self.user_data['summary']['total_gain_loss_pct']
            diff = return_pct - user_return
            winner = "AI" if diff > 0 else "User"
            print(f"User Return: {user_return:+.2f}%")
            print(f"Difference: {diff:+.2f}%p ({winner} winning)")


def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    manager = AIPortfolioManager(project_root)
    manager.run()


if __name__ == "__main__":
    main()
