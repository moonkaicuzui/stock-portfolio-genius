"use client";

import { cn, formatCurrency, formatPercent, getChangeColorClass } from "@/lib/utils";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import type { Holding } from "@/lib/api";

interface HoldingsTableProps {
  holdings: Holding[];
  limit?: number;
  onSelectTicker?: (ticker: string) => void;
  showAll?: boolean;
}

export function HoldingsTable({
  holdings,
  limit = 5,
  onSelectTicker,
  showAll = false,
}: HoldingsTableProps) {
  const displayHoldings = showAll ? holdings : holdings.slice(0, limit);

  if (holdings.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium mb-4">보유 종목</h3>
        <div className="text-center py-8 text-foreground-muted">
          <p>보유 종목이 없습니다.</p>
          <p className="text-sm mt-2">종목을 추가해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">보유 종목</h3>
          <span className="text-sm text-foreground-muted">
            {holdings.length}개
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                종목
              </th>
              <th className="text-right p-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                현재가
              </th>
              <th className="text-right p-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                수익률
              </th>
              <th className="text-right p-3 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                평가금액
              </th>
            </tr>
          </thead>
          <tbody>
            {displayHoldings.map((holding, index) => {
              const isPositive = (holding.gainPercent || 0) > 0;
              const isNegative = (holding.gainPercent || 0) < 0;

              return (
                <tr
                  key={holding.id}
                  className={cn(
                    "border-b border-border cursor-pointer transition-colors",
                    "hover:bg-card-hover"
                  )}
                  onClick={() => onSelectTicker?.(holding.ticker)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          isPositive && "bg-neon-green-muted text-neon-green",
                          isNegative && "bg-neon-red-muted text-neon-red",
                          !isPositive && !isNegative && "bg-background-tertiary text-foreground-muted"
                        )}
                      >
                        {holding.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{holding.ticker}</div>
                        <div className="text-xs text-foreground-muted">
                          {holding.quantity}주 · 평단 ${holding.avgCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-mono-numbers font-medium">
                      ${holding.currentPrice?.toFixed(2) || "-"}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        getChangeColorClass(holding.gainPercent || 0)
                      )}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3" />}
                      {isNegative && <TrendingDown className="w-3 h-3" />}
                      {formatPercent(holding.gainPercent || 0)}
                    </div>
                    <div className="text-xs text-foreground-muted font-mono-numbers">
                      {(holding.gain || 0) >= 0 ? "+" : ""}
                      {formatCurrency(holding.gain || 0)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-mono-numbers font-medium">
                      {formatCurrency(holding.marketValue || 0)}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {holding.marketValue && holdings.length > 0 && (
                        <>
                          {(
                            (holding.marketValue /
                              holdings.reduce(
                                (sum, h) => sum + (h.marketValue || 0),
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAll && holdings.length > limit && (
        <div className="p-3 border-t border-border">
          <button className="w-full text-center text-sm text-neon-blue hover:text-neon-blue/80 transition-colors">
            전체 {holdings.length}개 보기
          </button>
        </div>
      )}
    </div>
  );
}
