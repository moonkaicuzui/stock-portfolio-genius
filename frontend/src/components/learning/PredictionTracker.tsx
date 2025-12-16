"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  id: string;
  ticker: string;
  direction: "up" | "down" | "neutral";
  targetPercent: number;
  confidence: "high" | "medium" | "low";
  reason: string;
  timeframe: "1d" | "1w" | "1m" | "3m";
  createdAt: Date;
  targetDate: Date;
  status: "pending" | "success" | "failed" | "expired";
  actualPercent?: number;
  priceAtCreation: number;
  currentPrice?: number;
}

interface PredictionTrackerProps {
  predictions?: Prediction[];
  onAddPrediction?: (prediction: Omit<Prediction, "id" | "status">) => void;
  onResolvePrediction?: (id: string, actualPercent: number) => void;
  className?: string;
}

const CONFIDENCE_CONFIG = {
  high: { label: "높음", color: "bg-neon-green/20 text-neon-green" },
  medium: { label: "보통", color: "bg-neon-yellow/20 text-neon-yellow" },
  low: { label: "낮음", color: "bg-neon-red/20 text-neon-red" },
};

const TIMEFRAME_LABELS = {
  "1d": "1일",
  "1w": "1주일",
  "1m": "1개월",
  "3m": "3개월",
};

// Demo predictions
const DEMO_PREDICTIONS: Prediction[] = [
  {
    id: "1",
    ticker: "NVDA",
    direction: "up",
    targetPercent: 10,
    confidence: "high",
    reason: "AI 반도체 수요 급증, 데이터센터 투자 확대",
    timeframe: "1m",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    status: "pending",
    priceAtCreation: 850,
    currentPrice: 875.5,
  },
  {
    id: "2",
    ticker: "TSLA",
    direction: "down",
    targetPercent: -8,
    confidence: "medium",
    reason: "경쟁 심화, 가격 인하 압박",
    timeframe: "1w",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "pending",
    priceAtCreation: 260,
    currentPrice: 245,
  },
  {
    id: "3",
    ticker: "AMD",
    direction: "up",
    targetPercent: 15,
    confidence: "high",
    reason: "신규 칩 출시, 시장점유율 확대",
    timeframe: "1m",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "success",
    priceAtCreation: 155,
    currentPrice: 178.5,
    actualPercent: 15.2,
  },
  {
    id: "4",
    ticker: "AAPL",
    direction: "up",
    targetPercent: 5,
    confidence: "low",
    reason: "신제품 발표 기대",
    timeframe: "1w",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "failed",
    priceAtCreation: 190,
    currentPrice: 192.5,
    actualPercent: 1.3,
  },
  {
    id: "5",
    ticker: "MARA",
    direction: "up",
    targetPercent: 20,
    confidence: "medium",
    reason: "BTC 반감기 이후 상승 기대",
    timeframe: "3m",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() + 83 * 24 * 60 * 60 * 1000),
    status: "pending",
    priceAtCreation: 20,
    currentPrice: 22.5,
  },
];

export function PredictionTracker({
  predictions = DEMO_PREDICTIONS,
  className,
}: PredictionTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "success" | "failed">("all");

  // Initialize current time once on mount to avoid impure function calls during render
  const [now] = useState(() => Date.now());

  const stats = useMemo(() => ({
    total: predictions.length,
    pending: predictions.filter((p) => p.status === "pending").length,
    success: predictions.filter((p) => p.status === "success").length,
    failed: predictions.filter((p) => p.status === "failed").length,
    expired: predictions.filter((p) => p.status === "expired").length,
    successRate:
      predictions.filter((p) => p.status === "success" || p.status === "failed").length > 0
        ? (predictions.filter((p) => p.status === "success").length /
            predictions.filter((p) => p.status === "success" || p.status === "failed").length) *
          100
        : 0,
  }), [predictions]);

  const filteredPredictions = useMemo(() => predictions.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  }), [predictions, filterStatus]);

  const getDaysRemaining = (targetDate: Date): number => {
    return Math.ceil((targetDate.getTime() - now) / (1000 * 60 * 60 * 24));
  };

  const getCurrentProgress = (prediction: Prediction): number => {
    if (!prediction.currentPrice) return 0;
    return ((prediction.currentPrice - prediction.priceAtCreation) / prediction.priceAtCreation) * 100;
  };

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-neon-blue" />
          <div>
            <h3 className="font-medium">예측 추적</h3>
            <p className="text-xs text-foreground-muted">AI 예측 검증 시스템</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary text-xs"
        >
          <Plus className="w-3 h-3" />
          예측 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-background-tertiary text-center">
          <div className="text-lg font-bold text-neon-yellow">{stats.pending}</div>
          <div className="text-[10px] text-foreground-muted">진행중</div>
        </div>
        <div className="p-2 rounded-lg bg-background-tertiary text-center">
          <div className="text-lg font-bold text-neon-green">{stats.success}</div>
          <div className="text-[10px] text-foreground-muted">성공</div>
        </div>
        <div className="p-2 rounded-lg bg-background-tertiary text-center">
          <div className="text-lg font-bold text-neon-red">{stats.failed}</div>
          <div className="text-[10px] text-foreground-muted">실패</div>
        </div>
        <div className="p-2 rounded-lg bg-background-tertiary text-center">
          <div className="text-lg font-bold text-neon-blue">{stats.successRate.toFixed(0)}%</div>
          <div className="text-[10px] text-foreground-muted">성공률</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4">
        {(["all", "pending", "success", "failed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors",
              filterStatus === status
                ? "bg-neon-blue text-black"
                : "bg-background-tertiary text-foreground-muted hover:text-foreground"
            )}
          >
            {status === "all" ? "전체" : status === "pending" ? "진행중" : status === "success" ? "성공" : "실패"}
          </button>
        ))}
      </div>

      {/* Predictions List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">예측이 없습니다</p>
          </div>
        ) : (
          filteredPredictions.map((prediction) => {
            const daysRemaining = getDaysRemaining(prediction.targetDate);
            const currentProgress = getCurrentProgress(prediction);
            const progressToTarget =
              prediction.direction === "up"
                ? (currentProgress / prediction.targetPercent) * 100
                : prediction.direction === "down"
                ? (currentProgress / prediction.targetPercent) * 100
                : 50;

            return (
              <div
                key={prediction.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  prediction.status === "pending"
                    ? "border-neon-yellow/30 bg-neon-yellow/5"
                    : prediction.status === "success"
                    ? "border-neon-green/30 bg-neon-green/5"
                    : "border-neon-red/30 bg-neon-red/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{prediction.ticker}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                        prediction.direction === "up"
                          ? "bg-neon-green/20 text-neon-green"
                          : prediction.direction === "down"
                          ? "bg-neon-red/20 text-neon-red"
                          : "bg-foreground-muted/20 text-foreground-muted"
                      )}
                    >
                      {prediction.direction === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : prediction.direction === "down" ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {prediction.targetPercent > 0 ? "+" : ""}
                      {prediction.targetPercent}%
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded", CONFIDENCE_CONFIG[prediction.confidence].color)}>
                      {CONFIDENCE_CONFIG[prediction.confidence].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {prediction.status === "pending" ? (
                      <Clock className="w-4 h-4 text-neon-yellow" />
                    ) : prediction.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                    ) : (
                      <XCircle className="w-4 h-4 text-neon-red" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-foreground-muted mb-2">{prediction.reason}</p>

                {/* Progress Bar */}
                {prediction.status === "pending" && (
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-foreground-muted mb-1">
                      <span>현재 진행률</span>
                      <span
                        className={cn(
                          "font-mono-numbers",
                          currentProgress >= 0 ? "text-neon-green" : "text-neon-red"
                        )}
                      >
                        {currentProgress >= 0 ? "+" : ""}
                        {currentProgress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          progressToTarget >= 100
                            ? "bg-neon-green"
                            : progressToTarget >= 50
                            ? "bg-neon-yellow"
                            : "bg-neon-red"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, progressToTarget))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actual Result */}
                {prediction.actualPercent !== undefined && (
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="text-foreground-muted">실제 결과:</span>
                    <span
                      className={cn(
                        "font-mono-numbers font-medium",
                        prediction.actualPercent >= 0 ? "text-neon-green" : "text-neon-red"
                      )}
                    >
                      {prediction.actualPercent >= 0 ? "+" : ""}
                      {prediction.actualPercent.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-foreground-muted pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{TIMEFRAME_LABELS[prediction.timeframe]}</span>
                  </div>
                  {prediction.status === "pending" && (
                    <span className={cn(daysRemaining <= 3 ? "text-neon-red" : "")}>
                      {daysRemaining > 0 ? `${daysRemaining}일 남음` : "기한 만료"}
                    </span>
                  )}
                  {prediction.status !== "pending" && (
                    <span>{prediction.targetDate.toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium mb-4">새 예측 추가</h3>
            <p className="text-sm text-foreground-muted mb-4">
              AI 비서가 예측을 기록하고 추적합니다.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="티커 (예: NVDA)"
                className="w-full bg-background-tertiary rounded-lg px-3 py-2 text-sm"
              />
              <select className="w-full bg-background-tertiary rounded-lg px-3 py-2 text-sm">
                <option value="up">상승 예측</option>
                <option value="down">하락 예측</option>
                <option value="neutral">횡보 예측</option>
              </select>
              <input
                type="number"
                placeholder="목표 변동률 (%)"
                className="w-full bg-background-tertiary rounded-lg px-3 py-2 text-sm"
              />
              <select className="w-full bg-background-tertiary rounded-lg px-3 py-2 text-sm">
                <option value="1d">1일</option>
                <option value="1w">1주일</option>
                <option value="1m">1개월</option>
                <option value="3m">3개월</option>
              </select>
              <textarea
                placeholder="예측 근거..."
                className="w-full bg-background-tertiary rounded-lg px-3 py-2 text-sm h-20"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 btn btn-ghost"
              >
                취소
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 btn btn-primary"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
