"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Brain,
  Settings,
  Sparkles,
  BookOpen,
  Target,
  Shield,
  Zap,
  Loader2,
} from "lucide-react";
import { AIChat, AIInsights } from "@/components/ai";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import type { Holding, StockQuote } from "@/lib/api";

// Demo portfolio data for fallback
const DEMO_PORTFOLIO = {
  holdings: [
    { ticker: "NVDA", quantity: 50, currentPrice: 875.5, avgCost: 450.0 },
    { ticker: "AAPL", quantity: 100, currentPrice: 192.5, avgCost: 165.0 },
    { ticker: "TSLA", quantity: 30, currentPrice: 245.0, avgCost: 280.0 },
    { ticker: "MSFT", quantity: 75, currentPrice: 425.0, avgCost: 350.0 },
  ],
  totalValue: 50 * 875.5 + 100 * 192.5 + 30 * 245.0 + 75 * 425.0,
  todayReturn: 1250.5,
  todayReturnPercent: 1.42,
};

type TabType = "chat" | "insights" | "learn";

const LEARNING_TOPICS = [
  {
    id: "basics",
    icon: BookOpen,
    title: "투자 기초",
    description: "주식 투자의 기본 개념과 용어를 배워보세요",
    topics: ["P/E 비율이란?", "시가총액 이해하기", "배당금과 배당수익률"],
  },
  {
    id: "technical",
    icon: Target,
    title: "기술적 분석",
    description: "차트 분석과 기술적 지표를 학습합니다",
    topics: ["이동평균선 활용", "RSI 지표 이해하기", "볼린저 밴드 전략"],
  },
  {
    id: "risk",
    icon: Shield,
    title: "리스크 관리",
    description: "투자 위험을 관리하는 방법을 익힙니다",
    topics: ["분산 투자 전략", "손절매 설정하기", "포트폴리오 리밸런싱"],
  },
  {
    id: "strategy",
    icon: Zap,
    title: "투자 전략",
    description: "다양한 투자 전략을 알아봅니다",
    topics: ["가치 투자란?", "성장주 vs 배당주", "ETF 투자 전략"],
  },
];

export default function AIAdvisorPage() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    try {
      const holdingsData = await api.getHoldings();
      setHoldings(holdingsData);
      setBackendAvailable(true);

      // Fetch quotes for all holdings
      if (holdingsData.length > 0) {
        const tickers = holdingsData.map((h) => h.ticker);
        const response = await api.getBatchQuotes(tickers);
        const quotesMap: Record<string, StockQuote> = {};
        for (const [ticker, data] of Object.entries(response.quotes)) {
          quotesMap[ticker] = {
            ticker,
            price: data.price || 0,
            previousClose: 0,
            open: 0,
            high: 0,
            low: 0,
            volume: data.volume || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            timestamp: new Date().toISOString(),
            source: "backend",
          };
        }
        setQuotes(quotesMap);
      }
    } catch (err) {
      console.warn("Backend not available, using demo data");
      setBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPortfolioData().finally(() => setIsLoading(false));
  }, [fetchPortfolioData]);

  // Calculate portfolio data for AI context
  const portfolioData = useMemo(() => {
    if (!backendAvailable || holdings.length === 0) {
      return DEMO_PORTFOLIO;
    }

    const enrichedHoldings = holdings.map((h) => {
      const quote = quotes[h.ticker];
      const currentPrice = quote?.price || h.currentPrice || h.avgCost;
      return {
        ticker: h.ticker,
        quantity: h.quantity,
        avgCost: h.avgCost,
        currentPrice,
      };
    });

    const totalValue = enrichedHoldings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );

    let todayReturn = 0;
    enrichedHoldings.forEach((h) => {
      const quote = quotes[h.ticker];
      if (quote) {
        todayReturn += (quote.change || 0) * h.quantity;
      }
    });
    const todayReturnPercent = totalValue > 0 ? (todayReturn / totalValue) * 100 : 0;

    return {
      holdings: enrichedHoldings,
      totalValue,
      todayReturn,
      todayReturnPercent,
    };
  }, [holdings, quotes, backendAvailable]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-neon-purple mx-auto mb-3" />
          <p className="text-foreground-muted">포트폴리오 로딩 중...</p>
        </div>
      </div>
    );
  }

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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI 투자 비서</h1>
                  <p className="text-xs text-foreground-muted">
                    Powered by Local LLM (Ollama)
                    {!backendAvailable && (
                      <span className="ml-2 text-neon-yellow">(데모 모드)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <button className="btn btn-ghost">
              <Settings className="w-4 h-4" />
              설정
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-background-secondary">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "chat"
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              AI 채팅
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "insights"
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <Brain className="w-4 h-4" />
              인사이트
            </button>
            <button
              onClick={() => setActiveTab("learn")}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === "learn"
                  ? "border-neon-purple text-neon-purple"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              학습하기
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Section */}
            <div className="lg:col-span-2">
              <AIChat
                portfolioContext={{
                  holdings: portfolioData.holdings.map((h) => ({
                    ticker: h.ticker,
                    quantity: h.quantity,
                    avgCost: h.avgCost,
                  })),
                  totalValue: portfolioData.totalValue,
                  todayReturn: portfolioData.todayReturn,
                  todayReturnPercent: portfolioData.todayReturnPercent,
                }}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="card">
                <h3 className="text-sm font-medium mb-3">포트폴리오 요약</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">총 자산</span>
                    <span className="font-mono-numbers font-medium">
                      ${portfolioData.totalValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">오늘 수익</span>
                    <span className={cn(
                      "font-mono-numbers",
                      portfolioData.todayReturn >= 0 ? "text-neon-green" : "text-neon-red"
                    )}>
                      {portfolioData.todayReturn >= 0 ? "+" : ""}${portfolioData.todayReturn.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">보유 종목</span>
                    <span className="font-mono-numbers">
                      {portfolioData.holdings.length}개
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Tips */}
              <div className="card">
                <h3 className="text-sm font-medium mb-3">AI 활용 팁</h3>
                <ul className="space-y-2 text-xs text-foreground-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    &ldquo;포트폴리오 분석해줘&rdquo;로 전체 분석을 요청하세요
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    특정 종목에 대해 &ldquo;NVDA 전망 어때?&rdquo;라고 물어보세요
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    &ldquo;리밸런싱 제안해줘&rdquo;로 조정 의견을 받아보세요
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-purple">•</span>
                    투자 용어나 개념에 대해 물어볼 수 있어요
                  </li>
                </ul>
              </div>

              {/* Ollama Status */}
              <div className="card bg-background-tertiary">
                <h3 className="text-sm font-medium mb-2">Ollama 연결 상태</h3>
                <p className="text-xs text-foreground-muted mb-3">
                  로컬 LLM을 사용하여 개인정보가 외부로 전송되지 않습니다.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
                  <span className="text-xs">데모 모드 (Ollama 미연결)</span>
                </div>
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-neon-blue hover:underline block"
                >
                  Ollama 설치하기 →
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights portfolioData={portfolioData} />

            {/* Additional Analysis */}
            <div className="space-y-4">
              {/* Sector Analysis */}
              <div className="card">
                <h3 className="font-medium mb-4">섹터 분석</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>기술</span>
                      <span className="font-mono-numbers">75%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-blue" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>자동차</span>
                      <span className="font-mono-numbers">10%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-green" style={{ width: "10%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>현금</span>
                      <span className="font-mono-numbers">15%</span>
                    </div>
                    <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-neon-yellow" style={{ width: "15%" }} />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-foreground-muted">
                  ⚠️ 기술 섹터 비중이 높습니다. 분산 투자를 고려하세요.
                </p>
              </div>

              {/* Risk Score */}
              <div className="card">
                <h3 className="font-medium mb-4">리스크 점수</h3>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-background-tertiary"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-neon-yellow"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="352"
                        strokeDashoffset="140"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">65</span>
                      <span className="text-xs text-foreground-muted">중간</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                  <div>
                    <div className="text-neon-green">낮음</div>
                    <div className="text-foreground-muted">0-40</div>
                  </div>
                  <div>
                    <div className="text-neon-yellow">중간</div>
                    <div className="text-foreground-muted">41-70</div>
                  </div>
                  <div>
                    <div className="text-neon-red">높음</div>
                    <div className="text-foreground-muted">71-100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "learn" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LEARNING_TOPICS.map((category) => (
              <div key={category.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium">{category.title}</h3>
                    <p className="text-xs text-foreground-muted">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTopic(topic)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-background-tertiary hover:bg-neon-purple/10 transition-colors text-sm flex items-center justify-between"
                    >
                      <span>{topic}</span>
                      <Sparkles className="w-3 h-3 text-foreground-muted" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Selected Topic Modal */}
            {selectedTopic && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-background-secondary rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">{selectedTopic}</h3>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="p-1 rounded hover:bg-background-tertiary"
                    >
                      ×
                    </button>
                  </div>

                  <div className="prose prose-invert prose-sm">
                    <p className="text-foreground-muted">
                      AI가 &ldquo;{selectedTopic}&rdquo;에 대해 설명해드립니다.
                    </p>
                    <p className="text-foreground-muted mt-4">
                      현재 데모 모드입니다. Ollama를 연결하면 AI가 직접 자세한 설명을 제공합니다.
                    </p>
                    <p className="text-foreground-muted mt-4">
                      AI 채팅 탭에서 &ldquo;{selectedTopic} 설명해줘&rdquo;라고 물어보세요!
                    </p>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTopic(null);
                        setActiveTab("chat");
                      }}
                      className="flex-1 btn btn-primary"
                    >
                      AI에게 물어보기
                    </button>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="btn btn-ghost"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
