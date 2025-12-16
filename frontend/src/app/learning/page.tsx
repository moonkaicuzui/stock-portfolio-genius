"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { LearningSystem, PredictionTracker } from "@/components/learning";
import { cn } from "@/lib/utils";

type TabType = "learning" | "predictions";

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<TabType>("learning");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">학습 & 예측</h1>
                  <p className="text-xs text-foreground-muted">
                    AI 비서 성장 시스템
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-neon-yellow">🥈 Lv.2</div>
                <div className="text-[10px] text-foreground-muted">경험 비서</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-neon-green">68%</div>
                <div className="text-[10px] text-foreground-muted">정확도</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-background-secondary">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("learning")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "learning"
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <Trophy className="w-4 h-4" />
              성장 시스템
            </button>
            <button
              onClick={() => setActiveTab("predictions")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "predictions"
                  ? "border-neon-blue text-neon-blue"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <Target className="w-4 h-4" />
              예측 추적
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "learning" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LearningSystem />
            </div>
            <div className="space-y-4">
              {/* How It Works */}
              <div className="card">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-neon-purple" />
                  자기 강화 학습이란?
                </h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">1.</span>
                    AI 비서가 예측과 추천을 제공합니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">2.</span>
                    실제 결과를 추적하고 검증합니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">3.</span>
                    정확한 예측일수록 경험치가 증가합니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">4.</span>
                    레벨업하면 더 정확한 분석이 가능해집니다
                  </li>
                </ul>
              </div>

              {/* Level Rewards */}
              <div className="card">
                <h3 className="font-medium mb-3">레벨별 혜택</h3>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-background-tertiary">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🥉</span>
                      <span className="text-sm font-medium">Lv.1 신입 비서</span>
                    </div>
                    <p className="text-xs text-foreground-muted">기본 포트폴리오 분석</p>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🥈</span>
                      <span className="text-sm font-medium">Lv.2 경험 비서</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-yellow/20 text-neon-yellow">현재</span>
                    </div>
                    <p className="text-xs text-foreground-muted">기술적 분석 + 패턴 인식</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background-tertiary opacity-60">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🥇</span>
                      <span className="text-sm font-medium">Lv.3 전문 비서</span>
                    </div>
                    <p className="text-xs text-foreground-muted">심층 분석 + 리스크 평가</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background-tertiary opacity-40">
                    <div className="flex items-center gap-2 mb-1">
                      <span>🏆</span>
                      <span className="text-sm font-medium">Lv.4 천재 비서</span>
                    </div>
                    <p className="text-xs text-foreground-muted">고급 전략 + 시장 예측</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background-tertiary opacity-30">
                    <div className="flex items-center gap-2 mb-1">
                      <span>💎</span>
                      <span className="text-sm font-medium">Lv.5 전설의 비서</span>
                    </div>
                    <p className="text-xs text-foreground-muted">모든 기능 + 특별 인사이트</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "predictions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PredictionTracker />
            </div>
            <div className="space-y-4">
              {/* Prediction Guide */}
              <div className="card">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-neon-blue" />
                  예측 추적 가이드
                </h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-blue">•</span>
                    AI 비서의 모든 예측이 자동으로 기록됩니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-blue">•</span>
                    예측 기간이 지나면 자동으로 검증됩니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-blue">•</span>
                    성공한 예측은 경험치로 전환됩니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-blue">•</span>
                    직접 예측을 추가하고 결과를 기록할 수 있습니다
                  </li>
                </ul>
              </div>

              {/* Accuracy Chart */}
              <div className="card">
                <h3 className="font-medium mb-3">정확도 트렌드</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">이번 달</span>
                      <span className="font-mono-numbers text-neon-green">72%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-green/60" style={{ width: "72%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">지난 달</span>
                      <span className="font-mono-numbers">65%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-foreground/30" style={{ width: "65%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">전체 평균</span>
                      <span className="font-mono-numbers">68%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-blue/60" style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-foreground-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-neon-green" />
                  정확도가 7% 향상되었습니다
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
