// src/components/charts/TrendLineChart.tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CT, fmtPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LPRecord } from "@/types";

interface YearPoint {
  year: number;
  avg_price: number;
  count: number;
}

interface TrendLineChartProps {
  data: LPRecord[];
  avgPrice?: number | null;
  loading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: YearPoint }[];
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={CT.tooltip.contentStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold" style={CT.tooltip.labelStyle}>
        {label}년
      </p>
      <p style={CT.tooltip.itemStyle}>
        평균가 <span style={{ color: "#f5f5f5" }}>{fmtPrice(d.avg_price)}</span>
      </p>
      <p style={CT.tooltip.itemStyle}>
        LP 수 <span style={{ color: "#f5f5f5" }}>{d.count}개</span>
      </p>
    </div>
  );
};

export function TrendLineChart({ data, avgPrice, loading }: TrendLineChartProps) {
  if (loading) {
    return <Skeleton className="w-full h-48" style={{ background: "var(--bg-sub)" }} />;
  }

  // 연도별 집계
  const yearMap: Record<number, { total: number; count: number }> = {};
  for (const lp of data) {
    if (!lp.year || lp.lowest_price == null) continue;
    if (lp.year < 1950 || lp.year > new Date().getFullYear()) continue;
    if (!yearMap[lp.year]) yearMap[lp.year] = { total: 0, count: 0 };
    yearMap[lp.year].total += lp.lowest_price;
    yearMap[lp.year].count += 1;
  }

  const chartData: YearPoint[] = Object.entries(yearMap)
    .map(([yr, { total, count }]) => ({
      year: Number(yr),
      avg_price: parseFloat((total / count).toFixed(2)),
      count,
    }))
    .sort((a, b) => a.year - b.year);

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        연도 데이터 없음
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
        <XAxis
          dataKey="year"
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={{ stroke: CT.axis }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={{ stroke: CT.axis }}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />

        {/* 전체 평균 참조선 */}
        {avgPrice != null && (
          <ReferenceLine
            y={avgPrice}
            stroke={CT.positive}
            strokeDasharray="5 3"
            label={{
              value: `평균 ${fmtPrice(avgPrice)}`,
              position: "insideTopRight",
              style: { fill: CT.positive, fontSize: 10 },
            }}
          />
        )}

        <Line
          type="monotone"
          dataKey="avg_price"
          stroke={CT.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: CT.primary, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: CT.primary }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
