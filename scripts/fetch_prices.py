#!/usr/bin/env python3
"""
Stock Price Fetcher for GitHub Actions
Fetches current prices and updates portfolio data
"""

import json
import os
from datetime import datetime
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    print("Installing yfinance...")
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

        # Get historical data for chart
        hist_data = []
        for date, row in hist.iterrows():
            hist_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(row['Close'], 2)
            })

        return {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "high_52w": round(info.get('fiftyTwoWeekHigh', 0), 2),
            "low_52w": round(info.get('fiftyTwoWeekLow', 0), 2),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE', 0),
            "history": hist_data,
            "fetched_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


def main():
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Load portfolio
    portfolio_path = project_root / "data" / "portfolio.json"
    with open(portfolio_path, 'r') as f:
        portfolio = json.load(f)

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

    # Also save to docs for direct access
    docs_data_path = project_root / "docs" / "data.json"

    # Calculate portfolio summary
    total_value = 0
    total_cost = 0
    holdings_with_prices = []

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
                "change_pct": prices[symbol]['change_pct'],
                "history": prices[symbol]['history']
            })

    total_gain_loss = total_value - total_cost
    total_gain_loss_pct = (total_gain_loss / total_cost) * 100 if total_cost else 0

    dashboard_data = {
        "last_updated": portfolio['last_updated'],
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_pct": round(total_gain_loss_pct, 2),
            "holdings_count": len(holdings_with_prices)
        },
        "holdings": holdings_with_prices
    }

    with open(docs_data_path, 'w') as f:
        json.dump(dashboard_data, f, indent=2)

    print(f"Saved dashboard data to docs/data.json")
    print(f"Portfolio Value: ${total_value:,.2f} ({total_gain_loss_pct:+.2f}%)")


if __name__ == "__main__":
    main()
