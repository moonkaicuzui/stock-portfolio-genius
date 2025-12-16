"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Bell,
  Plus,
  ExternalLink,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { StockDetailChart, generateDemoOHLCVData, type OHLCVData } from "@/components/chart";
import { cn } from "@/lib/utils";
import { TransactionForm } from "@/components/transaction";
import type { TransactionFormData } from "@/components/transaction";
import * as api from "@/lib/api";
import type { StockInfo } from "@/lib/api";

// Demo stock info for fallback
const DEMO_STOCKS: Record<string, StockInfo & {
  employees?: number;
  high52Week?: number;
  low52Week?: number;
  volume?: number;
  avgVolume?: number;
}> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: 2.1e12,
    peRatio: 65.2,
    eps: 13.48,
    dividendYield: 0.03,
    description:
      "NVIDIA Corporation provides graphics, and compute and networking solutions. It operates through two segments: Graphics and Compute & Networking.",
    currentPrice: 875.5,
    previousClose: 862.3,
    fiftyTwoWeekHigh: 974.0,
    fiftyTwoWeekLow: 222.97,
    avgVolume: 38.5e6,
    employees: 29600,
    high52Week: 974.0,
    low52Week: 222.97,
    volume: 45.2e6,
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 2.9e12,
    peRatio: 28.5,
    eps: 6.43,
    dividendYield: 0.51,
    description:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    currentPrice: 192.5,
    previousClose: 189.8,
    fiftyTwoWeekHigh: 199.62,
    fiftyTwoWeekLow: 164.08,
    avgVolume: 52.1e6,
    employees: 164000,
    high52Week: 199.62,
    low52Week: 164.08,
    volume: 58.3e6,
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCap: 785e9,
    peRatio: 72.3,
    eps: 3.12,
    dividendYield: 0,
    description:
      "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
    currentPrice: 245.0,
    previousClose: 252.3,
    fiftyTwoWeekHigh: 299.29,
    fiftyTwoWeekLow: 138.8,
    avgVolume: 98.7e6,
    employees: 140000,
    high52Week: 299.29,
    low52Week: 138.8,
    volume: 112.5e6,
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software - Infrastructure",
    marketCap: 3.1e12,
    peRatio: 35.8,
    eps: 11.86,
    dividendYield: 0.72,
    description:
      "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    currentPrice: 425.0,
    previousClose: 420.5,
    fiftyTwoWeekHigh: 430.82,
    fiftyTwoWeekLow: 309.45,
    avgVolume: 19.8e6,
    employees: 221000,
    high52Week: 430.82,
    low52Week: 309.45,
    volume: 22.1e6,
  },
  GOOGL: {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet Content & Information",
    marketCap: 2.1e12,
    peRatio: 25.5,
    eps: 6.52,
    dividendYield: 0,
    description:
      "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, and internationally.",
    currentPrice: 175.0,
    previousClose: 172.3,
    fiftyTwoWeekHigh: 180.0,
    fiftyTwoWeekLow: 115.83,
    avgVolume: 25.6e6,
    employees: 182000,
    high52Week: 180.0,
    low52Week: 115.83,
    volume: 28.3e6,
  },
};

export default function StockDetailPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase() || "NVDA";
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Real data states
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [quote, setQuote] = useState<api.StockQuote | null>(null);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);

  // Fetch stock info
  const fetchStockInfo = useCallback(async () => {
    try {
      const info = await api.getStockInfo(ticker);
      setStockInfo(info);
      setBackendAvailable(true);
      return info;
    } catch (err) {
      console.warn("Failed to fetch stock info, using demo data");
      setBackendAvailable(false);
      const demoInfo = DEMO_STOCKS[ticker] || DEMO_STOCKS.NVDA;
      setStockInfo(demoInfo);
      return demoInfo;
    }
  }, [ticker]);

  // Fetch real-time quote
  const fetchQuote = useCallback(async () => {
    try {
      const quoteData = await api.getStockQuote(ticker);
      setQuote(quoteData);
      return quoteData;
    } catch (err) {
      console.warn("Failed to fetch quote");
      return null;
    }
  }, [ticker]);

  // Fetch historical data for chart
  const fetchHistoricalData = useCallback(async () => {
    try {
      const history = await api.getHistoricalData(ticker, "6mo", "1d");
      if (history.data && history.data.length > 0) {
        // Convert API OHLCV to chart OHLCVData format
        const chartFormatData: OHLCVData[] = history.data.map((d) => ({
          time: d.timestamp.split("T")[0] as `${number}-${number}-${number}`,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));
        setChartData(chartFormatData);
        return chartFormatData;
      }
    } catch (err) {
      console.warn("Failed to fetch historical data, using demo data");
    }
    // Use demo data as fallback
    const demoInfo = DEMO_STOCKS[ticker] || DEMO_STOCKS.NVDA;
    const demoData = generateDemoOHLCVData(180, demoInfo.currentPrice || 100);
    setChartData(demoData);
    return demoData;
  }, [ticker]);

  // Full refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([fetchStockInfo(), fetchQuote(), fetchHistoricalData()]);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStockInfo, fetchQuote, fetchHistoricalData]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([fetchStockInfo(), fetchQuote(), fetchHistoricalData()])
      .catch(() => setError("데이터를 불러오는데 실패했습니다."))
      .finally(() => setIsLoading(false));
  }, [fetchStockInfo, fetchQuote, fetchHistoricalData]);

  // Auto-refresh quote every 60 seconds
  useEffect(() => {
    if (!backendAvailable) return;
    const interval = setInterval(fetchQuote, 60000);
    return () => clearInterval(interval);
  }, [backendAvailable, fetchQuote]);

  // Merged display data
  const displayInfo = useMemo(() => {
    const baseInfo = stockInfo || DEMO_STOCKS[ticker] || DEMO_STOCKS.NVDA;
    return {
      ...baseInfo,
      currentPrice: quote?.price || baseInfo.currentPrice || 0,
      previousClose: quote?.previousClose || baseInfo.previousClose || 0,
      change: quote?.change || (baseInfo.change ?? 0),
      changePercent: quote?.changePercent || (baseInfo.changePercent ?? 0),
      volume: quote?.volume || baseInfo.avgVolume || 0,
      high52Week: baseInfo.fiftyTwoWeekHigh || 0,
      low52Week: baseInfo.fiftyTwoWeekLow || 0,
    };
  }, [stockInfo, quote, ticker]);

  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      if (backendAvailable) {
        await api.createTransaction({
          type: data.type,
          ticker: data.ticker,
          quantity: data.quantity,
          price: data.price,
          date: data.date,
          fees: data.fees,
          notes: data.notes,
        });
      }
      setShowTransactionForm(false);
      alert("거래가 성공적으로 기록되었습니다.");
    } catch (err) {
      console.error("Failed to create transaction:", err);
      alert("거래 기록에 실패했습니다. 백엔드 서버를 확인해주세요.");
    }
  };

  // Related stocks (from demo or could be enhanced with API)
  const relatedStocks = useMemo(() => {
    return Object.entries(DEMO_STOCKS)
      .filter(([t]) => t !== ticker)
      .slice(0, 3);
  }, [ticker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-neon-blue mx-auto mb-3" />
          <p className="text-foreground-muted">주식 정보 로딩 중...</p>
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
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-mono">{ticker}</h1>
                  <span className="text-sm text-foreground-muted">
                    {displayInfo.name}
                  </span>
                  {!backendAvailable && (
                    <span className="text-xs text-neon-yellow">(데모 모드)</span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted">
                  {displayInfo.sector} · {displayInfo.industry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
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
              <button
                onClick={() => setIsWatchlisted(!isWatchlisted)}
                className={cn(
                  "btn btn-ghost",
                  isWatchlisted && "text-neon-yellow"
                )}
                title="관심종목"
              >
                <Star
                  className={cn("w-4 h-4", isWatchlisted && "fill-current")}
                />
              </button>
              <button className="btn btn-ghost" title="알림 설정">
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                거래 추가
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section (2/3 width) */}
          <div className="lg:col-span-2">
            <StockDetailChart
              ticker={ticker}
              data={chartData}
              currentPrice={displayInfo.currentPrice}
              previousClose={displayInfo.previousClose}
              high52Week={displayInfo.high52Week}
              low52Week={displayInfo.low52Week}
              volume={displayInfo.volume}
              avgVolume={displayInfo.avgVolume || displayInfo.volume}
            />
          </div>

          {/* Info Sidebar (1/3 width) */}
          <div className="space-y-4">
            {/* Key Stats */}
            <div className="card">
              <h3 className="text-lg font-medium mb-4">주요 지표</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-muted flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    시가총액
                  </span>
                  <span className="font-mono-numbers">
                    {displayInfo.marketCap
                      ? `$${(displayInfo.marketCap / 1e12).toFixed(2)}T`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    P/E Ratio
                  </span>
                  <span className="font-mono-numbers">
                    {displayInfo.peRatio?.toFixed(1) || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    EPS
                  </span>
                  <span className="font-mono-numbers">
                    {displayInfo.eps ? `$${displayInfo.eps.toFixed(2)}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    배당수익률
                  </span>
                  <span className="font-mono-numbers">
                    {displayInfo.dividendYield?.toFixed(2) || "0"}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    52주 최고
                  </span>
                  <span className="font-mono-numbers">
                    ${displayInfo.high52Week?.toFixed(2) || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">
                    52주 최저
                  </span>
                  <span className="font-mono-numbers">
                    ${displayInfo.low52Week?.toFixed(2) || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="card">
              <h3 className="text-lg font-medium mb-3">회사 소개</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {displayInfo.description || "회사 정보를 불러오는 중입니다..."}
              </p>
              <button className="mt-3 text-sm text-neon-blue flex items-center gap-1 hover:underline">
                더 보기
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium mb-4">빠른 액션</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="btn btn-success w-full"
                >
                  매수하기
                </button>
                <button className="btn btn-danger w-full">매도하기</button>
                <button
                  onClick={() => setIsWatchlisted(!isWatchlisted)}
                  className="btn btn-ghost w-full"
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      isWatchlisted && "fill-neon-yellow text-neon-yellow"
                    )}
                  />
                  {isWatchlisted ? "관심종목에서 제거" : "관심종목에 추가"}
                </button>
              </div>
            </div>

            {/* Related Stocks */}
            <div className="card">
              <h3 className="text-lg font-medium mb-3">관련 종목</h3>
              <div className="space-y-2">
                {relatedStocks.map(([t, info]) => {
                  const change =
                    ((info.currentPrice || 0) - (info.previousClose || 0)) /
                    (info.previousClose || 1) * 100;
                  return (
                    <Link
                      key={t}
                      href={`/stock/${t}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-card-hover transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold">{t}</span>
                        <span className="text-xs text-foreground-muted ml-2">
                          {info.name?.split(" ")[0]}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-numbers text-sm">
                          ${(info.currentPrice || 0).toFixed(2)}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-mono-numbers",
                            change >= 0 ? "text-neon-green" : "text-neon-red"
                          )}
                        >
                          {change >= 0 ? "+" : ""}
                          {change.toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          onSubmit={handleTransactionSubmit}
          onCancel={() => setShowTransactionForm(false)}
          initialData={{ ticker, price: displayInfo.currentPrice }}
        />
      )}
    </div>
  );
}
