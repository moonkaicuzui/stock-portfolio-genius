"use client";

import { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Brain,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "opportunity" | "risk" | "tip" | "action";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  ticker?: string;
  createdAt: Date;
}

interface AIInsightsProps {
  portfolioData?: {
    holdings: Array<{ ticker: string; quantity: number; currentPrice: number; avgCost: number }>;
    totalValue: number;
  };
  className?: string;
}

const INSIGHT_ICONS = {
  opportunity: TrendingUp,
  risk: AlertTriangle,
  tip: Lightbulb,
  action: Target,
};

const INSIGHT_COLORS = {
  opportunity: "text-neon-green bg-neon-green/10 border-neon-green/30",
  risk: "text-neon-red bg-neon-red/10 border-neon-red/30",
  tip: "text-neon-blue bg-neon-blue/10 border-neon-blue/30",
  action: "text-neon-purple bg-neon-purple/10 border-neon-purple/30",
};

const IMPACT_BADGES = {
  high: "bg-neon-red/20 text-neon-red",
  medium: "bg-neon-yellow/20 text-neon-yellow",
  low: "bg-neon-green/20 text-neon-green",
};

// Demo insights generator
function generateDemoInsights(
  portfolioData?: AIInsightsProps["portfolioData"]
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Generate portfolio-based insights
  if (portfolioData && portfolioData.holdings.length > 0) {
    // Check for concentrated positions
    portfolioData.holdings.forEach((holding) => {
      const positionValue = holding.quantity * holding.currentPrice;
      const concentration = (positionValue / portfolioData.totalValue) * 100;
      const returnPercent = ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100;

      if (concentration > 25) {
        insights.push({
          id: `risk-${holding.ticker}`,
          type: "risk",
          title: `${holding.ticker} 집중 리스크`,
          description: `${holding.ticker}이 포트폴리오의 ${concentration.toFixed(1)}%를 차지합니다. 분산 투자를 고려하세요.`,
          impact: concentration > 40 ? "high" : "medium",
          ticker: holding.ticker,
          createdAt: now,
        });
      }

      if (returnPercent > 30) {
        insights.push({
          id: `opportunity-${holding.ticker}`,
          type: "opportunity",
          title: `${holding.ticker} 수익 실현 기회`,
          description: `${holding.ticker}이 ${returnPercent.toFixed(1)}% 상승했습니다. 부분 매도로 수익을 실현하는 것을 고려해보세요.`,
          impact: returnPercent > 50 ? "high" : "medium",
          ticker: holding.ticker,
          createdAt: now,
        });
      }

      if (returnPercent < -15) {
        insights.push({
          id: `action-${holding.ticker}`,
          type: "action",
          title: `${holding.ticker} 손실 관리`,
          description: `${holding.ticker}이 ${Math.abs(returnPercent).toFixed(1)}% 하락했습니다. 손절 또는 추가 매수를 검토하세요.`,
          impact: returnPercent < -25 ? "high" : "medium",
          ticker: holding.ticker,
          createdAt: now,
        });
      }
    });
  }

  // Add general tips
  insights.push({
    id: "tip-diversification",
    type: "tip",
    title: "분산 투자 원칙",
    description: "개별 종목은 전체 포트폴리오의 5-10%를 넘지 않도록 관리하세요.",
    impact: "low",
    createdAt: now,
  });

  insights.push({
    id: "tip-rebalancing",
    type: "tip",
    title: "정기 리밸런싱",
    description: "분기별로 목표 비중에 맞게 리밸런싱하면 리스크를 줄일 수 있습니다.",
    impact: "low",
    createdAt: now,
  });

  return insights.slice(0, 5);
}

export function AIInsights({ portfolioData, className }: AIInsightsProps) {
  // Initialize with demo insights to avoid setState in effect
  const [insights, setInsights] = useState<Insight[]>(() => generateDemoInsights(portfolioData));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const refreshInsights = async () => {
    setIsLoading(true);
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setInsights(generateDemoInsights(portfolioData));
    setIsLoading(false);
  };

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-medium">AI 인사이트</h3>
            <p className="text-xs text-foreground-muted">실시간 포트폴리오 분석</p>
          </div>
        </div>
        <button
          onClick={refreshInsights}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50"
          title="새로고침"
        >
          <RefreshCw className={cn("w-4 h-4 text-foreground-muted", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-foreground-muted">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-sm">AI 분석 중...</span>
            </div>
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight) => {
            const Icon = INSIGHT_ICONS[insight.type];
            return (
              <button
                key={insight.id}
                onClick={() => setSelectedInsight(insight)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.01]",
                  INSIGHT_COLORS[insight.type]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{insight.title}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px]", IMPACT_BADGES[insight.impact])}>
                        {insight.impact === "high" ? "높음" : insight.impact === "medium" ? "중간" : "낮음"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted line-clamp-2">{insight.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-foreground-muted">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">포트폴리오가 안정적입니다</p>
            <p className="text-xs">특별한 주의사항이 없습니다</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-neon-green">
            {insights.filter((i) => i.type === "opportunity").length}
          </div>
          <div className="text-[10px] text-foreground-muted">기회</div>
        </div>
        <div>
          <div className="text-lg font-bold text-neon-red">
            {insights.filter((i) => i.type === "risk").length}
          </div>
          <div className="text-[10px] text-foreground-muted">리스크</div>
        </div>
        <div>
          <div className="text-lg font-bold text-neon-blue">
            {insights.filter((i) => i.type === "tip" || i.type === "action").length}
          </div>
          <div className="text-[10px] text-foreground-muted">팁</div>
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  INSIGHT_COLORS[selectedInsight.type].split(" ")[1]
                )}
              >
                {(() => {
                  const Icon = INSIGHT_ICONS[selectedInsight.type];
                  return <Icon className={cn("w-5 h-5", INSIGHT_COLORS[selectedInsight.type].split(" ")[0])} />;
                })()}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{selectedInsight.title}</h4>
                {selectedInsight.ticker && (
                  <span className="text-xs font-mono text-neon-blue">{selectedInsight.ticker}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="p-1 rounded hover:bg-background-tertiary"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <p className="text-sm text-foreground-muted mb-4">{selectedInsight.description}</p>

            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span className={cn("px-2 py-0.5 rounded", IMPACT_BADGES[selectedInsight.impact])}>
                영향도: {selectedInsight.impact === "high" ? "높음" : selectedInsight.impact === "medium" ? "중간" : "낮음"}
              </span>
              <span>•</span>
              <span>{selectedInsight.createdAt.toLocaleTimeString("ko-KR")}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedInsight(null)}
                className="w-full btn btn-primary"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
