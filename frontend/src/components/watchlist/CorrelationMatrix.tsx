"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Info, RefreshCw } from "lucide-react";

interface CorrelationMatrixProps {
  tickers: string[];
  correlationData?: Record<string, Record<string, number>>;
  className?: string;
}

// Demo correlation data generator
function generateDemoCorrelations(tickers: string[]): Record<string, Record<string, number>> {
  const correlations: Record<string, Record<string, number>> = {};

  // Pre-defined correlation relationships for realistic data
  const correlationHints: Record<string, Record<string, number>> = {
    NVDA: { AMD: 0.85, MSFT: 0.65, AAPL: 0.55, GOOGL: 0.60, TSLA: 0.40, MARA: 0.35, SOXL: 0.92 },
    AMD: { NVDA: 0.85, MSFT: 0.55, AAPL: 0.45, GOOGL: 0.50, TSLA: 0.35, MARA: 0.30, SOXL: 0.88 },
    MSFT: { NVDA: 0.65, AMD: 0.55, AAPL: 0.75, GOOGL: 0.70, TSLA: 0.25, MARA: 0.15, SOXL: 0.60 },
    AAPL: { NVDA: 0.55, AMD: 0.45, MSFT: 0.75, GOOGL: 0.65, TSLA: 0.30, MARA: 0.20, SOXL: 0.50 },
    GOOGL: { NVDA: 0.60, AMD: 0.50, MSFT: 0.70, AAPL: 0.65, TSLA: 0.25, MARA: 0.18, SOXL: 0.55 },
    TSLA: { NVDA: 0.40, AMD: 0.35, MSFT: 0.25, AAPL: 0.30, GOOGL: 0.25, MARA: 0.55, SOXL: 0.45 },
    MARA: { NVDA: 0.35, AMD: 0.30, MSFT: 0.15, AAPL: 0.20, GOOGL: 0.18, TSLA: 0.55, SOXL: 0.38 },
    SOXL: { NVDA: 0.92, AMD: 0.88, MSFT: 0.60, AAPL: 0.50, GOOGL: 0.55, TSLA: 0.45, MARA: 0.38 },
  };

  tickers.forEach((ticker1) => {
    correlations[ticker1] = {};
    tickers.forEach((ticker2) => {
      if (ticker1 === ticker2) {
        correlations[ticker1][ticker2] = 1.0;
      } else {
        // Get predefined correlation or generate random
        const hint1 = correlationHints[ticker1]?.[ticker2];
        const hint2 = correlationHints[ticker2]?.[ticker1];
        const baseCorr = hint1 || hint2 || (Math.random() * 0.6 + 0.1);
        // Add small random variation
        const variation = (Math.random() - 0.5) * 0.1;
        correlations[ticker1][ticker2] = Math.min(1, Math.max(-1, baseCorr + variation));
      }
    });
  });

  return correlations;
}

function getCorrelationColor(value: number): string {
  if (value >= 0.7) return "bg-neon-red/80 text-white";
  if (value >= 0.5) return "bg-neon-yellow/60 text-black";
  if (value >= 0.3) return "bg-neon-green/40 text-white";
  if (value >= 0) return "bg-neon-green/20 text-white";
  if (value >= -0.3) return "bg-neon-blue/20 text-white";
  if (value >= -0.5) return "bg-neon-blue/40 text-white";
  return "bg-neon-blue/60 text-white";
}

function getCorrelationLabel(value: number): string {
  if (value >= 0.7) return "강한 양의 상관";
  if (value >= 0.5) return "중간 양의 상관";
  if (value >= 0.3) return "약한 양의 상관";
  if (value >= 0) return "약한 관계";
  if (value >= -0.3) return "약한 음의 상관";
  if (value >= -0.5) return "중간 음의 상관";
  return "강한 음의 상관";
}

export function CorrelationMatrix({
  tickers,
  correlationData,
  className,
}: CorrelationMatrixProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ ticker1: string; ticker2: string } | null>(null);

  const correlations = useMemo(() => {
    return correlationData || generateDemoCorrelations(tickers);
  }, [tickers, correlationData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (tickers.length === 0) {
    return (
      <div className={cn("card", className)}>
        <div className="text-center py-8 text-foreground-muted">
          <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">보유 종목이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">상관관계 분석</h3>
          <p className="text-xs text-foreground-muted">30일 기준 종목 간 가격 상관관계</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn btn-ghost text-xs"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          새로고침
        </button>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left"></th>
              {tickers.map((ticker) => (
                <th key={ticker} className="p-1 text-center font-mono font-bold">
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((ticker1) => (
              <tr key={ticker1}>
                <td className="p-1 font-mono font-bold">{ticker1}</td>
                {tickers.map((ticker2) => {
                  const value = correlations[ticker1]?.[ticker2] ?? 0;
                  const isHovered =
                    hoveredCell?.ticker1 === ticker1 && hoveredCell?.ticker2 === ticker2;
                  const isDiagonal = ticker1 === ticker2;

                  return (
                    <td
                      key={ticker2}
                      className="p-0.5"
                      onMouseEnter={() => setHoveredCell({ ticker1, ticker2 })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={cn(
                          "w-12 h-8 flex items-center justify-center rounded font-mono-numbers transition-all",
                          isDiagonal ? "bg-foreground/10" : getCorrelationColor(value),
                          isHovered && !isDiagonal && "ring-2 ring-white scale-110 z-10"
                        )}
                      >
                        {isDiagonal ? "-" : value.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hovered Info */}
      {hoveredCell && hoveredCell.ticker1 !== hoveredCell.ticker2 && (
        <div className="mt-4 p-3 rounded-lg bg-background-tertiary">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{hoveredCell.ticker1}</span>
            <span className="text-foreground-muted">↔</span>
            <span className="font-mono font-bold">{hoveredCell.ticker2}</span>
          </div>
          <div className="mt-1 text-sm">
            <span className="font-mono-numbers">
              {(correlations[hoveredCell.ticker1]?.[hoveredCell.ticker2] ?? 0).toFixed(3)}
            </span>
            <span className="text-foreground-muted ml-2">
              ({getCorrelationLabel(correlations[hoveredCell.ticker1]?.[hoveredCell.ticker2] ?? 0)})
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-foreground-muted mb-2">상관계수 범위</p>
        <div className="flex items-center gap-1 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-neon-blue/60" />
            <span>-1.0</span>
          </div>
          <div className="flex-1 h-3 rounded bg-gradient-to-r from-neon-blue/60 via-neon-green/30 to-neon-red/80" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-neon-red/80" />
            <span>+1.0</span>
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-foreground-muted">
          <span>음의 상관 (분산 효과)</span>
          <span>양의 상관 (동조 움직임)</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium">인사이트</p>
        <div className="text-xs text-foreground-muted space-y-1">
          <p>• 높은 상관관계(0.7+): 같이 움직이는 경향 → 분산 효과 낮음</p>
          <p>• 낮은/음의 상관관계: 서로 다르게 움직임 → 리스크 분산에 도움</p>
          <p>• 레버리지 ETF(SOXL)는 기초 자산과 높은 상관관계</p>
        </div>
      </div>
    </div>
  );
}
