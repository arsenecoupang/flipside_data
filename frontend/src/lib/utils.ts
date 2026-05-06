// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── 숫자 포맷 ─────────────────────────────────────────────────────────────────

export function fmtPrice(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function fmtNumber(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "N/A";
  return new Intl.NumberFormat("en-US").format(v);
}

export function fmtRatio(v: number | null | undefined, digits = 2): string {
  if (v == null || isNaN(v)) return "N/A";
  return v.toFixed(digits);
}

export function fmtPercent(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "N/A";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

// ── 색상 유틸 ─────────────────────────────────────────────────────────────────

/** spotify_popularity (0–100) → #525252 ~ #6366f1 그라데이션 */
export function popularityToColor(v: number | null | undefined): string {
  if (v == null) return "#525252";
  const t = Math.min(Math.max(v, 0), 100) / 100;
  const r = Math.round(0x52 + t * (0x63 - 0x52));
  const g = Math.round(0x52 + t * (0x66 - 0x52));
  const b = Math.round(0x52 + t * (0xf1 - 0x52));
  return `rgb(${r},${g},${b})`;
}

/** price_gap 양수/음수에 따른 색상 */
export function gapColor(gap: number | null | undefined): string {
  if (gap == null) return "#525252";
  if (gap > 0) return "#10b981";
  if (gap < -2) return "#ef4444";
  return "#f59e0b";
}

// ── 차트 공통 테마 ─────────────────────────────────────────────────────────────

export const CT = {
  grid:    "#2d2d2d",
  axis:    "#525252",
  tick:    "#a3a3a3",
  primary: "#6366f1",
  positive:"#10b981",
  tooltip: {
    contentStyle: {
      background: "#1a1a1a",
      border: "1px solid #2d2d2d",
      borderRadius: 8,
      fontSize: 12,
    } as React.CSSProperties,
    labelStyle:  { color: "#f5f5f5", fontWeight: 600 } as React.CSSProperties,
    itemStyle:   { color: "#a3a3a3" } as React.CSSProperties,
  },
} as const;

// React import for CSSProperties reference
import type React from "react";
