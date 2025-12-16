"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  ColorType,
  CrosshairMode,
  Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import {
  TrendingUp,
  Activity,
  BarChart2,
  Settings2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export interface OHLCVData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingChartProps {
  data: OHLCVData[];
  ticker: string;
  className?: string;
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
}

type ChartType = "candle" | "line" | "area";
type IndicatorType = "MA" | "EMA" | "RSI" | "MACD" | "BB";

interface IndicatorConfig {
  id: IndicatorType;
  label: string;
  enabled: boolean;
  params: Record<string, number>;
}

// Technical Analysis Functions
function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const prevEMA = result[i - 1];
      if (prevEMA !== null) {
        result.push((data[i] - prevEMA) * multiplier + prevEMA);
      } else {
        result.push(null);
      }
    }
  }
  return result;
}

function calculateRSI(data: OHLCVData[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      result.push(null);
      continue;
    }

    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return result;
}

function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      const middleVal = middle[i];
      if (middleVal !== null) {
        upper.push(middleVal + stdDev * std);
        lower.push(middleVal - stdDev * std);
      } else {
        upper.push(null);
        lower.push(null);
      }
    }
  }

  return { upper, middle, lower };
}

// Chart Colors
const CHART_COLORS = {
  background: "#0d0d0d",
  textColor: "#a1a1aa",
  gridColor: "#2a2a2a",
  upColor: "#00ff88",
  downColor: "#ff4757",
  volumeUp: "#00ff8840",
  volumeDown: "#ff475740",
  ma20: "#00d4ff",
  ma50: "#fbbf24",
  ma200: "#a855f7",
  rsi: "#00d4ff",
  bbUpper: "#a855f7",
  bbLower: "#a855f7",
  bbMiddle: "#fbbf24",
};

export function TradingChart({
  data,
  ticker,
  className,
  height = 400,
  showVolume = true,
  showIndicators = true,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  const [chartType, setChartType] = useState<ChartType>("candle");
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: "MA", label: "MA (20)", enabled: true, params: { period: 20 } },
    { id: "EMA", label: "EMA (50)", enabled: false, params: { period: 50 } },
    { id: "RSI", label: "RSI (14)", enabled: false, params: { period: 14 } },
    { id: "BB", label: "Bollinger", enabled: false, params: { period: 20, stdDev: 2 } },
  ]);
  const [crosshairData, setCrosshairData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  } | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

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
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "#ffffff40",
          style: 2,
        },
        horzLine: {
          width: 1,
          color: "#ffffff40",
          style: 2,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.gridColor,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.upColor,
      downColor: CHART_COLORS.downColor,
      borderUpColor: CHART_COLORS.upColor,
      borderDownColor: CHART_COLORS.downColor,
      wickUpColor: CHART_COLORS.upColor,
      wickDownColor: CHART_COLORS.downColor,
    });
    candleSeries.setData(data as CandlestickData<Time>[]);
    candleSeriesRef.current = candleSeries;

    // Create volume series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      const volumeData = data.map((d) => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown,
      }));
      volumeSeries.setData(volumeData as HistogramData<Time>[]);
      volumeSeriesRef.current = volumeSeries;
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const candleData = param.seriesData.get(candleSeries);
        if (candleData && "open" in candleData) {
          const volumeData = volumeSeriesRef.current
            ? param.seriesData.get(volumeSeriesRef.current)
            : null;
          setCrosshairData({
            time: String(param.time),
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: volumeData && "value" in volumeData ? (volumeData.value as number) : undefined,
          });
        }
      }
    });

    // Fit content
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
  }, [data, height, showVolume]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = chartRef.current;
    const closes = data.map((d) => d.close);

    // Remove all existing indicator series
    indicatorSeriesRef.current.forEach((series) => {
      chart.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Add enabled indicators
    indicators.forEach((indicator) => {
      if (!indicator.enabled) return;

      switch (indicator.id) {
        case "MA": {
          const maData = calculateSMA(closes, indicator.params.period);
          const series = chart.addSeries(LineSeries, {
            color: CHART_COLORS.ma20,
            lineWidth: 1,
            priceLineVisible: false,
          });
          series.setData(
            maData
              .map((value, i) => (value !== null ? { time: data[i].time, value } : null))
              .filter((d): d is LineData<Time> => d !== null)
          );
          indicatorSeriesRef.current.set("MA", series);
          break;
        }
        case "EMA": {
          const emaData = calculateEMA(closes, indicator.params.period);
          const series = chart.addSeries(LineSeries, {
            color: CHART_COLORS.ma50,
            lineWidth: 1,
            priceLineVisible: false,
          });
          series.setData(
            emaData
              .map((value, i) => (value !== null ? { time: data[i].time, value } : null))
              .filter((d): d is LineData<Time> => d !== null)
          );
          indicatorSeriesRef.current.set("EMA", series);
          break;
        }
        case "BB": {
          const bb = calculateBollingerBands(closes, indicator.params.period, indicator.params.stdDev);

          const upperSeries = chart.addSeries(LineSeries, {
            color: CHART_COLORS.bbUpper,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
          });
          const lowerSeries = chart.addSeries(LineSeries, {
            color: CHART_COLORS.bbLower,
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
          });
          const middleSeries = chart.addSeries(LineSeries, {
            color: CHART_COLORS.bbMiddle,
            lineWidth: 1,
            priceLineVisible: false,
          });

          upperSeries.setData(
            bb.upper
              .map((value, i) => (value !== null ? { time: data[i].time, value } : null))
              .filter((d): d is LineData<Time> => d !== null)
          );
          lowerSeries.setData(
            bb.lower
              .map((value, i) => (value !== null ? { time: data[i].time, value } : null))
              .filter((d): d is LineData<Time> => d !== null)
          );
          middleSeries.setData(
            bb.middle
              .map((value, i) => (value !== null ? { time: data[i].time, value } : null))
              .filter((d): d is LineData<Time> => d !== null)
          );

          indicatorSeriesRef.current.set("BB_upper", upperSeries);
          indicatorSeriesRef.current.set("BB_lower", lowerSeries);
          indicatorSeriesRef.current.set("BB_middle", middleSeries);
          break;
        }
      }
    });
  }, [indicators, data]);

  const toggleIndicator = (id: IndicatorType) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  const handleResetZoom = () => {
    chartRef.current?.timeScale().fitContent();
  };

  if (data.length === 0) {
    return (
      <div className={cn("card", className)}>
        <div className="flex items-center justify-center h-[400px] text-foreground-muted">
          <BarChart2 className="w-12 h-12 opacity-50" />
          <p className="ml-3">차트 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card p-0 overflow-hidden", className)}>
      {/* Chart Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-lg">{ticker}</span>
          {crosshairData && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-foreground-muted">O</span>
              <span className="font-mono-numbers">{crosshairData.open.toFixed(2)}</span>
              <span className="text-foreground-muted">H</span>
              <span className="font-mono-numbers">{crosshairData.high.toFixed(2)}</span>
              <span className="text-foreground-muted">L</span>
              <span className="font-mono-numbers">{crosshairData.low.toFixed(2)}</span>
              <span className="text-foreground-muted">C</span>
              <span
                className={cn(
                  "font-mono-numbers font-medium",
                  crosshairData.close >= crosshairData.open
                    ? "text-neon-green"
                    : "text-neon-red"
                )}
              >
                {crosshairData.close.toFixed(2)}
              </span>
              {crosshairData.volume && (
                <>
                  <span className="text-foreground-muted">Vol</span>
                  <span className="font-mono-numbers">
                    {(crosshairData.volume / 1e6).toFixed(2)}M
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Indicator Toggles */}
          {showIndicators && (
            <div className="flex gap-1 mr-2">
              {indicators.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => toggleIndicator(ind.id)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    ind.enabled
                      ? "bg-neon-blue text-black"
                      : "text-foreground-muted hover:bg-background-tertiary"
                  )}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          )}

          {/* Chart Controls */}
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-background-tertiary transition-colors"
            title="줌 리셋"
          >
            <RotateCcw className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} style={{ height }} />

      {/* Legend */}
      <div className="p-2 border-t border-border flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-neon-green" />
          <span className="text-foreground-muted">상승</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-neon-red" />
          <span className="text-foreground-muted">하락</span>
        </div>
        {indicators.find((i) => i.id === "MA" && i.enabled) && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: CHART_COLORS.ma20 }} />
            <span className="text-foreground-muted">MA(20)</span>
          </div>
        )}
        {indicators.find((i) => i.id === "EMA" && i.enabled) && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: CHART_COLORS.ma50 }} />
            <span className="text-foreground-muted">EMA(50)</span>
          </div>
        )}
        {indicators.find((i) => i.id === "BB" && i.enabled) && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: CHART_COLORS.bbUpper }} />
            <span className="text-foreground-muted">Bollinger</span>
          </div>
        )}
      </div>
    </div>
  );
}
