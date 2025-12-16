"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Edit3,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  date: Date;
  ticker: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  reason: string;
  emotion: "confident" | "nervous" | "neutral" | "fomo" | "fearful";
  outcome?: "profit" | "loss" | "pending";
  outcomePercent?: number;
  lessons?: string;
  tags: string[];
}

interface TradingJournalProps {
  entries?: JournalEntry[];
  onAddEntry?: (entry: Omit<JournalEntry, "id">) => void;
  onEditEntry?: (id: string, entry: Partial<JournalEntry>) => void;
  onDeleteEntry?: (id: string) => void;
  className?: string;
}

const EMOTION_CONFIG = {
  confident: { label: "확신", emoji: "😎", color: "text-neon-green bg-neon-green/20" },
  nervous: { label: "긴장", emoji: "😰", color: "text-neon-yellow bg-neon-yellow/20" },
  neutral: { label: "중립", emoji: "😐", color: "text-foreground-muted bg-background-tertiary" },
  fomo: { label: "FOMO", emoji: "😱", color: "text-neon-red bg-neon-red/20" },
  fearful: { label: "두려움", emoji: "😨", color: "text-neon-red bg-neon-red/20" },
};

// Demo data
const DEMO_ENTRIES: JournalEntry[] = [
  {
    id: "1",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    ticker: "NVDA",
    type: "buy",
    quantity: 10,
    price: 850.0,
    reason: "AI 반도체 수요 증가 전망. 실적 발표 전 매수.",
    emotion: "confident",
    outcome: "profit",
    outcomePercent: 3.0,
    lessons: "실적 발표 전 매수 전략이 효과적이었음",
    tags: ["반도체", "AI", "실적발표"],
  },
  {
    id: "2",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    ticker: "TSLA",
    type: "sell",
    quantity: 20,
    price: 260.0,
    reason: "목표가 도달. 단기 차익 실현.",
    emotion: "neutral",
    outcome: "profit",
    outcomePercent: 8.5,
    lessons: "목표가 설정이 중요. 욕심 부리지 않기.",
    tags: ["전기차", "차익실현"],
  },
  {
    id: "3",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ticker: "MARA",
    type: "buy",
    quantity: 100,
    price: 20.0,
    reason: "BTC 상승 기대감. 반감기 이후 상승 전망.",
    emotion: "fomo",
    outcome: "profit",
    outcomePercent: 12.5,
    lessons: "FOMO 매수였지만 결과적으로 성공. 하지만 리스크 관리 필요.",
    tags: ["크립토", "BTC", "마이닝"],
  },
  {
    id: "4",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    ticker: "SOXL",
    type: "buy",
    quantity: 50,
    price: 30.0,
    reason: "반도체 섹터 상승 베팅. 단기 트레이딩.",
    emotion: "nervous",
    outcome: "profit",
    outcomePercent: 8.3,
    lessons: "레버리지 ETF는 단기만. 장기 보유 시 decay 위험.",
    tags: ["레버리지", "반도체", "단기"],
  },
  {
    id: "5",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    ticker: "AAPL",
    type: "buy",
    quantity: 30,
    price: 185.0,
    reason: "iPhone 신제품 출시 앞두고 매수",
    emotion: "confident",
    outcome: "profit",
    outcomePercent: 4.0,
    lessons: "제품 출시 이벤트는 예측 가능한 촉매",
    tags: ["테크", "이벤트"],
  },
];

export function TradingJournal({
  entries = DEMO_ENTRIES,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  className,
}: TradingJournalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesSearch =
      searchTerm === "" ||
      entry.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const stats = {
    total: entries.length,
    wins: entries.filter((e) => e.outcome === "profit").length,
    losses: entries.filter((e) => e.outcome === "loss").length,
    pending: entries.filter((e) => e.outcome === "pending" || !e.outcome).length,
    winRate: entries.length > 0
      ? (entries.filter((e) => e.outcome === "profit").length /
          entries.filter((e) => e.outcome !== "pending" && e.outcome).length) *
        100
      : 0,
  };

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neon-purple" />
          <div>
            <h3 className="font-medium">매매 일지</h3>
            <p className="text-xs text-foreground-muted">거래 기록 및 회고</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary text-xs"
        >
          <Plus className="w-3 h-3" />
          기록 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-background-tertiary text-center">
          <div className="text-lg font-bold">{stats.total}</div>
          <div className="text-[10px] text-foreground-muted">총 기록</div>
        </div>
        <div className="p-2 rounded-lg bg-neon-green/10 text-center">
          <div className="text-lg font-bold text-neon-green">{stats.wins}</div>
          <div className="text-[10px] text-foreground-muted">성공</div>
        </div>
        <div className="p-2 rounded-lg bg-neon-red/10 text-center">
          <div className="text-lg font-bold text-neon-red">{stats.losses}</div>
          <div className="text-[10px] text-foreground-muted">실패</div>
        </div>
        <div className="p-2 rounded-lg bg-neon-blue/10 text-center">
          <div className="text-lg font-bold text-neon-blue">{stats.winRate.toFixed(0)}%</div>
          <div className="text-[10px] text-foreground-muted">승률</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="종목, 내용, 태그 검색..."
            className="w-full bg-background-tertiary rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "buy", "sell"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-2 text-xs rounded-lg transition-colors",
                filterType === type
                  ? "bg-neon-purple text-white"
                  : "bg-background-tertiary text-foreground-muted hover:text-foreground"
              )}
            >
              {type === "all" ? "전체" : type === "buy" ? "매수" : "매도"}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">기록이 없습니다</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={cn(
                "p-3 rounded-lg border border-border cursor-pointer",
                "hover:border-border-hover hover:bg-card-hover transition-all"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      entry.type === "buy"
                        ? "bg-neon-green/20 text-neon-green"
                        : "bg-neon-red/20 text-neon-red"
                    )}
                  >
                    {entry.type === "buy" ? "매수" : "매도"}
                  </span>
                  <span className="font-mono font-bold">{entry.ticker}</span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded", EMOTION_CONFIG[entry.emotion].color)}>
                    {EMOTION_CONFIG[entry.emotion].emoji} {EMOTION_CONFIG[entry.emotion].label}
                  </span>
                </div>
                <div className="text-xs text-foreground-muted">
                  {entry.date.toLocaleDateString("ko-KR")}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-2">
                <span className="text-foreground-muted">
                  {entry.quantity}주 × ${entry.price.toFixed(2)}
                </span>
                {entry.outcome && entry.outcome !== "pending" && (
                  <span
                    className={cn(
                      "font-mono-numbers font-medium flex items-center gap-1",
                      entry.outcome === "profit" ? "text-neon-green" : "text-neon-red"
                    )}
                  >
                    {entry.outcome === "profit" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {entry.outcomePercent !== undefined
                      ? `${entry.outcomePercent >= 0 ? "+" : ""}${entry.outcomePercent.toFixed(1)}%`
                      : ""}
                  </span>
                )}
              </div>

              <p className="text-xs text-foreground-muted line-clamp-2">{entry.reason}</p>

              {entry.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    selectedEntry.type === "buy"
                      ? "bg-neon-green/20 text-neon-green"
                      : "bg-neon-red/20 text-neon-red"
                  )}
                >
                  {selectedEntry.type === "buy" ? "매수" : "매도"}
                </span>
                <span className="font-mono font-bold text-lg">{selectedEntry.ticker}</span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded hover:bg-background-tertiary"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-background-tertiary">
                <div>
                  <div className="text-xs text-foreground-muted">수량</div>
                  <div className="font-mono-numbers">{selectedEntry.quantity}주</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted">가격</div>
                  <div className="font-mono-numbers">${selectedEntry.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted">날짜</div>
                  <div>{selectedEntry.date.toLocaleDateString("ko-KR")}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted">결과</div>
                  <div
                    className={cn(
                      "font-mono-numbers font-medium",
                      selectedEntry.outcome === "profit"
                        ? "text-neon-green"
                        : selectedEntry.outcome === "loss"
                        ? "text-neon-red"
                        : "text-foreground-muted"
                    )}
                  >
                    {selectedEntry.outcome === "profit"
                      ? `+${selectedEntry.outcomePercent?.toFixed(1)}%`
                      : selectedEntry.outcome === "loss"
                      ? `${selectedEntry.outcomePercent?.toFixed(1)}%`
                      : "진행중"}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-neon-blue" />
                  <span className="text-sm font-medium">매매 이유</span>
                </div>
                <p className="text-sm text-foreground-muted">{selectedEntry.reason}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-neon-purple" />
                  <span className="text-sm font-medium">감정 상태</span>
                </div>
                <span className={cn("px-2 py-1 rounded text-sm", EMOTION_CONFIG[selectedEntry.emotion].color)}>
                  {EMOTION_CONFIG[selectedEntry.emotion].emoji} {EMOTION_CONFIG[selectedEntry.emotion].label}
                </span>
              </div>

              {selectedEntry.lessons && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-neon-yellow" />
                    <span className="text-sm font-medium">교훈</span>
                  </div>
                  <p className="text-sm text-foreground-muted">{selectedEntry.lessons}</p>
                </div>
              )}

              {selectedEntry.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {selectedEntry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-neon-purple/20 text-neon-purple"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-border">
              <button className="btn btn-ghost flex-1 text-xs">
                <Edit3 className="w-3 h-3" />
                수정
              </button>
              <button className="btn btn-ghost flex-1 text-xs text-neon-red">
                <Trash2 className="w-3 h-3" />
                삭제
              </button>
              <button onClick={() => setSelectedEntry(null)} className="btn btn-primary flex-1 text-xs">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
