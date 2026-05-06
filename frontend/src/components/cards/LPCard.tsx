// src/components/cards/LPCard.tsx
import { fmtPrice, fmtRatio, gapColor } from "@/lib/utils";
import type { LPRecord } from "@/types";

interface LPCardProps {
  lp: LPRecord;
}

const TIER_STYLE: Record<string, string> = {
  high: "bg-purple-900/40 text-purple-300",
  mid:  "bg-indigo-900/40 text-indigo-300",
  low:  "bg-neutral-800 text-neutral-400",
};

export function LPCard({ lp }: LPCardProps) {
  const gap = lp.price_gap;
  const color = gapColor(gap);

  return (
    <div
      className="rounded-xl p-4 space-y-3 hover:shadow-lg transition-shadow cursor-default"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>
            {lp.title}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
            {lp.artist}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {lp.price_tier && (
            <span className={`text-xs px-2 py-0.5 rounded ${TIER_STYLE[lp.price_tier] ?? TIER_STYLE.low}`}>
              {lp.price_tier}
            </span>
          )}
          {lp.is_limited_edition && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-300">
              Limited
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p style={{ color: "var(--text-muted)" }}>현재가</p>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            {fmtPrice(lp.lowest_price)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-muted)" }}>예측가</p>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            {fmtPrice(lp.predicted_price)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-muted)" }}>희소성</p>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            {fmtRatio(lp.want_have_ratio)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-muted)" }}>갭</p>
          {gap != null ? (
            <span
              className="inline-block font-semibold px-1.5 py-0.5 rounded text-xs"
              style={{ color, background: `${color}18` }}
            >
              {gap > 0 ? "+" : ""}{fmtPrice(gap)}
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>N/A</span>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {lp.year}년{lp.genre ? ` · ${lp.genre}` : ""}
        {lp.spotify_popularity != null ? ` · ♪ ${lp.spotify_popularity}` : ""}
      </p>
    </div>
  );
}
