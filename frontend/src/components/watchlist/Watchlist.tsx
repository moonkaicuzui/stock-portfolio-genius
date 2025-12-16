"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Bell,
  Search,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  alertPrice?: number;
  notes?: string;
  addedAt: Date;
}

interface WatchlistProps {
  items?: WatchlistItem[];
  onAddItem?: (ticker: string) => void;
  onRemoveItem?: (ticker: string) => void;
  onSetAlert?: (ticker: string, price: number) => void;
  className?: string;
}

// Demo data
const DEMO_WATCHLIST: WatchlistItem[] = [
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    currentPrice: 178.5,
    change: 5.2,
    changePercent: 3.0,
    alertPrice: 170,
    addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    ticker: "SMCI",
    name: "Super Micro Computer",
    currentPrice: 925.0,
    change: -15.3,
    changePercent: -1.63,
    addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    currentPrice: 24.8,
    change: 0.45,
    changePercent: 1.85,
    alertPrice: 22,
    notes: "AI & 데이터 분석",
    addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    ticker: "COIN",
    name: "Coinbase Global",
    currentPrice: 235.0,
    change: 12.5,
    changePercent: 5.62,
    notes: "BTC 연동",
    addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    ticker: "SOFI",
    name: "SoFi Technologies",
    currentPrice: 8.45,
    change: -0.12,
    changePercent: -1.4,
    alertPrice: 7.5,
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

export function Watchlist({
  items = DEMO_WATCHLIST,
  onAddItem,
  onRemoveItem,
  className,
}: WatchlistProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTicker, setSearchTicker] = useState("");

  const handleAddTicker = () => {
    if (searchTicker.trim() && onAddItem) {
      onAddItem(searchTicker.toUpperCase());
      setSearchTicker("");
      setShowAddForm(false);
    }
  };

  const sortedItems = [...items].sort((a, b) => b.changePercent - a.changePercent);

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-neon-yellow" />
          <h3 className="font-medium">관심 종목</h3>
          <span className="text-xs text-foreground-muted">({items.length})</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-ghost text-xs"
        >
          <Plus className="w-3 h-3" />
          추가
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-3 rounded-lg bg-background-tertiary">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                placeholder="티커 입력 (예: AAPL)"
                className="w-full bg-background-secondary rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
              />
            </div>
            <button onClick={handleAddTicker} className="btn btn-primary text-sm">
              추가
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn btn-ghost text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Watchlist Items */}
      <div className="space-y-2">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">관심 종목이 없습니다</p>
            <p className="text-xs">+ 버튼을 눌러 추가하세요</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <Link
              key={item.ticker}
              href={`/stock/${item.ticker}`}
              className={cn(
                "block p-3 rounded-lg border border-border",
                "hover:border-border-hover hover:bg-card-hover transition-all",
                "group"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{item.ticker}</span>
                    {item.alertPrice && (
                      <span title={`알림: $${item.alertPrice}`}>
                        <Bell className="w-3 h-3 text-neon-yellow" />
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                        {item.notes}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-muted truncate">{item.name}</p>
                </div>

                <div className="text-right">
                  <div className="font-mono-numbers font-medium">
                    ${item.currentPrice.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-xs font-mono-numbers",
                      item.change >= 0 ? "text-neon-green" : "text-neon-red"
                    )}
                  >
                    {item.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {item.change >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRemoveItem) onRemoveItem(item.ticker);
                  }}
                  className="ml-2 p-1 rounded hover:bg-background-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>

              {/* Alert Status */}
              {item.alertPrice && (
                <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 text-xs">
                  <AlertCircle className="w-3 h-3 text-neon-yellow" />
                  <span className="text-foreground-muted">
                    알림 설정: ${item.alertPrice}
                    {item.currentPrice <= item.alertPrice ? (
                      <span className="ml-2 text-neon-green">● 도달</span>
                    ) : (
                      <span className="ml-2 text-foreground-muted">
                        ({((item.alertPrice / item.currentPrice - 1) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-neon-green font-medium">
              {items.filter((i) => i.change >= 0).length}
            </div>
            <div className="text-foreground-muted">상승</div>
          </div>
          <div>
            <div className="text-neon-red font-medium">
              {items.filter((i) => i.change < 0).length}
            </div>
            <div className="text-foreground-muted">하락</div>
          </div>
          <div>
            <div className="text-neon-yellow font-medium">
              {items.filter((i) => i.alertPrice).length}
            </div>
            <div className="text-foreground-muted">알림</div>
          </div>
        </div>
      )}
    </div>
  );
}
