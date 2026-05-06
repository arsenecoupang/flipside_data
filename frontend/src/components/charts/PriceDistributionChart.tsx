// src/components/charts/PriceDistributionChart.tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { CT } from "@/lib/utils";
import type { LPRecord } from "@/types";

interface PriceDistributionChartProps { data: LPRecord[] }

const TIER_COLORS: Record<string, string> = {
  low: "#525252", mid: CT.primary, high: "#8b5cf6",
};

export function PriceDistributionChart({ data }: PriceDistributionChartProps) {
  const tierData = (["low", "mid", "high"] as const).map((tier) => {
    const items = data.filter((d) => d.price_tier === tier);
    const prices = items.map((d) => d.lowest_price).filter((p): p is number => p != null);
    return {
      tier,
      count: items.length,
      avg_price: prices.length > 0
        ? parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2))
        : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={tierData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CT.grid} />
        <XAxis dataKey="tier" tick={{ fill: CT.tick, fontSize: 12 }} axisLine={{ stroke: CT.axis }} tickLine={false} />
        <YAxis tick={{ fill: CT.tick, fontSize: 11 }} axisLine={{ stroke: CT.axis }} tickLine={false} />
        <Tooltip
          contentStyle={CT.tooltip.contentStyle}
          labelStyle={CT.tooltip.labelStyle}
          itemStyle={CT.tooltip.itemStyle}
          formatter={(v: unknown, name: unknown) => [
            name === "count" ? `${Number(v)}개` : `$${Number(v).toFixed(2)}`,
            name === "count" ? "LP 수" : "평균 가격",
          ]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {tierData.map((e) => (
            <Cell key={e.tier} fill={TIER_COLORS[e.tier]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
