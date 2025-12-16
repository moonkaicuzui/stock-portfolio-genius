"use client";

import Link from "next/link";
import { Bot, Bell, AlertTriangle, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: "alert" | "opportunity" | "warning" | "insight";
  ticker?: string;
  title: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
}

interface AISuggestionsProps {
  suggestions: Suggestion[];
  onViewDetail?: (suggestion: Suggestion) => void;
  advisorLevel?: number;
  advisorName?: string;
}

const ADVISOR_LEVELS = {
  1: { name: "신입 비서", emoji: "🥉", color: "text-zinc-400" },
  2: { name: "경험 비서", emoji: "🥈", color: "text-zinc-300" },
  3: { name: "전문 비서", emoji: "🥇", color: "text-yellow-400" },
  4: { name: "천재 비서", emoji: "🏆", color: "text-amber-400" },
};

const TYPE_CONFIG = {
  alert: {
    icon: Bell,
    bgColor: "bg-neon-blue-muted",
    textColor: "text-neon-blue",
    label: "알림",
  },
  opportunity: {
    icon: TrendingUp,
    bgColor: "bg-neon-green-muted",
    textColor: "text-neon-green",
    label: "기회",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-neon-yellow-muted",
    textColor: "text-neon-yellow",
    label: "주의",
  },
  insight: {
    icon: Sparkles,
    bgColor: "bg-neon-purple-muted",
    textColor: "text-neon-purple",
    label: "인사이트",
  },
};

export function AISuggestions({
  suggestions,
  onViewDetail,
  advisorLevel = 1,
  advisorName,
}: AISuggestionsProps) {
  const level = ADVISOR_LEVELS[advisorLevel as keyof typeof ADVISOR_LEVELS] || ADVISOR_LEVELS[1];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-purple-muted flex items-center justify-center">
            <Bot className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-medium flex items-center gap-2">
              AI 투자 비서
              <span className={cn("text-sm", level.color)}>
                {level.emoji} {level.name}
              </span>
            </h3>
            <p className="text-xs text-foreground-muted">
              {advisorName || "포트폴리오 분석 및 제안"}
            </p>
          </div>
        </div>
        <button className="btn btn-ghost text-xs">
          설정
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-6 text-foreground-muted">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>현재 특별한 제안이 없습니다.</p>
            <p className="text-sm mt-1">시장 상황을 모니터링 중입니다.</p>
          </div>
        ) : (
          suggestions.map((suggestion) => {
            const config = TYPE_CONFIG[suggestion.type];
            const Icon = config.icon;

            return (
              <div
                key={suggestion.id}
                className={cn(
                  "p-3 rounded-lg border border-border",
                  "hover:border-border-hover hover:bg-card-hover",
                  "transition-all cursor-pointer group"
                )}
                onClick={() => onViewDetail?.(suggestion)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.textColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {suggestion.ticker && (
                        <span className="font-mono font-bold text-sm">
                          {suggestion.ticker}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          config.bgColor,
                          config.textColor
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm">{suggestion.title}</p>
                    <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-foreground-muted">
                        {suggestion.timestamp}
                      </span>
                      {suggestion.actionLabel && (
                        <span className="text-xs text-neon-blue flex items-center gap-1 group-hover:gap-2 transition-all">
                          {suggestion.actionLabel}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-2">
          <Link href="/ai-advisor" className="btn btn-ghost flex-1 text-xs">
            <Bot className="w-3 h-3" />
            AI 채팅
          </Link>
          <button className="btn btn-ghost flex-1 text-xs">
            <Bell className="w-3 h-3" />
            알림 설정
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo data for development
export const DEMO_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    type: "opportunity",
    ticker: "MARA",
    title: "BTC $105K 돌파로 마이닝주 상승 기대",
    description:
      "RSI 45로 아직 과매수 구간이 아닙니다. 현재 비중 8% → 10% 증가를 고려해보세요.",
    timestamp: "10분 전",
    actionLabel: "상세보기",
  },
  {
    id: "2",
    type: "warning",
    ticker: "SOXL",
    title: "3일 연속 상승 후 decay 주의",
    description:
      "레버리지 ETF 특성상 장기 보유 시 손실 위험이 있습니다. 단기 차익실현을 고려하세요.",
    timestamp: "1시간 전",
    actionLabel: "상세보기",
  },
  {
    id: "3",
    type: "insight",
    title: "포트폴리오 집중도 점검",
    description:
      "반도체 섹터 비중이 35%로 높습니다. 분산 투자를 고려해보세요.",
    timestamp: "오늘",
    actionLabel: "분석보기",
  },
];
