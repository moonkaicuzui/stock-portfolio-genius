"use client";

import { useEffect, useCallback, useState } from "react";
import { usePortfolioStore } from "../store";
import * as api from "../api";
import type { Holding, StockQuote } from "../api";

interface UsePortfolioDataReturn {
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
  addTransaction: (data: api.TransactionCreate) => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataReturn {
  const { holdings, setHoldings, setQuotes, isLoading, setLoading } = usePortfolioStore();
  const [error, setError] = useState<string | null>(null);

  // Fetch holdings from backend
  const fetchHoldings = useCallback(async () => {
    try {
      const data = await api.getHoldings();
      setHoldings(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch holdings:", err);
      // Return empty array if backend not available
      return [];
    }
  }, [setHoldings]);

  // Fetch quotes for all holdings
  const fetchQuotes = useCallback(async (holdingsData: Holding[]) => {
    if (holdingsData.length === 0) return;

    const tickers = holdingsData.map((h) => h.ticker);

    try {
      const quotesData = await api.getBatchQuotes(tickers);

      // Convert to our format
      const quotesMap: Record<string, StockQuote> = {};
      for (const [ticker, data] of Object.entries(quotesData.quotes)) {
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
      console.error("Failed to fetch quotes:", err);
    }
  }, [setQuotes]);

  // Full refresh
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const holdingsData = await fetchHoldings();
      await fetchQuotes(holdingsData);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      console.error("Failed to refresh data:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchHoldings, fetchQuotes, setLoading]);

  // Refresh only quotes
  const refreshQuotes = useCallback(async () => {
    await fetchQuotes(holdings);
  }, [fetchQuotes, holdings]);

  // Add transaction
  const addTransaction = useCallback(async (data: api.TransactionCreate) => {
    try {
      await api.createTransaction(data);
      await refreshData();
    } catch (err) {
      console.error("Failed to add transaction:", err);
      throw err;
    }
  }, [refreshData]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh quotes every 60 seconds
  useEffect(() => {
    if (holdings.length === 0) return;

    const interval = setInterval(() => {
      refreshQuotes();
    }, 60000);

    return () => clearInterval(interval);
  }, [holdings.length, refreshQuotes]);

  return {
    holdings,
    isLoading,
    error,
    refreshData,
    refreshQuotes,
    addTransaction,
  };
}
