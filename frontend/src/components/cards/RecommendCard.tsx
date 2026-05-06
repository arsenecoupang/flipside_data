// src/components/cards/RecommendCard.tsx
import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { fmtPrice, fmtRatio, popularityToColor } from "@/lib/utils";
import type { RecommendRecord } from "@/types";

interface RecommendCardProps {
  rec: RecommendRecord;
}

export function RecommendCard({ rec }: RecommendCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/artist/${encodeURIComponent(rec.recommended_artist)}`);
  };

  const popColor = popularityToColor(rec.spotify_popularity);
  const pct =
    rec.spotify_popularity != null
      ? Math.min(Math.max(rec.spotify_popularity, 0), 100)
      : 0;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="rounded-xl p-4 cursor-pointer shrink-0 w-56 space-y-3 transition-colors focus:outline-none"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)60";
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-sub)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
      }}
    >
      {/* 추천 이유 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {rec.input_artist}와 유사한 아티스트
        </span>
        <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--text-muted)" }} />
      </div>

      {/* 제목 · 아티스트 */}
      <div>
        <p
          className="text-sm font-semibold line-clamp-2 leading-snug"
          style={{ color: "var(--text-1)" }}
        >
          {rec.recommended_title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>
          {rec.recommended_artist}
        </p>
      </div>

      {/* 가격 */}
      <div className="flex justify-between text-xs">
        <div>
          <p style={{ color: "var(--text-muted)" }}>현재가</p>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            {fmtPrice(rec.lowest_price)}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: "var(--text-muted)" }}>예측가</p>
          <p className="font-semibold" style={{ color: "var(--text-2)" }}>
            {fmtPrice(rec.predicted_price)}
          </p>
        </div>
      </div>

      {/* Spotify 인기도 바 */}
      <div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "var(--bg-sub)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: popColor }}
          />
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          인기도 {rec.spotify_popularity ?? "—"}
        </p>
      </div>

      {/* 희소성 */}
      {rec.want_have_ratio != null && (
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3" style={{ color: "var(--warning)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            희소성 {fmtRatio(rec.want_have_ratio)}
          </span>
        </div>
      )}
    </div>
  );
}
