/**
 * API Client for Stock Portfolio Genius
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============ Types ============

export interface StockQuote {
  ticker: string;
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: string;
  source: string;
}

export interface StockInfo {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  description?: string;
  currentPrice?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
}

export interface OHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  period: string;
  interval: string;
  count: number;
  data: OHLCV[];
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  requestsRemaining?: number;
  resetTime?: string;
  lastError?: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type?: string;
  exchange?: string;
}

export interface HealthCheckProvider {
  name: string;
  available: boolean;
  requests_remaining?: number;
}

export interface Holding {
  id: number;
  ticker: string;
  quantity: number;
  avgCost: number;
  targetPrice?: number;
  stopLoss?: number;
  sector?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Calculated fields
  currentPrice?: number;
  marketValue?: number;
  gain?: number;
  gainPercent?: number;
}

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

export interface TransactionCreate {
  type: "buy" | "sell";
  ticker: string;
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: Holding[];
  sectorAllocation: { sector: string; value: number; percent: number }[];
}

// ============ API Functions ============

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  return response.json();
}

// ============ Stock Data ============

export async function searchStocks(query: string): Promise<{ results: SearchResult[] }> {
  return fetchApi(`/api/stocks/search?q=${encodeURIComponent(query)}`);
}

export async function getStockInfo(symbol: string): Promise<StockInfo> {
  return fetchApi(`/api/stocks/${symbol}`);
}

export async function getStockQuote(
  symbol: string,
  realtime = false
): Promise<StockQuote> {
  return fetchApi(`/api/stocks/${symbol}/quote?realtime=${realtime}`);
}

export async function getHistoricalData(
  symbol: string,
  period = "1y",
  interval = "1d"
): Promise<HistoricalData> {
  return fetchApi(
    `/api/stocks/${symbol}/history?period=${period}&interval=${interval}`
  );
}

export async function getBatchQuotes(
  symbols: string[]
): Promise<{ count: number; quotes: Record<string, Partial<StockQuote>> }> {
  return fetchApi(`/api/stocks/batch/quotes?symbols=${symbols.join(",")}`);
}

export async function getBTCPrice(): Promise<{ symbol: string; price: number }> {
  return fetchApi("/api/crypto/btc");
}

// ============ Provider Status ============

export async function getProviderStatus(): Promise<{ providers: ProviderStatus[] }> {
  return fetchApi("/api/providers/status");
}

export async function clearCache(symbol?: string): Promise<{ message: string }> {
  return fetchApi(`/api/cache/clear${symbol ? `?symbol=${symbol}` : ""}`, {
    method: "POST",
  });
}

// ============ Health Check ============

export async function healthCheck(): Promise<{
  status: string;
  database: string;
  providers: HealthCheckProvider[];
}> {
  return fetchApi("/health");
}

// ============ Portfolio API ============

export async function getHoldings(): Promise<Holding[]> {
  return fetchApi("/api/portfolio/holdings");
}

export async function getHolding(ticker: string): Promise<Holding> {
  return fetchApi(`/api/portfolio/holdings/${ticker}`);
}

export async function updateHolding(
  ticker: string,
  data: { targetPrice?: number; stopLoss?: number; sector?: string; notes?: string }
): Promise<Holding> {
  return fetchApi(`/api/portfolio/holdings/${ticker}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHolding(ticker: string): Promise<{ message: string }> {
  return fetchApi(`/api/portfolio/holdings/${ticker}`, {
    method: "DELETE",
  });
}

// ============ Transaction API ============

export async function getTransactions(params?: {
  ticker?: string;
  type?: "buy" | "sell";
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();
  if (params?.ticker) searchParams.set("ticker", params.ticker);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return fetchApi(`/api/portfolio/transactions${query ? `?${query}` : ""}`);
}

export async function createTransaction(data: TransactionCreate): Promise<Transaction> {
  return fetchApi("/api/portfolio/transactions", {
    method: "POST",
    body: JSON.stringify({
      type: data.type,
      ticker: data.ticker,
      quantity: data.quantity,
      price: data.price,
      date: data.date,
      fees: data.fees || 0,
      notes: data.notes || null,
    }),
  });
}

export async function deleteTransaction(id: number): Promise<{ message: string }> {
  return fetchApi(`/api/portfolio/transactions/${id}`, {
    method: "DELETE",
  });
}

export async function getPortfolioSummary(): Promise<{
  totalCost: number;
  holdingsCount: number;
  holdings: Array<{
    id: number;
    ticker: string;
    quantity: number;
    avgCost: number;
    costBasis: number;
    sector?: string;
  }>;
}> {
  return fetchApi("/api/portfolio/summary");
}

// ============ Export ============

export { ApiError, API_BASE_URL };
