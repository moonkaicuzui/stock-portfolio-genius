"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  TransactionForm,
  TransactionHistory,
  DEMO_TRANSACTIONS,
} from "@/components/transaction";
import type { TransactionFormData } from "@/components/transaction";
import type { Transaction } from "@/lib/api";
import * as api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
      setBackendAvailable(true);
      return data;
    } catch (err) {
      console.warn("Backend not available, using demo data");
      setBackendAvailable(false);
      setTransactions(DEMO_TRANSACTIONS);
      return DEMO_TRANSACTIONS;
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchTransactions().finally(() => setIsLoading(false));
  }, [fetchTransactions]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalTransactions: transactions.length,
    totalBuyVolume: transactions
      .filter((t) => t.type === "buy")
      .reduce((sum, t) => sum + t.totalAmount, 0),
    totalSellVolume: transactions
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + t.totalAmount, 0),
    uniqueStocks: new Set(transactions.map((t) => t.ticker)).size,
  }), [transactions]);

  const handleSubmit = async (data: TransactionFormData) => {
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
        // Refresh from backend
        await fetchTransactions();
      } else {
        // Demo mode - local only
        const newTransaction: Transaction = {
          id: Date.now(),
          type: data.type,
          ticker: data.ticker,
          quantity: data.quantity,
          price: data.price,
          totalAmount: data.quantity * data.price,
          fees: data.fees || 0,
          date: data.date,
          notes: data.notes,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) =>
          [newTransaction, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("거래 기록에 실패했습니다. 백엔드 서버를 확인해주세요.");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      if (backendAvailable) {
        await api.deleteTransaction(id);
        await fetchTransactions();
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleExport = () => {
    const csv = [
      ["날짜", "유형", "종목", "수량", "가격", "금액", "수수료", "메모"].join(","),
      ...transactions.map((t) =>
        [
          t.date,
          t.type,
          t.ticker,
          t.quantity,
          t.price,
          t.totalAmount,
          t.fees,
          t.notes || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                <h1 className="text-xl font-bold">거래 내역</h1>
                <p className="text-xs text-foreground-muted">
                  매수/매도 기록 관리
                  {!backendAvailable && (
                    <span className="ml-2 text-neon-yellow">(데모 모드)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="btn btn-ghost"
                title="CSV 내보내기"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setShowForm(true);
                }}
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
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
            <span className="ml-2 text-foreground-muted">데이터 로딩 중...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 flex items-center gap-2 text-sm text-neon-red">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <p className="text-sm text-foreground-muted">총 거래</p>
                <p className="text-2xl font-bold font-mono-numbers">
                  {stats.totalTransactions}건
                </p>
              </div>
              <div className="card">
                <p className="text-sm text-foreground-muted">매수 금액</p>
                <p className="text-2xl font-bold font-mono-numbers text-neon-green">
                  {formatCurrency(stats.totalBuyVolume)}
                </p>
              </div>
              <div className="card">
                <p className="text-sm text-foreground-muted">매도 금액</p>
                <p className="text-2xl font-bold font-mono-numbers text-neon-red">
                  {formatCurrency(stats.totalSellVolume)}
                </p>
              </div>
              <div className="card">
                <p className="text-sm text-foreground-muted">거래 종목</p>
                <p className="text-2xl font-bold font-mono-numbers">
                  {stats.uniqueStocks}개
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <TransactionHistory
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          initialData={
            editingTransaction
              ? {
                  type: editingTransaction.type,
                  ticker: editingTransaction.ticker,
                  quantity: editingTransaction.quantity,
                  price: editingTransaction.price,
                  date: editingTransaction.date,
                  fees: editingTransaction.fees,
                  notes: editingTransaction.notes,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
