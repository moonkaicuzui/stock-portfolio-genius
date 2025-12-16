"use client";

import { useState } from "react";
import { X, Search, Calendar, DollarSign, Hash, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type TransactionType = "buy" | "sell";

export interface TransactionFormData {
  type: TransactionType;
  ticker: string;
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  initialData?: Partial<TransactionFormData>;
  availableShares?: number; // For sell validation
}

export function TransactionForm({
  onSubmit,
  onCancel,
  initialData,
  availableShares,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || "buy");
  const [ticker, setTicker] = useState(initialData?.ticker || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [fees, setFees] = useState(initialData?.fees?.toString() || "0");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!ticker.trim()) {
      newErrors.ticker = "티커를 입력해주세요";
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = "수량을 입력해주세요";
    } else if (type === "sell" && availableShares !== undefined && qty > availableShares) {
      newErrors.quantity = `보유 수량(${availableShares}주)을 초과할 수 없습니다`;
    }

    const prc = parseFloat(price);
    if (isNaN(prc) || prc <= 0) {
      newErrors.price = "가격을 입력해주세요";
    }

    if (!date) {
      newErrors.date = "날짜를 선택해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      type,
      ticker: ticker.toUpperCase().trim(),
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date,
      fees: parseFloat(fees) || 0,
      notes: notes.trim(),
    });
  };

  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);
  const feesAmount = parseFloat(fees) || 0;
  const grandTotal = type === "buy" ? totalAmount + feesAmount : totalAmount - feesAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {initialData?.ticker ? "거래 수정" : "거래 추가"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-background-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Transaction Type Toggle */}
          <div className="flex gap-2 p-1 bg-background-secondary rounded-lg">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                type === "buy"
                  ? "bg-neon-green text-black"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              매수 (Buy)
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                type === "sell"
                  ? "bg-neon-red text-white"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              매도 (Sell)
            </button>
          </div>

          {/* Ticker */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1.5">
              종목 코드 (Ticker)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="예: AAPL, NVDA, TSLA"
                className={cn(
                  "input pl-10 uppercase",
                  errors.ticker && "border-neon-red focus:border-neon-red"
                )}
              />
            </div>
            {errors.ticker && (
              <p className="text-xs text-neon-red mt-1">{errors.ticker}</p>
            )}
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground-muted mb-1.5">
                수량
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={cn(
                    "input pl-10 font-mono-numbers",
                    errors.quantity && "border-neon-red focus:border-neon-red"
                  )}
                />
              </div>
              {errors.quantity && (
                <p className="text-xs text-neon-red mt-1">{errors.quantity}</p>
              )}
              {type === "sell" && availableShares !== undefined && (
                <p className="text-xs text-foreground-muted mt-1">
                  보유: {availableShares}주
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-foreground-muted mb-1.5">
                가격 ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "input pl-10 font-mono-numbers",
                    errors.price && "border-neon-red focus:border-neon-red"
                  )}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-neon-red mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1.5">
              거래일
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={cn(
                  "input pl-10",
                  errors.date && "border-neon-red focus:border-neon-red"
                )}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-neon-red mt-1">{errors.date}</p>
            )}
          </div>

          {/* Fees */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1.5">
              수수료 ($) - 선택사항
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="0.00"
                className="input pl-10 font-mono-numbers"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-foreground-muted mb-1.5">
              메모 - 선택사항
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-foreground-muted" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="거래 메모를 입력하세요"
                rows={2}
                className="input pl-10 resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-background-secondary rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground-muted">거래 금액</span>
              <span className="font-mono-numbers">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {feesAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-foreground-muted">수수료</span>
                <span className="font-mono-numbers text-neon-red">
                  {type === "buy" ? "+" : "-"}$
                  {feesAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-border">
              <span>{type === "buy" ? "총 결제 금액" : "총 수령 금액"}</span>
              <span
                className={cn(
                  "font-mono-numbers",
                  type === "buy" ? "text-neon-red" : "text-neon-green"
                )}
              >
                ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn btn-ghost flex-1">
              취소
            </button>
            <button
              type="submit"
              className={cn(
                "btn flex-1",
                type === "buy" ? "btn-success" : "btn-danger"
              )}
            >
              {type === "buy" ? "매수 기록" : "매도 기록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
