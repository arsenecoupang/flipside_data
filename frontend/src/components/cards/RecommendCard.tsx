// src/components/cards/RecommendCard.tsx
import { ArrowRight } from "lucide-react";
import { fmtPrice, fmtRatio } from "@/lib/utils";
import type { RecommendRecord } from "@/types";

interface RecommendCardProps {
  rec: RecommendRecord;
}

export function RecommendCard({ rec }: RecommendCardProps) {
  return (
    <div
      className="rounded-xl p-4 space-y-2 hover:shadow-md transition-shadow"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span style={{ color: "var(--text-2)" }}>{rec.input_artist}</span>
        <ArrowRight className="w-3 h-3" />
        <span>추천</span>
      </div>

      <div>
        <p className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
          {rec.recommended_title}
        </p>
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          {rec.recommended_artist}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs">
          <span>
            <span style={{ color: "var(--text-muted)" }}>현재가 </span>
            <span style={{ color: "var(--text-1)" }}>{fmtPrice(rec.lowest_price)}</span>
          </span>
          <span>
            <span style={{ color: "var(--text-muted)" }}>예측가 </span>
            <span style={{ color: "var(--text-1)" }}>{fmtPrice(rec.predicted_price)}</span>
          </span>
        </div>
        {rec.spotify_popularity != null && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ color: "var(--text-muted)", background: "var(--bg-sub)" }}
          >
            ♪ {rec.spotify_popularity}
          </span>
        )}
      </div>

      {rec.want_have_ratio != null && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          희소성 {fmtRatio(rec.want_have_ratio)}
        </p>
      )}
    </div>
  );
}
