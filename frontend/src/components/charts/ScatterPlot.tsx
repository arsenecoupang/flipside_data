// src/components/charts/ScatterPlot.tsx
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CT, fmtPrice, fmtRatio, popularityToColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { LPRecord } from "@/types";

interface PlotPoint {
  x: number;
  y: number;
  popularity: number | null;
  title: string;
  artist: string;
}

interface ScatterPlotProps {
  data: LPRecord[];
  loading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PlotPoint }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={CT.tooltip.contentStyle} className="px-3 py-2 space-y-1 max-w-[200px]">
      <p className="font-semibold truncate" style={CT.tooltip.labelStyle}>
        {d.title}
      </p>
      <p className="truncate" style={CT.tooltip.itemStyle}>
        {d.artist}
      </p>
      <div className="flex gap-3 pt-1">
        <span style={CT.tooltip.itemStyle}>
          희소성 <span style={{ color: "#f5f5f5" }}>{fmtRatio(d.x)}</span>
        </span>
        <span style={CT.tooltip.itemStyle}>
          가격 <span style={{ color: "#f5f5f5" }}>{fmtPrice(d.y)}</span>
        </span>
      </div>
      {d.popularity != null && (
        <p style={CT.tooltip.itemStyle}>
          Spotify <span style={{ color: popularityToColor(d.popularity) }}>{d.popularity}</span>
        </p>
      )}
    </div>
  );
};

// 커스텀 점 렌더러 (popularity 기반 색상)
const CustomDot = (props: Record<string, unknown>) => {
  const { cx, cy, payload } = props as {
    cx: number;
    cy: number;
    payload: PlotPoint;
  };
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={popularityToColor(payload.popularity)}
      fillOpacity={0.8}
      stroke="transparent"
    />
  );
};

export function ScatterPlot({ data, loading }: ScatterPlotProps) {
  if (loading) {
    return <Skeleton className="w-full h-72" style={{ background: "var(--bg-sub)" }} />;
  }

  const plotData: PlotPoint[] = data
    .filter((d) => d.want_have_ratio != null && d.lowest_price != null)
    .map((d) => ({
      x: d.want_have_ratio!,
      y: d.lowest_price!,
      popularity: d.spotify_popularity,
      title: d.title,
      artist: d.artist,
    }));

  if (!plotData.length) {
    return (
      <div
        className="flex items-center justify-center h-72 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        데이터 없음
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={288}>
        <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
          <XAxis
            dataKey="x"
            type="number"
            name="want_have_ratio"
            tick={{ fill: CT.tick, fontSize: 11 }}
            axisLine={{ stroke: CT.axis }}
            tickLine={false}
            label={{
              value: "희소성 (want/have)",
              position: "insideBottom",
              offset: -12,
              style: { fill: CT.axis, fontSize: 11 },
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name="lowest_price"
            tick={{ fill: CT.tick, fontSize: 11 }}
            axisLine={{ stroke: CT.axis }}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: CT.grid }} />
          <Scatter data={plotData} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex items-center gap-3 justify-end mt-1 pr-4">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          Spotify 인기도 낮음
        </span>
        <div
          className="h-2 w-24 rounded-full"
          style={{
            background: `linear-gradient(to right, #525252, ${CT.primary})`,
          }}
        />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          높음
        </span>
      </div>
    </div>
  );
}
