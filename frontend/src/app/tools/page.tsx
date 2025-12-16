"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Star,
  GitCompare,
  BookOpen,
} from "lucide-react";
import { Watchlist, CorrelationMatrix } from "@/components/watchlist";
import { TradingJournal } from "@/components/journal";
import { cn } from "@/lib/utils";

type TabType = "watchlist" | "correlation" | "journal";

// Demo tickers for correlation matrix
const DEMO_TICKERS = ["NVDA", "AMD", "MSFT", "AAPL", "GOOGL", "TSLA", "MARA"];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("watchlist");

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
                <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">분석 도구</h1>
                  <p className="text-xs text-foreground-muted">
                    관심종목, 상관관계, 매매일지
                  </p>
                </div>
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
              onClick={() => setActiveTab("watchlist")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "watchlist"
                  ? "border-neon-yellow text-neon-yellow"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <Star className="w-4 h-4" />
              관심 종목
            </button>
            <button
              onClick={() => setActiveTab("correlation")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "correlation"
                  ? "border-neon-blue text-neon-blue"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <GitCompare className="w-4 h-4" />
              상관관계
            </button>
            <button
              onClick={() => setActiveTab("journal")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "journal"
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <BookOpen className="w-4 h-4" />
              매매 일지
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "watchlist" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Watchlist />
            </div>
            <div className="space-y-4">
              {/* Watchlist Tips */}
              <div className="card">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-neon-yellow" />
                  관심 종목 활용 팁
                </h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-yellow">•</span>
                    알림 가격을 설정하면 목표가 도달 시 알려드려요
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-yellow">•</span>
                    태그를 추가해 종목을 그룹화하세요
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-yellow">•</span>
                    정기적으로 관심 종목을 검토하세요
                  </li>
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="card">
                <h3 className="font-medium mb-3">시장 요약</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">S&P 500</span>
                    <span className="text-neon-green font-mono-numbers">+0.85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">NASDAQ</span>
                    <span className="text-neon-green font-mono-numbers">+1.23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">VIX</span>
                    <span className="text-neon-red font-mono-numbers">-2.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "correlation" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CorrelationMatrix tickers={DEMO_TICKERS} />
            </div>
            <div className="space-y-4">
              {/* Correlation Guide */}
              <div className="card">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-neon-blue" />
                  상관관계란?
                </h3>
                <p className="text-xs text-foreground-muted mb-3">
                  상관관계는 두 종목이 얼마나 같은 방향으로 움직이는지를 나타냅니다.
                </p>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-red">+1.0</span>
                    완전한 양의 상관 (같이 움직임)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground-muted">0</span>
                    상관관계 없음
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-blue">-1.0</span>
                    완전한 음의 상관 (반대로 움직임)
                  </li>
                </ul>
              </div>

              {/* Diversification Tips */}
              <div className="card bg-background-tertiary">
                <h3 className="font-medium mb-3">분산 투자 전략</h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li>• 상관관계 0.5 이하 종목을 조합하세요</li>
                  <li>• 섹터 간 분산을 고려하세요</li>
                  <li>• 레버리지 ETF는 기초자산과 높은 상관관계</li>
                  <li>• 리스크 분산을 위해 10개 이상 종목 권장</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TradingJournal />
            </div>
            <div className="space-y-4">
              {/* Journal Benefits */}
              <div className="card">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neon-purple" />
                  매매일지의 중요성
                </h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    매매 패턴과 실수를 파악할 수 있습니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    감정적 매매를 객관화할 수 있습니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    성공/실패 원인을 분석할 수 있습니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    투자 실력 향상에 도움이 됩니다
                  </li>
                </ul>
              </div>

              {/* Journal Stats */}
              <div className="card">
                <h3 className="font-medium mb-3">기록 통계</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">이번 달 기록</span>
                      <span className="font-mono-numbers">12건</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-purple" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">FOMO 매매</span>
                      <span className="font-mono-numbers text-neon-red">2건</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-red/60" style={{ width: "17%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-muted">계획된 매매</span>
                      <span className="font-mono-numbers text-neon-green">10건</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-green/60" style={{ width: "83%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
