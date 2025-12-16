"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

interface PortfolioChartData {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  data: PortfolioChartData[];
  currentValue: number;
  className?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const PERIODS = [
  { key: "1D", days: 1 },
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "1Y", days: 365 },
  { key: "ALL", days: -1 },
] as const;

// Generate demo data outside component to avoid impure function calls during render
const generateDemoData = (baseValue: number): PortfolioChartData[] => {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(now - (30 - i) * 86400000).toLocaleDateString(),
    value: baseValue * (0.9 + Math.random() * 0.2),
  }));
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background-secondary border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="text-lg font-bold font-mono-numbers text-neon-blue mt-1">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioChart({
  data,
  currentValue,
  className,
}: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1M");
  // Generate demo data once on mount to avoid impure function calls during render
  const [demoData] = useState<PortfolioChartData[]>(() => generateDemoData(currentValue));

  const filteredData = useMemo(() => {
    const period = PERIODS.find((p) => p.key === selectedPeriod);
    if (!period || period.days === -1) return data;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period.days);

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, selectedPeriod]);

  const stats = useMemo(() => {
    if (filteredData.length < 2) {
      return { change: 0, changePercent: 0, isPositive: true };
    }

    const startValue = filteredData[0].value;
    const endValue = filteredData[filteredData.length - 1].value;
    const change = endValue - startValue;
    const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

    return {
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [filteredData]);

  const gradientColor = stats.isPositive ? "#00ff88" : "#ff4757";

  // Use pre-generated demo data if no data provided
  const displayData = filteredData.length > 0 ? filteredData : demoData;

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">포트폴리오 가치</h3>
        <div className="flex gap-1">
          {PERIODS.map(({ key }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                selectedPeriod === key
                  ? "bg-neon-blue text-black font-medium"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold font-mono-numbers">
          {formatCurrency(currentValue)}
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            stats.isPositive ? "text-neon-green" : "text-neon-red"
          )}
        >
          {stats.isPositive ? "+" : ""}
          {formatCurrency(stats.change)} ({stats.isPositive ? "+" : ""}
          {stats.changePercent.toFixed(2)}%)
        </span>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={gradientColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
