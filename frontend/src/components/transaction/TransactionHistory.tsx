"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Filter,
  Search,
  Trash2,
  Edit2,
  ChevronDown,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export interface Transaction {
  id: number;
  type: "buy" | "sell";
  ticker: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  date: string;
  notes?: string;
  createdAt: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

type FilterType = "all" | "buy" | "sell";
type SortKey = "date" | "ticker" | "amount";

export function TransactionHistory({
  transactions,
  onEdit,
  onDelete,
  className,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.ticker
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" || t.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "ticker":
          comparison = a.ticker.localeCompare(b.ticker);
          break;
        case "amount":
          comparison = a.totalAmount - b.totalAmount;
          break;
      }
      return sortDesc ? -comparison : comparison;
    });

  // Calculate summary stats
  const stats = {
    totalBuy: transactions
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + t.totalAmount, 0),
    totalSell: transactions
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + t.totalAmount, 0),
    totalFees: transactions.reduce((sum, t) => sum + t.fees, 0),
    count: transactions.length,
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className={cn("card", className)}>
        <h3 className="text-lg font-medium mb-4">거래 내역</h3>
        <div className="text-center py-12 text-foreground-muted">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>거래 내역이 없습니다</p>
          <p className="text-sm mt-1">첫 거래를 기록해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card p-0 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">거래 내역</h3>
          <span className="text-sm text-foreground-muted">
            총 {stats.count}건
          </span>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 bg-neon-green-muted/30 rounded-lg">
            <p className="text-xs text-foreground-muted">총 매수</p>
            <p className="font-mono-numbers font-medium text-neon-green">
              {formatCurrency(stats.totalBuy)}
            </p>
          </div>
          <div className="p-2 bg-neon-red-muted/30 rounded-lg">
            <p className="text-xs text-foreground-muted">총 매도</p>
            <p className="font-mono-numbers font-medium text-neon-red">
              {formatCurrency(stats.totalSell)}
            </p>
          </div>
          <div className="p-2 bg-background-secondary rounded-lg">
            <p className="text-xs text-foreground-muted">총 수수료</p>
            <p className="font-mono-numbers font-medium">
              {formatCurrency(stats.totalFees)}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="종목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex gap-1 p-1 bg-background-secondary rounded-lg">
            {(["all", "buy", "sell"] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  filterType === filter
                    ? filter === "buy"
                      ? "bg-neon-green text-black"
                      : filter === "sell"
                      ? "bg-neon-red text-white"
                      : "bg-neon-blue text-black"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                {filter === "all" ? "전체" : filter === "buy" ? "매수" : "매도"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-background-secondary text-xs font-medium text-foreground-muted border-b border-border">
        <div className="col-span-1"></div>
        <button
          className="col-span-3 text-left flex items-center gap-1 hover:text-foreground"
          onClick={() => handleSort("ticker")}
        >
          종목
          {sortKey === "ticker" && (
            <ChevronDown
              className={cn("w-3 h-3", !sortDesc && "rotate-180")}
            />
          )}
        </button>
        <div className="col-span-2 text-right">수량</div>
        <div className="col-span-2 text-right">단가</div>
        <button
          className="col-span-2 text-right flex items-center justify-end gap-1 hover:text-foreground"
          onClick={() => handleSort("amount")}
        >
          금액
          {sortKey === "amount" && (
            <ChevronDown
              className={cn("w-3 h-3", !sortDesc && "rotate-180")}
            />
          )}
        </button>
        <button
          className="col-span-2 text-right flex items-center justify-end gap-1 hover:text-foreground"
          onClick={() => handleSort("date")}
        >
          날짜
          {sortKey === "date" && (
            <ChevronDown
              className={cn("w-3 h-3", !sortDesc && "rotate-180")}
            />
          )}
        </button>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id}>
            {/* Main Row */}
            <div
              className={cn(
                "grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer",
                "hover:bg-card-hover transition-colors",
                expandedId === transaction.id && "bg-card-hover"
              )}
              onClick={() =>
                setExpandedId(
                  expandedId === transaction.id ? null : transaction.id
                )
              }
            >
              <div className="col-span-1">
                {transaction.type === "buy" ? (
                  <ArrowDownCircle className="w-5 h-5 text-neon-green" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 text-neon-red" />
                )}
              </div>
              <div className="col-span-3">
                <span className="font-mono font-bold">{transaction.ticker}</span>
                <span
                  className={cn(
                    "ml-2 text-xs px-1.5 py-0.5 rounded",
                    transaction.type === "buy"
                      ? "bg-neon-green-muted text-neon-green"
                      : "bg-neon-red-muted text-neon-red"
                  )}
                >
                  {transaction.type === "buy" ? "매수" : "매도"}
                </span>
              </div>
              <div className="col-span-2 text-right font-mono-numbers text-sm">
                {transaction.quantity}주
              </div>
              <div className="col-span-2 text-right font-mono-numbers text-sm">
                ${transaction.price.toFixed(2)}
              </div>
              <div
                className={cn(
                  "col-span-2 text-right font-mono-numbers font-medium",
                  transaction.type === "buy"
                    ? "text-neon-red"
                    : "text-neon-green"
                )}
              >
                {transaction.type === "buy" ? "-" : "+"}
                {formatCurrency(transaction.totalAmount)}
              </div>
              <div className="col-span-2 text-right text-sm text-foreground-muted">
                {new Date(transaction.date).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === transaction.id && (
              <div className="px-4 py-3 bg-background-secondary border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">거래일시:</span>
                    <span className="ml-2">
                      {new Date(transaction.date).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">수수료:</span>
                    <span className="ml-2 font-mono-numbers">
                      ${transaction.fees.toFixed(2)}
                    </span>
                  </div>
                  {transaction.notes && (
                    <div className="col-span-2">
                      <span className="text-foreground-muted">메모:</span>
                      <span className="ml-2">{transaction.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(transaction);
                      }}
                      className="btn btn-ghost text-xs py-1.5"
                    >
                      <Edit2 className="w-3 h-3" />
                      수정
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("이 거래 기록을 삭제하시겠습니까?")) {
                          onDelete(transaction.id);
                        }
                      }}
                      className="btn btn-ghost text-xs py-1.5 text-neon-red hover:bg-neon-red-muted"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State for Filtered */}
      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="text-center py-8 text-foreground-muted">
          <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}

// Demo data for development
export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    type: "buy",
    ticker: "NVDA",
    quantity: 30,
    price: 420.5,
    totalAmount: 12615.0,
    fees: 0,
    date: "2024-01-15",
    notes: "AI 붐 시작, 첫 진입",
    createdAt: "2024-01-15T09:30:00Z",
  },
  {
    id: 2,
    type: "buy",
    ticker: "NVDA",
    quantity: 20,
    price: 495.0,
    totalAmount: 9900.0,
    fees: 0,
    date: "2024-03-20",
    notes: "추가 매수",
    createdAt: "2024-03-20T10:00:00Z",
  },
  {
    id: 3,
    type: "buy",
    ticker: "AAPL",
    quantity: 50,
    price: 168.0,
    totalAmount: 8400.0,
    fees: 0,
    date: "2024-02-10",
    createdAt: "2024-02-10T11:00:00Z",
  },
  {
    id: 4,
    type: "buy",
    ticker: "AAPL",
    quantity: 50,
    price: 162.0,
    totalAmount: 8100.0,
    fees: 0,
    date: "2024-04-05",
    notes: "실적 발표 전 추매",
    createdAt: "2024-04-05T09:45:00Z",
  },
  {
    id: 5,
    type: "sell",
    ticker: "TSLA",
    quantity: 20,
    price: 310.0,
    totalAmount: 6200.0,
    fees: 0,
    date: "2024-05-15",
    notes: "일부 익절",
    createdAt: "2024-05-15T14:30:00Z",
  },
  {
    id: 6,
    type: "buy",
    ticker: "MSFT",
    quantity: 30,
    price: 380.0,
    totalAmount: 11400.0,
    fees: 0,
    date: "2024-03-01",
    createdAt: "2024-03-01T10:15:00Z",
  },
  {
    id: 7,
    type: "buy",
    ticker: "MARA",
    quantity: 200,
    price: 18.0,
    totalAmount: 3600.0,
    fees: 0,
    date: "2024-06-01",
    notes: "BTC 상승 베팅",
    createdAt: "2024-06-01T09:30:00Z",
  },
];
