#!/usr/bin/env python3
"""
Stock Price Fetcher for GitHub Actions
Fetches current prices and ACCUMULATES historical data
"""

import json
import os
from datetime import datetime, date
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'yfinance'])
    import yfinance as yf


def fetch_stock_data(symbol: str) -> dict:
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
            "high_52w": round(info.get('fiftyTwoWeekHigh', 0), 2),
            "low_52w": round(info.get('fiftyTwoWeekLow', 0), 2),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE', 0),
            "fetched_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


def load_history(history_path: Path) -> dict:
    """Load existing history or create new"""
    if history_path.exists():
        with open(history_path, 'r') as f:
            return json.load(f)
    return {
        "portfolio_history": [],  # Daily portfolio value snapshots
        "price_history": {}       # Per-stock price history
    }


def save_history(history_path: Path, history: dict):
    """Save history to file"""
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)


def main():
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Load portfolio
    portfolio_path = project_root / "data" / "portfolio.json"
    history_path = project_root / "data" / "history.json"

    with open(portfolio_path, 'r') as f:
        portfolio = json.load(f)

    # Load accumulated history
    history = load_history(history_path)

    print(f"Fetching prices for {len(portfolio['holdings'])} stocks...")

    # Fetch prices for each holding
    prices = {}
    for holding in portfolio['holdings']:
        symbol = holding['symbol']
        print(f"  Fetching {symbol}...")
        data = fetch_stock_data(symbol)
        if data:
            prices[symbol] = data
            print(f"    {symbol}: ${data['price']} ({data['change_pct']:+.2f}%)")
        else:
            print(f"    {symbol}: Failed to fetch")

    # Update portfolio
    portfolio['prices'] = prices
    portfolio['last_updated'] = datetime.now().isoformat()

    # Save updated portfolio
    with open(portfolio_path, 'w') as f:
        json.dump(portfolio, f, indent=2)

    print(f"\nUpdated portfolio.json at {portfolio['last_updated']}")

    # Calculate portfolio summary
    total_value = 0
    total_cost = 0
    holdings_with_prices = []
    today = date.today().isoformat()

    for holding in portfolio['holdings']:
        symbol = holding['symbol']
        if symbol in prices:
            current_price = prices[symbol]['price']
            shares = holding['shares']
            avg_price = holding['avg_price']

            market_value = current_price * shares
            cost_basis = avg_price * shares
            gain_loss = market_value - cost_basis
            gain_loss_pct = (gain_loss / cost_basis) * 100 if cost_basis else 0

            total_value += market_value
            total_cost += cost_basis

            holdings_with_prices.append({
                **holding,
                "current_price": current_price,
                "market_value": round(market_value, 2),
                "cost_basis": round(cost_basis, 2),
                "gain_loss": round(gain_loss, 2),
                "gain_loss_pct": round(gain_loss_pct, 2),
                "change": prices[symbol]['change'],
                "change_pct": prices[symbol]['change_pct']
            })

            # === ACCUMULATE PRICE HISTORY ===
            if symbol not in history['price_history']:
                history['price_history'][symbol] = []

            # Add today's price if not already recorded
            existing_dates = [p['date'] for p in history['price_history'][symbol]]
            if today not in existing_dates:
                history['price_history'][symbol].append({
                    "date": today,
                    "price": current_price
                })
                print(f"    Added {symbol} price to history: {today} = ${current_price}")

            # Keep last 365 days only
            history['price_history'][symbol] = history['price_history'][symbol][-365:]

    total_gain_loss = total_value - total_cost
    total_gain_loss_pct = (total_gain_loss / total_cost) * 100 if total_cost else 0

    # === ACCUMULATE PORTFOLIO HISTORY ===
    existing_portfolio_dates = [p['date'] for p in history['portfolio_history']]
    if today not in existing_portfolio_dates:
        history['portfolio_history'].append({
            "date": today,
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_pct": round(total_gain_loss_pct, 2)
        })
        print(f"\nAdded portfolio snapshot: {today} = ${total_value:,.2f}")

    # Keep last 365 days
    history['portfolio_history'] = history['portfolio_history'][-365:]

    # Save accumulated history
    save_history(history_path, history)
    print(f"Saved accumulated history to data/history.json")

    # === CREATE DASHBOARD DATA ===
    dashboard_data = {
        "last_updated": portfolio['last_updated'],
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_pct": round(total_gain_loss_pct, 2),
            "holdings_count": len(holdings_with_prices)
        },
        "holdings": holdings_with_prices,
        # Include accumulated history for charts
        "portfolio_history": history['portfolio_history'],
        "price_history": history['price_history']
    }

    docs_data_path = project_root / "docs" / "data.json"
    with open(docs_data_path, 'w') as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"Saved dashboard data to docs/data.json")
    print(f"Portfolio Value: ${total_value:,.2f} ({total_gain_loss_pct:+.2f}%)")
    print(f"History days: {len(history['portfolio_history'])}")


if __name__ == "__main__":
    main()
