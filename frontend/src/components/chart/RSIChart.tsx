"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ColorType,
  Time,
  LineSeries,
} from "lightweight-charts";
import { cn } from "@/lib/utils";
import type { OHLCVData } from "./TradingChart";

interface RSIChartProps {
  data: OHLCVData[];
  period?: number;
  height?: number;
  className?: string;
}

function calculateRSI(data: OHLCVData[], period: number = 14): { time: Time; value: number }[] {
  const result: { time: Time; value: number }[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      continue;
    }

    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i >= period) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

      let rsi: number;
      if (avgLoss === 0) {
        rsi = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
      }
      result.push({ time: data[i].time, value: rsi });
    }
  }
  return result;
}

const CHART_COLORS = {
  background: "#0d0d0d",
  textColor: "#a1a1aa",
  gridColor: "#2a2a2a",
  rsiLine: "#00d4ff",
  overbought: "#ff4757",
  oversold: "#00ff88",
};

export function RSIChart({
  data,
  period = 14,
  height = 100,
  className,
}: RSIChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length < period) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.textColor,
      },
      grid: {
        vertLines: { color: CHART_COLORS.gridColor },
        horzLines: { color: CHART_COLORS.gridColor },
      },
      timeScale: {
        borderColor: CHART_COLORS.gridColor,
        visible: false,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    chartRef.current = chart;

    // RSI line
    const rsiSeries = chart.addSeries(LineSeries, {
      color: CHART_COLORS.rsiLine,
      lineWidth: 2,
      priceLineVisible: false,
    });

    const rsiData = calculateRSI(data, period);
    rsiSeries.setData(rsiData);

    // Overbought/Oversold lines
    const overboughtLine = chart.addSeries(LineSeries, {
      color: CHART_COLORS.overbought,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
    });
    overboughtLine.setData(
      rsiData.map((d) => ({ time: d.time, value: 70 }))
    );

    const oversoldLine = chart.addSeries(LineSeries, {
      color: CHART_COLORS.oversold,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
    });
    oversoldLine.setData(
      rsiData.map((d) => ({ time: d.time, value: 30 }))
    );

    // Middle line (50)
    const middleLine = chart.addSeries(LineSeries, {
      color: "#ffffff30",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
    });
    middleLine.setData(
      rsiData.map((d) => ({ time: d.time, value: 50 }))
    );

    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, period, height]);

  if (data.length < period) {
    return null;
  }

  // Calculate current RSI value
  const rsiData = calculateRSI(data, period);
  const currentRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : null;

  return (
    <div className={cn("relative", className)}>
      {/* RSI Label */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-xs">
        <span className="text-foreground-muted">RSI({period})</span>
        {currentRSI !== null && (
          <span
            className={cn(
              "font-mono-numbers font-medium",
              currentRSI > 70 ? "text-neon-red" : currentRSI < 30 ? "text-neon-green" : "text-neon-blue"
            )}
          >
            {currentRSI.toFixed(1)}
          </span>
        )}
        {currentRSI !== null && currentRSI > 70 && (
          <span className="px-1.5 py-0.5 bg-neon-red-muted text-neon-red rounded text-[10px]">
            과매수
          </span>
        )}
        {currentRSI !== null && currentRSI < 30 && (
          <span className="px-1.5 py-0.5 bg-neon-green-muted text-neon-green rounded text-[10px]">
            과매도
          </span>
        )}
      </div>

      {/* RSI Level Labels */}
      <div className="absolute top-1/4 right-1 z-10 text-[10px] text-neon-red/60">70</div>
      <div className="absolute top-1/2 right-1 z-10 text-[10px] text-foreground-muted/60 -translate-y-1/2">50</div>
      <div className="absolute bottom-1/4 right-1 z-10 text-[10px] text-neon-green/60">30</div>

      <div ref={chartContainerRef} />
    </div>
  );
}
