// src/components/charts/GenreBarChart.tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CT, fmtPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenreStat } from "@/types";

interface GenreBarChartProps {
  data: GenreStat[];
  loading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: GenreStat }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={CT.tooltip.contentStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold" style={CT.tooltip.labelStyle}>
        {d.genre}
      </p>
      <p style={CT.tooltip.itemStyle}>
        평균가{" "}
        <span style={{ color: "#f5f5f5" }}>{fmtPrice(d.avg_price)}</span>
      </p>
      <p style={CT.tooltip.itemStyle}>
        LP 수{" "}
        <span style={{ color: "#f5f5f5" }}>{d.count}개</span>
      </p>
      {d.avg_want_have_ratio != null && (
        <p style={CT.tooltip.itemStyle}>
          희소성{" "}
          <span style={{ color: "#f5f5f5" }}>{d.avg_want_have_ratio.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
};

export function GenreBarChart({ data, loading }: GenreBarChartProps) {
  if (loading) {
    return <Skeleton className="w-full h-72" style={{ background: "var(--bg-sub)" }} />;
  }

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center h-72 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        장르 데이터 없음
      </div>
    );
  }

  // avg_price 내림차순 상위 8개, recharts는 아래서 위로 렌더하므로 역정렬
  const sorted = [...data]
    .filter((d) => d.avg_price != null)
    .sort((a, b) => (a.avg_price ?? 0) - (b.avg_price ?? 0))
    .slice(-8);

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          stroke={CT.grid}
        />
        <XAxis
          type="number"
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={{ stroke: CT.axis }}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          type="category"
          dataKey="genre"
          width={90}
          tick={{ fill: CT.tick, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#2d2d2d" }} />
        <Bar dataKey="avg_price" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sorted.map((entry, i) => (
            <Cell
              key={entry.genre}
              fill={i === sorted.length - 1 ? CT.primary : `${CT.primary}99`}
            />
          ))}
          <LabelList
            dataKey="avg_price"
            position="right"
            formatter={(v: unknown) => fmtPrice(v as number)}
            style={{ fill: CT.tick, fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
