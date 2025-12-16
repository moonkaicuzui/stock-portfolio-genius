"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  glowColor?: "green" | "red" | "blue" | "purple";
  className?: string;
}

export function StatsCard({
  title,
  value,
  subValue,
  change,
  changeLabel,
  icon,
  glowColor,
  className,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0;

  const glowClasses = {
    green: "card-glow-green",
    red: "card-glow-red",
    blue: "card-glow-blue",
    purple: "shadow-[0_0_20px_var(--neon-purple-muted)]",
  };

  return (
    <div
      className={cn(
        "card",
        glowColor && glowClasses[glowColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted">{title}</p>
          <p className="text-2xl font-bold mt-1 font-mono-numbers">{value}</p>
          {subValue && (
            <p className="text-sm text-foreground-muted mt-1">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-background-secondary">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive && "text-neon-green",
              isNegative && "text-neon-red",
              isNeutral && "text-foreground-muted"
            )}
          >
            {isPositive && <TrendingUp className="w-4 h-4" />}
            {isNegative && <TrendingDown className="w-4 h-4" />}
            {isNeutral && <Minus className="w-4 h-4" />}
            {isPositive && "+"}
            {change.toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-foreground-muted">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
