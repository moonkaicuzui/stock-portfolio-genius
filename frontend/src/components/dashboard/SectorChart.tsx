"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SectorData {
  sector: string;
  value: number;
  percent: number;
  [key: string]: string | number;
}

interface SectorChartProps {
  data: SectorData[];
}

const COLORS = [
  "#00ff88", // neon-green
  "#00d4ff", // neon-blue
  "#a855f7", // neon-purple
  "#fbbf24", // neon-yellow
  "#ff4757", // neon-red
  "#38bdf8", // sky
  "#f472b6", // pink
  "#34d399", // emerald
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SectorData }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background-secondary border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{data.sector}</p>
        <p className="text-sm text-foreground-muted mt-1">
          {formatCurrency(data.value)}
        </p>
        <p className="text-sm font-medium text-neon-blue">
          {data.percent.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function SectorChart({ data }: SectorChartProps) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium mb-4">섹터별 배분</h3>
        <div className="h-[200px] flex items-center justify-center text-foreground-muted">
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium mb-4">섹터별 배분</h3>

      <div className="flex items-center gap-4">
        {/* Chart */}
        <div className="w-[160px] h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.sector}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div
              key={item.sector}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-foreground-muted truncate max-w-[100px]">
                  {item.sector}
                </span>
              </div>
              <span className="font-medium font-mono-numbers">
                {item.percent.toFixed(1)}%
              </span>
            </div>
          ))}
          {data.length > 5 && (
            <div className="text-xs text-foreground-muted text-right">
              +{data.length - 5}개 섹터
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
