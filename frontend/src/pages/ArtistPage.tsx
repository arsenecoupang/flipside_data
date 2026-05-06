// src/pages/ArtistPage.tsx
import { useState } from "react";
import { ArrowLeft, Disc3, Music, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArtistLPs,
  useArtistRecommendations,
  useArtistSearch,
  useArtistStats,
} from "@/hooks/useArtistSearch";
import { fmtPrice, fmtRatio, gapColor } from "@/lib/utils";
import type { LPRecord, RecommendRecord } from "@/types";

// ── 서브 컴포넌트 ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </h2>
  );
}

function LPRow({ lp, rank }: { lp: LPRecord; rank: number }) {
  const gap = lp.price_gap;
  const color = gapColor(gap);
  return (
    <div
      className="flex items-center px-4 py-3 gap-3 transition-colors"
      style={{ borderBottom: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sub)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span className="w-8 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
        {rank}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
          {lp.title}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {lp.year}년{lp.genre ? ` · ${lp.genre}` : ""}
        </span>
      </span>
      <span className="w-24 text-sm text-right shrink-0" style={{ color: "var(--text-1)" }}>
        {fmtPrice(lp.lowest_price)}
      </span>
      <span className="w-24 text-sm text-right shrink-0" style={{ color: "var(--text-2)" }}>
        {fmtPrice(lp.predicted_price)}
      </span>
      <span className="w-24 text-right shrink-0">
        {gap != null ? (
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
            style={{ color, background: `${color}18` }}
          >
            {gap > 0 ? "+" : ""}{fmtPrice(gap)}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>N/A</span>
        )}
      </span>
      <span className="w-16 text-sm text-right shrink-0" style={{ color: "var(--text-muted)" }}>
        {fmtRatio(lp.want_have_ratio)}
      </span>
    </div>
  );
}

function RecRow({ rec, index }: { rec: RecommendRecord; index: number }) {
  return (
    <div
      className="flex items-center px-4 py-3 gap-3 transition-colors"
      style={{ borderBottom: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-sub)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span className="w-8 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
        {index + 1}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
          {rec.recommended_title}
        </span>
        <span className="text-xs" style={{ color: "var(--text-2)" }}>
          {rec.recommended_artist}
        </span>
      </span>
      <span className="w-24 text-sm text-right shrink-0" style={{ color: "var(--text-1)" }}>
        {fmtPrice(rec.lowest_price)}
      </span>
      <span className="w-20 text-sm text-right shrink-0" style={{ color: "var(--text-muted)" }}>
        희소성 {fmtRatio(rec.want_have_ratio)}
      </span>
      {rec.spotify_popularity != null && (
        <span className="w-16 text-right text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          ♪ {rec.spotify_popularity}
        </span>
      )}
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

function ColHeader({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-wider ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      {label}
    </span>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

interface ArtistPageProps {
  artistName: string;
  onBack: () => void;
}

export function ArtistPage({ artistName, onBack }: ArtistPageProps) {
  const [searchVal, setSearchVal] = useState(artistName);
  const [submitted, setSubmitted] = useState(artistName);

  const statsQ = useArtistStats(submitted);
  const lpsQ = useArtistLPs(submitted);
  const recQ = useArtistRecommendations(submitted);
  useArtistSearch(submitted); // prefetch

  const stats = statsQ.data;
  const lps = lpsQ.data?.data ?? [];
  const recs = recQ.data?.data ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (q.length >= 2) setSubmitted(q);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-root)" }}>
      {/* 헤더 */}
      <header
        className="sticky top-0 z-50 px-6"
        style={{
          background: "rgba(15,15,15,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center h-14 gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--text-2)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)")
            }
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드
          </button>

          <div
            className="h-4 w-px mx-1"
            style={{ background: "var(--border)" }}
          />

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div
              className="flex items-center gap-2 rounded-lg px-3 h-8"
              style={{ background: "var(--bg-sub)", border: "1px solid var(--border)" }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="다른 아티스트 검색..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
              />
            </div>
          </form>
        </div>
      </header>

      {/* 본문 */}
      <main className="px-6 py-6 space-y-8 max-w-screen-2xl mx-auto">
        {/* 아티스트 요약 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "var(--bg-sub)" }}
            >
              <Disc3 className="w-5 h-5" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
                {submitted}
              </h1>
              {stats && (
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  {stats.lp_count}개 LP · 평균 {fmtPrice(stats.avg_price)} ·
                  최고 {fmtPrice(stats.max_price)}
                  {stats.avg_spotify_popularity != null &&
                    ` · Spotify 인기도 ${stats.avg_spotify_popularity.toFixed(0)}`}
                </p>
              )}
              {statsQ.isLoading && (
                <Skeleton className="h-4 w-64 mt-1" style={{ background: "var(--bg-sub)" }} />
              )}
              {statsQ.isError && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  아티스트를 찾을 수 없습니다.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 보유 LP 테이블 */}
        <section>
          <SectionTitle>
            보유 LP {lpsQ.isLoading ? "" : `(${lps.length}개)`}
          </SectionTitle>
          <TableShell>
            {/* 컬럼 헤더 */}
            <div
              className="flex items-center px-4 py-2.5 gap-3"
              style={{ background: "var(--bg-sub)", borderBottom: "1px solid var(--border)" }}
            >
              <ColHeader label="#" className="w-8 shrink-0" />
              <ColHeader label="앨범" className="flex-1" />
              <ColHeader label="현재가" className="w-24 text-right shrink-0" />
              <ColHeader label="예측가" className="w-24 text-right shrink-0" />
              <ColHeader label="갭" className="w-24 text-right shrink-0" />
              <ColHeader label="희소성" className="w-16 text-right shrink-0" />
            </div>

            {lpsQ.isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" style={{ background: "var(--bg-sub)" }} />
                ))}
              </div>
            ) : !lps.length ? (
              <div
                className="flex items-center justify-center py-12 gap-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <Music className="w-5 h-5 opacity-40" />
                <span>LP가 없습니다</span>
              </div>
            ) : (
              lps.map((lp, i) => <LPRow key={lp.release_id} lp={lp} rank={i + 1} />)
            )}
          </TableShell>
        </section>

        {/* 추천 LP */}
        <section>
          <SectionTitle>
            유사 아티스트 추천 {recQ.isLoading ? "" : `(${recs.length}개)`}
          </SectionTitle>
          <TableShell>
            <div
              className="flex items-center px-4 py-2.5 gap-3"
              style={{ background: "var(--bg-sub)", borderBottom: "1px solid var(--border)" }}
            >
              <ColHeader label="#" className="w-8 shrink-0" />
              <ColHeader label="앨범 / 아티스트" className="flex-1" />
              <ColHeader label="현재가" className="w-24 text-right shrink-0" />
              <ColHeader label="희소성" className="w-20 text-right shrink-0" />
              <ColHeader label="인기도" className="w-16 text-right shrink-0" />
            </div>

            {recQ.isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" style={{ background: "var(--bg-sub)" }} />
                ))}
              </div>
            ) : !recs.length ? (
              <div
                className="flex items-center justify-center py-12 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                추천 LP가 없습니다
              </div>
            ) : (
              recs.map((rec, i) => <RecRow key={i} rec={rec} index={i} />)
            )}
          </TableShell>
        </section>
      </main>
    </div>
  );
}
