// src/components/charts/PriceDistributionChart.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CT } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LPRecord } from "@/types";

interface BinDef {
  label: string;
  min: number;
  max: number;
  color: string;
}

const BINS: BinDef[] = [
  { label: "$0–50",    min: 0,   max: 50,       color: "#10b981" },
  { label: "$50–100",  min: 50,  max: 100,      color: "#6366f1" },
  { label: "$100–200", min: 100, max: 200,      color: "#f59e0b" },
  { label: "$200+",    min: 200, max: Infinity, color: "#f59e0b" },
];

interface BinData extends BinDef {
  current:   number;
  predicted: number;
}

function buildBins(lps: LPRecord[]): BinData[] {
  return BINS.map((bin) => {
    const inBin = (v: number | null) =>
      v != null && v >= bin.min && v < bin.max;
    return {
      ...bin,
      current:   lps.filter((lp) => inBin(lp.lowest_price)).length,
      predicted: lps.filter((lp) => inBin(lp.predicted_price)).length,
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; dataKey: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={CT.tooltip.contentStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold" style={CT.tooltip.labelStyle}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={CT.tooltip.itemStyle}>
          {p.name}{" "}
          <span style={{ color: "var(--text-1)" }}>{p.value}개</span>
        </p>
      ))}
    </div>
  );
};

interface PriceDistributionChartProps {
  data: LPRecord[];
  loading?: boolean;
}

export function PriceDistributionChart({ data, loading }: PriceDistributionChartProps) {
  if (loading) {
    return <Skeleton className="w-full h-56" style={{ background: "var(--bg-sub)" }} />;
  }

  const bins = buildBins(data);
  const hasData = bins.some((b) => b.current > 0 || b.predicted > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center h-56 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        가격 데이터 없음
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart
        data={bins}
        margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
        barCategoryGap="25%"
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={{ stroke: CT.axis }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={{ stroke: CT.axis }}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2d2d2d" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: CT.tick, paddingTop: 8 }}
          formatter={(v) => (
            <span style={{ color: CT.tick }}>{v}</span>
          )}
        />

        {/* 현재가 바 */}
        <Bar dataKey="current" name="현재가" radius={[3, 3, 0, 0]}>
          {bins.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>

        {/* 예측가 바 (50% 투명도) */}
        <Bar dataKey="predicted" name="예측가" radius={[3, 3, 0, 0]}>
          {bins.map((entry) => (
            <Cell key={entry.label} fill={entry.color} fillOpacity={0.4} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
