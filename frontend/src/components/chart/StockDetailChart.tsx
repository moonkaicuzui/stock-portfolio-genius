"use client";

import { useState } from "react";
import { Time } from "lightweight-charts";
import { TradingChart, OHLCVData } from "./TradingChart";
import { RSIChart } from "./RSIChart";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, Clock, BarChart3 } from "lucide-react";

interface StockDetailChartProps {
  ticker: string;
  data: OHLCVData[];
  currentPrice?: number;
  previousClose?: number;
  high52Week?: number;
  low52Week?: number;
  volume?: number;
  avgVolume?: number;
  className?: string;
}

type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export function StockDetailChart({
  ticker,
  data,
  currentPrice,
  previousClose,
  high52Week,
  low52Week,
  volume,
  avgVolume,
  className,
}: StockDetailChartProps) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("1M");
  const [showRSI, setShowRSI] = useState(false);

  // Calculate price change
  const priceChange = currentPrice && previousClose ? currentPrice - previousClose : 0;
  const priceChangePercent =
    currentPrice && previousClose ? ((priceChange / previousClose) * 100) : 0;
  const isPositive = priceChange >= 0;

  // Calculate position in 52-week range
  const range52Week =
    high52Week && low52Week && currentPrice
      ? ((currentPrice - low52Week) / (high52Week - low52Week)) * 100
      : 50;

  // Volume comparison
  const volumeRatio = volume && avgVolume ? volume / avgVolume : 1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Price Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold">{ticker}</span>
              {currentPrice && (
                <span className="text-2xl font-mono-numbers font-semibold">
                  ${currentPrice.toFixed(2)}
                </span>
              )}
            </div>
            {priceChange !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-2 mt-1",
                  isPositive ? "text-neon-green" : "text-neon-red"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-mono-numbers font-medium">
                  {isPositive ? "+" : ""}
                  {priceChange.toFixed(2)} ({isPositive ? "+" : ""}
                  {priceChangePercent.toFixed(2)}%)
                </span>
                <span className="text-sm text-foreground-muted">오늘</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {previousClose && (
              <div>
                <span className="text-foreground-muted">전일 종가</span>
                <span className="ml-2 font-mono-numbers">${previousClose.toFixed(2)}</span>
              </div>
            )}
            {volume && (
              <div>
                <span className="text-foreground-muted">거래량</span>
                <span className="ml-2 font-mono-numbers">
                  {(volume / 1e6).toFixed(2)}M
                </span>
              </div>
            )}
            {high52Week && (
              <div>
                <span className="text-foreground-muted">52주 최고</span>
                <span className="ml-2 font-mono-numbers text-neon-green">
                  ${high52Week.toFixed(2)}
                </span>
              </div>
            )}
            {low52Week && (
              <div>
                <span className="text-foreground-muted">52주 최저</span>
                <span className="ml-2 font-mono-numbers text-neon-red">
                  ${low52Week.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 52-Week Range Bar */}
        {high52Week && low52Week && currentPrice && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-foreground-muted mb-1">
              <span>${low52Week.toFixed(2)}</span>
              <span>52주 범위</span>
              <span>${high52Week.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-red via-neon-yellow to-neon-green relative"
                style={{ width: "100%" }}
              >
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{ left: `${range52Week}%`, transform: "translateX(-50%)" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Volume Indicator */}
        {volumeRatio && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <BarChart3 className="w-3 h-3 text-foreground-muted" />
            <span className="text-foreground-muted">거래량:</span>
            <span
              className={cn(
                "font-medium",
                volumeRatio > 1.5
                  ? "text-neon-green"
                  : volumeRatio < 0.5
                  ? "text-neon-red"
                  : "text-foreground"
              )}
            >
              평균 대비 {(volumeRatio * 100).toFixed(0)}%
            </span>
            {volumeRatio > 2 && (
              <span className="px-1.5 py-0.5 bg-neon-green-muted text-neon-green rounded text-[10px]">
                급등
              </span>
            )}
          </div>
        )}
      </div>

      {/* Time Frame Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeFrame(tf)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg transition-colors",
                selectedTimeFrame === tf
                  ? "bg-neon-blue text-black font-medium"
                  : "text-foreground-muted hover:bg-background-tertiary"
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1",
              showRSI
                ? "bg-neon-purple text-white"
                : "text-foreground-muted hover:bg-background-tertiary"
            )}
          >
            <Activity className="w-3 h-3" />
            RSI
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <TradingChart
        ticker={ticker}
        data={data}
        height={400}
        showVolume={true}
        showIndicators={true}
      />

      {/* RSI Chart (Optional) */}
      {showRSI && (
        <div className="card p-0 overflow-hidden">
          <RSIChart data={data} period={14} height={120} />
        </div>
      )}
    </div>
  );
}

// Demo data generator for development
export function generateDemoOHLCVData(days: number = 90, basePrice: number = 100): OHLCVData[] {
  const data: OHLCVData[] = [];
  let price = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * (price * 0.03);
    price = Math.max(price + change, price * 0.5);

    const volatility = price * 0.02;
    const open = price + (Math.random() - 0.5) * volatility;
    const close = price + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(1e6 + Math.random() * 5e6);

    data.push({
      time: date.toISOString().split("T")[0] as unknown as Time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}
