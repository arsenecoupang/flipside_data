// src/components/cards/LPCard.tsx
import { Flame } from "lucide-react";
import { fmtPrice, fmtRatio, gapColor } from "@/lib/utils";
import type { LPRecord } from "@/types";

interface LPCardProps {
  lp: LPRecord;
}

function PopularityBar({ value }: { value: number | null }) {
  const pct = value != null ? Math.min(Math.max(value, 0), 100) : 0;
  const color =
    pct >= 70 ? "var(--primary)" : pct >= 40 ? "var(--warning)" : "var(--text-muted)";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-sub)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs w-6 text-right" style={{ color: "var(--text-muted)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export function LPCard({ lp }: LPCardProps) {
  const gap = lp.price_gap;
  const gapClr = gapColor(gap);

  return (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)40")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")
      }
    >
      <div className="flex gap-4">
        {/* ── 좌측: 앨범 정보 ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 배지 행 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {lp.is_limited_edition && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "#78350f40", color: "#fcd34d", border: "1px solid #78350f" }}
              >
                LIMITED
              </span>
            )}
            {gap != null && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ color: gapClr, background: `${gapClr}18` }}
              >
                {gap > 0 ? "저평가" : gap < 0 ? "고평가" : "적정"}
              </span>
            )}
          </div>

          {/* 제목 */}
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: "var(--text-1)" }}
          >
            {lp.title}
          </p>

          {/* 아티스트 */}
          <p className="text-xs" style={{ color: "var(--text-2)" }}>
            {lp.artist}
          </p>

          {/* 연도 · 장르 뱃지 */}
          <div className="flex flex-wrap gap-1.5">
            {lp.year > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-sub)", color: "var(--text-muted)" }}
              >
                {lp.year}
              </span>
            )}
            {lp.genre && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-sub)", color: "var(--text-muted)" }}
              >
                {lp.genre}
              </span>
            )}
          </div>

          {/* Spotify 인기도 바 */}
          <div>
            <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
              Spotify 인기도
            </p>
            <PopularityBar value={lp.spotify_popularity} />
          </div>

          {/* 희소성 */}
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3" style={{ color: "var(--warning)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              희소성
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              {fmtRatio(lp.want_have_ratio)}
            </span>
          </div>
        </div>

        {/* ── 우측: 가격 정보 ──────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col items-end justify-between pl-4"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          <div className="space-y-2 text-right">
            <div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                현재가
              </p>
              <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>
                {fmtPrice(lp.lowest_price)}
              </p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                예측가
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                {fmtPrice(lp.predicted_price)}
              </p>
            </div>
          </div>

          {/* 가격 갭 강조 */}
          {gap != null && (
            <div
              className="mt-3 text-right text-xs font-bold px-2 py-1 rounded-lg"
              style={{ color: gapClr, background: `${gapClr}15` }}
            >
              <p className="text-[10px] font-normal opacity-70 mb-0.5">갭</p>
              {gap > 0 ? "+" : ""}
              {fmtPrice(gap)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
