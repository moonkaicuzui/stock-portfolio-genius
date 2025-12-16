"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Zap,
  BookOpen,
  BarChart3,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningRecord {
  id: string;
  type: "prediction" | "recommendation" | "analysis";
  ticker?: string;
  content: string;
  prediction?: {
    direction: "up" | "down" | "neutral";
    targetPercent: number;
    timeframe: string;
  };
  actualOutcome?: {
    direction: "up" | "down" | "neutral";
    actualPercent: number;
    isCorrect: boolean;
  };
  userFeedback?: "helpful" | "not_helpful" | null;
  createdAt: Date;
  resolvedAt?: Date;
}

interface AdvisorProgress {
  level: number;
  name: string;
  experience: number;
  experienceToNext: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  streak: number;
  badges: string[];
}

interface LearningSystemProps {
  records?: LearningRecord[];
  progress?: AdvisorProgress;
  onProvideFeedback?: (recordId: string, feedback: "helpful" | "not_helpful") => void;
  className?: string;
}

const LEVELS = [
  { level: 1, name: "신입 비서", emoji: "🥉", color: "text-zinc-400", minExp: 0 },
  { level: 2, name: "경험 비서", emoji: "🥈", color: "text-zinc-300", minExp: 100 },
  { level: 3, name: "전문 비서", emoji: "🥇", color: "text-yellow-400", minExp: 300 },
  { level: 4, name: "천재 비서", emoji: "🏆", color: "text-amber-400", minExp: 600 },
  { level: 5, name: "전설의 비서", emoji: "💎", color: "text-neon-purple", minExp: 1000 },
];

const BADGES = [
  { id: "first_correct", name: "첫 적중", emoji: "🎯", description: "첫 번째 예측 적중" },
  { id: "streak_5", name: "연속 5회", emoji: "🔥", description: "5회 연속 정확한 예측" },
  { id: "streak_10", name: "연속 10회", emoji: "⚡", description: "10회 연속 정확한 예측" },
  { id: "accuracy_70", name: "70% 달성", emoji: "📈", description: "정확도 70% 달성" },
  { id: "accuracy_80", name: "80% 달성", emoji: "🌟", description: "정확도 80% 달성" },
  { id: "predictions_50", name: "50예측", emoji: "📊", description: "총 50개 예측 완료" },
  { id: "predictions_100", name: "100예측", emoji: "💯", description: "총 100개 예측 완료" },
  { id: "helpful_10", name: "도움왕", emoji: "👍", description: "10개의 도움됨 피드백" },
];

// Demo data
const DEMO_PROGRESS: AdvisorProgress = {
  level: 2,
  name: "경험 비서",
  experience: 185,
  experienceToNext: 300,
  totalPredictions: 47,
  correctPredictions: 32,
  accuracyRate: 68.1,
  streak: 3,
  badges: ["first_correct", "streak_5", "predictions_50"],
};

const DEMO_RECORDS: LearningRecord[] = [
  {
    id: "1",
    type: "prediction",
    ticker: "NVDA",
    content: "AI 반도체 수요 증가로 10% 상승 예측",
    prediction: { direction: "up", targetPercent: 10, timeframe: "1주일" },
    actualOutcome: { direction: "up", actualPercent: 12.5, isCorrect: true },
    userFeedback: "helpful",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    type: "prediction",
    ticker: "TSLA",
    content: "실적 발표 후 5% 조정 예측",
    prediction: { direction: "down", targetPercent: -5, timeframe: "3일" },
    actualOutcome: { direction: "down", actualPercent: -7.2, isCorrect: true },
    userFeedback: "helpful",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "recommendation",
    ticker: "MARA",
    content: "BTC 상승 모멘텀으로 매수 권장",
    userFeedback: "helpful",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    type: "prediction",
    ticker: "AAPL",
    content: "제품 발표 이벤트로 3% 상승 예측",
    prediction: { direction: "up", targetPercent: 3, timeframe: "1주일" },
    actualOutcome: { direction: "up", actualPercent: 1.2, isCorrect: false },
    userFeedback: "not_helpful",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    type: "prediction",
    ticker: "AMD",
    content: "경쟁 심화로 하락 예측",
    prediction: { direction: "down", targetPercent: -5, timeframe: "2주일" },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export function LearningSystem({
  records = DEMO_RECORDS,
  progress = DEMO_PROGRESS,
  onProvideFeedback,
  className,
}: LearningSystemProps) {
  const [activeTab, setActiveTab] = useState<"progress" | "history" | "badges">("progress");

  const currentLevel = LEVELS.find((l) => l.level === progress.level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === progress.level + 1);

  const progressPercent = nextLevel
    ? ((progress.experience - currentLevel.minExp) /
        (nextLevel.minExp - currentLevel.minExp)) *
      100
    : 100;

  const pendingPredictions = records.filter(
    (r) => r.type === "prediction" && !r.actualOutcome
  );
  const resolvedPredictions = records.filter(
    (r) => r.type === "prediction" && r.actualOutcome
  );

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-neon-purple" />
          <div>
            <h3 className="font-medium">자기 강화 학습</h3>
            <p className="text-xs text-foreground-muted">AI 비서 성장 시스템</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 text-sm", currentLevel.color)}>
          <span>{currentLevel.emoji}</span>
          <span className="font-medium">{currentLevel.name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(["progress", "history", "badges"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-3 py-2 text-xs rounded-lg transition-colors",
              activeTab === tab
                ? "bg-neon-purple text-white"
                : "bg-background-tertiary text-foreground-muted hover:text-foreground"
            )}
          >
            {tab === "progress" ? "성장" : tab === "history" ? "기록" : "뱃지"}
          </button>
        ))}
      </div>

      {/* Progress Tab */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          {/* Level Progress */}
          <div className="p-4 rounded-lg bg-background-tertiary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">레벨 {progress.level}</span>
              {nextLevel && (
                <span className="text-xs text-foreground-muted">
                  다음: {nextLevel.emoji} {nextLevel.name}
                </span>
              )}
            </div>
            <div className="h-3 bg-background rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-neon-purple to-neon-blue transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>EXP: {progress.experience}</span>
              {nextLevel && <span>다음 레벨: {nextLevel.minExp}</span>}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background-tertiary text-center">
              <div className="flex items-center justify-center gap-1 text-neon-green mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xl font-bold">{progress.accuracyRate.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-foreground-muted">정확도</div>
            </div>
            <div className="p-3 rounded-lg bg-background-tertiary text-center">
              <div className="flex items-center justify-center gap-1 text-neon-yellow mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xl font-bold">{progress.streak}</span>
              </div>
              <div className="text-xs text-foreground-muted">연속 적중</div>
            </div>
            <div className="p-3 rounded-lg bg-background-tertiary text-center">
              <div className="flex items-center justify-center gap-1 text-neon-blue mb-1">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xl font-bold">{progress.totalPredictions}</span>
              </div>
              <div className="text-xs text-foreground-muted">총 예측</div>
            </div>
            <div className="p-3 rounded-lg bg-background-tertiary text-center">
              <div className="flex items-center justify-center gap-1 text-neon-purple mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xl font-bold">{progress.badges.length}</span>
              </div>
              <div className="text-xs text-foreground-muted">획득 뱃지</div>
            </div>
          </div>

          {/* Pending Predictions */}
          {pendingPredictions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-yellow" />
                진행 중인 예측 ({pendingPredictions.length})
              </h4>
              <div className="space-y-2">
                {pendingPredictions.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="p-2 rounded-lg bg-background-tertiary text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold">{record.ticker}</span>
                      {record.prediction && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded",
                            record.prediction.direction === "up"
                              ? "bg-neon-green/20 text-neon-green"
                              : "bg-neon-red/20 text-neon-red"
                          )}
                        >
                          {record.prediction.direction === "up" ? "↑" : "↓"}{" "}
                          {Math.abs(record.prediction.targetPercent)}%
                        </span>
                      )}
                    </div>
                    <p className="text-foreground-muted">{record.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {records.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">기록이 없습니다</p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-lg border border-border hover:border-border-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {record.ticker && (
                      <span className="font-mono font-bold text-sm">{record.ticker}</span>
                    )}
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        record.type === "prediction"
                          ? "bg-neon-blue/20 text-neon-blue"
                          : record.type === "recommendation"
                          ? "bg-neon-green/20 text-neon-green"
                          : "bg-neon-purple/20 text-neon-purple"
                      )}
                    >
                      {record.type === "prediction"
                        ? "예측"
                        : record.type === "recommendation"
                        ? "추천"
                        : "분석"}
                    </span>
                    {record.actualOutcome && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          record.actualOutcome.isCorrect
                            ? "bg-neon-green/20 text-neon-green"
                            : "bg-neon-red/20 text-neon-red"
                        )}
                      >
                        {record.actualOutcome.isCorrect ? "✓ 적중" : "✗ 실패"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {record.createdAt.toLocaleDateString("ko-KR")}
                  </span>
                </div>

                <p className="text-sm mb-2">{record.content}</p>

                {record.prediction && record.actualOutcome && (
                  <div className="flex gap-4 text-xs mb-2">
                    <span className="text-foreground-muted">
                      예측: {record.prediction.targetPercent > 0 ? "+" : ""}
                      {record.prediction.targetPercent}%
                    </span>
                    <span
                      className={cn(
                        record.actualOutcome.actualPercent >= 0
                          ? "text-neon-green"
                          : "text-neon-red"
                      )}
                    >
                      실제: {record.actualOutcome.actualPercent > 0 ? "+" : ""}
                      {record.actualOutcome.actualPercent}%
                    </span>
                  </div>
                )}

                {/* Feedback */}
                {record.userFeedback === null || record.userFeedback === undefined ? (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => onProvideFeedback?.(record.id, "helpful")}
                      className="flex-1 btn btn-ghost text-xs text-neon-green"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      도움됨
                    </button>
                    <button
                      onClick={() => onProvideFeedback?.(record.id, "not_helpful")}
                      className="flex-1 btn btn-ghost text-xs text-neon-red"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      아니오
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-foreground-muted pt-2 border-t border-border">
                    피드백: {record.userFeedback === "helpful" ? "👍 도움됨" : "👎 아니오"}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === "badges" && (
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = progress.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  isUnlocked
                    ? "border-neon-yellow/50 bg-neon-yellow/10"
                    : "border-border opacity-50"
                )}
              >
                <div className="text-2xl mb-1">{isUnlocked ? badge.emoji : "🔒"}</div>
                <div className="text-sm font-medium">{badge.name}</div>
                <div className="text-xs text-foreground-muted">{badge.description}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
