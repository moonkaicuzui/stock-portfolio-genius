"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  PieChart,
  Calendar,
  RefreshCw,
  Plus,
  Settings,
  History,
  Bot,
  Wrench,
  Brain,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  StatsCard,
  HoldingsTable,
  SectorChart,
  PortfolioChart,
  AISuggestions,
  DEMO_SUGGESTIONS,
} from "@/components/dashboard";
import { TransactionForm } from "@/components/transaction";
import type { TransactionFormData } from "@/components/transaction";
import { usePortfolioStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/lib/api";
import type { Holding, Transaction } from "@/lib/api";

// Demo data for when backend is not available
const DEMO_HOLDINGS: Holding[] = [
  {
    id: 1,
    ticker: "NVDA",
    quantity: 50,
    avgCost: 450.0,
    currentPrice: 875.5,
    marketValue: 43775.0,
    gain: 21275.0,
    gainPercent: 94.44,
    sector: "반도체",
  },
  {
    id: 2,
    ticker: "AAPL",
    quantity: 100,
    avgCost: 165.0,
    currentPrice: 192.5,
    marketValue: 19250.0,
    gain: 2750.0,
    gainPercent: 16.67,
    sector: "소프트웨어",
  },
  {
    id: 3,
    ticker: "MSFT",
    quantity: 30,
    avgCost: 380.0,
    currentPrice: 425.0,
    marketValue: 12750.0,
    gain: 1350.0,
    gainPercent: 11.84,
    sector: "클라우드",
  },
  {
    id: 4,
    ticker: "GOOGL",
    quantity: 25,
    avgCost: 140.0,
    currentPrice: 175.0,
    marketValue: 4375.0,
    gain: 875.0,
    gainPercent: 25.0,
    sector: "검색/광고",
  },
  {
    id: 5,
    ticker: "TSLA",
    quantity: 40,
    avgCost: 280.0,
    currentPrice: 245.0,
    marketValue: 9800.0,
    gain: -1400.0,
    gainPercent: -12.5,
    sector: "전기차",
  },
];

export default function Dashboard() {
  const { holdings, setHoldings, quotes, setQuotes, lastUpdated, setLoading } = usePortfolioStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);

  // Fetch holdings from backend
  const fetchHoldings = useCallback(async () => {
    try {
      const data = await api.getHoldings();
      setHoldings(data);
      setBackendAvailable(true);
      return data;
    } catch (err) {
      console.warn("Backend not available, using demo data");
      setBackendAvailable(false);
      return [];
    }
  }, [setHoldings]);

  // Fetch real-time quotes for holdings
  const fetchQuotes = useCallback(async (holdingsData: Holding[]) => {
    if (holdingsData.length === 0) return;

    const tickers = holdingsData.map((h) => h.ticker);

    try {
      const response = await api.getBatchQuotes(tickers);
      const quotesMap: Record<string, api.StockQuote> = {};

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
    } catch (err) {
      console.warn("Failed to fetch quotes");
    }
  }, [setQuotes]);

  // Full data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const holdingsData = await fetchHoldings();
      if (holdingsData.length > 0) {
        await fetchQuotes(holdingsData);
      }
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchHoldings, fetchQuotes]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh quotes every 60 seconds
  useEffect(() => {
    if (holdings.length === 0 || !backendAvailable) return;

    const interval = setInterval(() => {
      fetchQuotes(holdings);
    }, 60000);

    return () => clearInterval(interval);
  }, [holdings, backendAvailable, fetchQuotes]);

  // Determine which holdings to display
  const displayHoldings = useMemo(() => {
    if (holdings.length === 0 && !backendAvailable) {
      return DEMO_HOLDINGS;
    }

    // Enrich holdings with current prices from quotes
    return holdings.map((h) => {
      const quote = quotes[h.ticker];
      const currentPrice = quote?.price || h.currentPrice || h.avgCost;
      const marketValue = currentPrice * h.quantity;
      const cost = h.avgCost * h.quantity;
      const gain = marketValue - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

      return {
        ...h,
        currentPrice,
        marketValue,
        gain,
        gainPercent,
      };
    });
  }, [holdings, quotes, backendAvailable]);

  // Calculate portfolio stats
  const stats = useMemo(() => {
    const totalValue = displayHoldings.reduce(
      (sum, h) => sum + (h.marketValue || 0),
      0
    );
    const totalCost = displayHoldings.reduce(
      (sum, h) => sum + h.avgCost * h.quantity,
      0
    );
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Calculate today's change from quotes
    let todayChange = 0;
    displayHoldings.forEach((h) => {
      const quote = quotes[h.ticker];
      if (quote) {
        todayChange += (quote.change || 0) * h.quantity;
      }
    });
    const todayChangePercent = totalValue > 0 ? (todayChange / totalValue) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      todayChange,
      todayChangePercent,
      holdingCount: displayHoldings.length,
    };
  }, [displayHoldings, quotes]);

  // Calculate sector data from holdings
  const sectorData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    const totalValue = stats.totalValue;

    displayHoldings.forEach((h) => {
      const sector = h.sector || "기타";
      const value = h.marketValue || 0;
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [displayHoldings, stats.totalValue]);

  // Generate chart data
  const portfolioChartData = useMemo(() => {
    if (chartData.length > 0) return chartData;

    // Generate demo chart data based on current value
    const now = Date.now();
    return Array.from({ length: 90 }, (_, i) => {
      const date = new Date(now - (90 - i) * 86400000);
      const baseValue = stats.totalValue * 0.85;
      const trend = (stats.totalValue * 0.15 * i) / 90;
      const noise = (Math.random() - 0.5) * stats.totalValue * 0.05;
      return {
        date: date.toISOString().split("T")[0],
        value: baseValue + trend + noise,
      };
    });
  }, [chartData, stats.totalValue]);

  const handleRefresh = () => {
    refreshData();
  };

  const handleAddTransaction = () => {
    setShowTransactionForm(true);
  };

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      await api.createTransaction({
        type: data.type,
        ticker: data.ticker,
        quantity: data.quantity,
        price: data.price,
        date: data.date,
        fees: data.fees,
        notes: data.notes,
      });
      setShowTransactionForm(false);
      await refreshData();
    } catch (err) {
      console.error("Failed to create transaction:", err);
      alert("거래 기록에 실패했습니다. 백엔드 서버를 확인해주세요.");
    }
  };

  const handleViewTicker = (ticker: string) => {
    window.location.href = `/stock/${ticker}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple-muted flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Stock Portfolio Genius</h1>
                <p className="text-xs text-foreground-muted">
                  AI 기반 포트폴리오 관리
                  {!backendAvailable && (
                    <span className="ml-2 text-neon-yellow">(데모 모드)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="btn btn-ghost"
                title="새로고침"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              <Link href="/transactions" className="btn btn-ghost" title="거래 내역">
                <History className="w-4 h-4" />
              </Link>
              <Link href="/ai-advisor" className="btn btn-ghost" title="AI 투자 비서">
                <Bot className="w-4 h-4" />
              </Link>
              <Link href="/tools" className="btn btn-ghost" title="분석 도구">
                <Wrench className="w-4 h-4" />
              </Link>
              <Link href="/learning" className="btn btn-ghost" title="학습 & 예측">
                <Brain className="w-4 h-4" />
              </Link>
              <button
                onClick={handleAddTransaction}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                거래 추가
              </button>
              <button className="btn btn-ghost" title="설정">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center gap-2 text-sm text-neon-red">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mb-4 text-xs text-foreground-muted flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            마지막 업데이트: {new Date(lastUpdated).toLocaleString("ko-KR")}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="총 자산"
            value={formatCurrency(stats.totalValue)}
            change={stats.totalGainPercent}
            changeLabel="총 수익률"
            icon={<Wallet className="w-5 h-5 text-neon-blue" />}
            glowColor={stats.totalGain >= 0 ? "green" : "red"}
          />
          <StatsCard
            title="오늘 수익"
            value={formatCurrency(stats.todayChange)}
            change={stats.todayChangePercent}
            changeLabel="일일 변동"
            icon={<TrendingUp className="w-5 h-5 text-neon-green" />}
            glowColor={stats.todayChange >= 0 ? "green" : "red"}
          />
          <StatsCard
            title="총 수익금"
            value={formatCurrency(stats.totalGain)}
            subValue={`원금 ${formatCurrency(stats.totalCost)}`}
            change={stats.totalGainPercent}
            glowColor={stats.totalGain >= 0 ? "green" : "red"}
          />
          <StatsCard
            title="보유 종목"
            value={`${stats.holdingCount}개`}
            subValue="미국 주식"
            icon={<PieChart className="w-5 h-5 text-neon-purple" />}
            glowColor="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <PortfolioChart
              data={portfolioChartData}
              currentValue={stats.totalValue}
            />
          </div>
          <div>
            <SectorChart data={sectorData} />
          </div>
        </div>

        {/* Holdings and AI Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HoldingsTable
              holdings={displayHoldings}
              onSelectTicker={handleViewTicker}
              limit={5}
            />
          </div>
          <div>
            <AISuggestions
              suggestions={DEMO_SUGGESTIONS}
              advisorLevel={2}
              advisorName="포트폴리오 분석 및 제안"
              onViewDetail={(suggestion) => {
                console.log("View suggestion:", suggestion);
              }}
            />
          </div>
        </div>

        {/* Market Status Footer */}
        <div className="mt-6 p-4 rounded-lg bg-background-secondary border border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${backendAvailable ? "bg-neon-green animate-pulse" : "bg-neon-yellow"}`} />
                <span className="text-foreground-muted">시장 상태:</span>
                <span className={backendAvailable ? "text-neon-green font-medium" : "text-neon-yellow font-medium"}>
                  {backendAvailable ? "정규장 운영중" : "데모 모드"}
                </span>
              </div>
              <div className="text-foreground-muted">
                NYSE / NASDAQ
              </div>
            </div>
            <div className="text-foreground-muted">
              데이터 제공: Yahoo Finance
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          onSubmit={handleTransactionSubmit}
          onCancel={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
}
