/**
 * Zustand Store for Stock Portfolio Genius
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Holding, StockQuote, PortfolioSummary } from "./api";

// ============ Portfolio Store ============

interface PortfolioState {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  isLoading: boolean;
  lastUpdated: string | null;

  // Actions
  setHoldings: (holdings: Holding[]) => void;
  addHolding: (holding: Omit<Holding, "id">) => void;
  updateHolding: (id: number, data: Partial<Holding>) => void;
  removeHolding: (id: number) => void;
  setQuotes: (quotes: Record<string, StockQuote>) => void;
  updateQuote: (ticker: string, quote: StockQuote) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  getPortfolioSummary: () => PortfolioSummary;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: [],
      quotes: {},
      isLoading: false,
      lastUpdated: null,

      setHoldings: (holdings) => set({ holdings }),

      addHolding: (holding) =>
        set((state) => ({
          holdings: [
            ...state.holdings,
            { ...holding, id: Date.now() } as Holding,
          ],
        })),

      updateHolding: (id, data) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...data } : h
          ),
        })),

      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),

      setQuotes: (quotes) =>
        set({ quotes, lastUpdated: new Date().toISOString() }),

      updateQuote: (ticker, quote) =>
        set((state) => ({
          quotes: { ...state.quotes, [ticker]: quote },
          lastUpdated: new Date().toISOString(),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      getPortfolioSummary: () => {
        const { holdings, quotes } = get();

        let totalValue = 0;
        let totalCost = 0;
        let dayChange = 0;

        const enrichedHoldings: Holding[] = holdings.map((holding) => {
          const quote = quotes[holding.ticker];
          const currentPrice = quote?.price || holding.avgCost;
          const previousClose = quote?.previousClose || currentPrice;
          const marketValue = currentPrice * holding.quantity;
          const cost = holding.avgCost * holding.quantity;
          const gain = marketValue - cost;
          const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
          const dayGain = (currentPrice - previousClose) * holding.quantity;

          totalValue += marketValue;
          totalCost += cost;
          dayChange += dayGain;

          return {
            ...holding,
            currentPrice,
            marketValue,
            gain,
            gainPercent,
          };
        });

        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
        const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

        // Sector allocation
        const sectorMap = new Map<string, number>();
        enrichedHoldings.forEach((h) => {
          const sector = h.sector || "기타";
          sectorMap.set(sector, (sectorMap.get(sector) || 0) + (h.marketValue || 0));
        });

        const sectorAllocation = Array.from(sectorMap.entries())
          .map(([sector, value]) => ({
            sector,
            value,
            percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value);

        return {
          totalValue,
          totalCost,
          totalGain,
          totalGainPercent,
          dayChange,
          dayChangePercent,
          holdings: enrichedHoldings,
          sectorAllocation,
        };
      },
    }),
    {
      name: "portfolio-storage",
      partialize: (state) => ({ holdings: state.holdings }),
    }
  )
);

// ============ UI Store ============

interface UIState {
  selectedTicker: string | null;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  theme: "dark"; // Only dark mode

  // Actions
  setSelectedTicker: (ticker: string | null) => void;
  toggleSidebar: () => void;
  toggleAiPanel: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedTicker: null,
  sidebarOpen: true,
  aiPanelOpen: false,
  theme: "dark",

  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
}));

// ============ Watchlist Store ============

interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
}

interface WatchlistState {
  items: WatchlistItem[];
  addItem: (ticker: string, notes?: string) => void;
  removeItem: (ticker: string) => void;
  updateNotes: (ticker: string, notes: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (ticker, notes) =>
        set((state) => {
          if (state.items.some((i) => i.ticker === ticker)) return state;
          return {
            items: [
              ...state.items,
              { ticker: ticker.toUpperCase(), addedAt: new Date().toISOString(), notes },
            ],
          };
        }),

      removeItem: (ticker) =>
        set((state) => ({
          items: state.items.filter((i) => i.ticker !== ticker.toUpperCase()),
        })),

      updateNotes: (ticker, notes) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.ticker === ticker.toUpperCase() ? { ...i, notes } : i
          ),
        })),
    }),
    {
      name: "watchlist-storage",
    }
  )
);
