// src/pages/DashboardPage.tsx
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  Disc3,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { StatCard } from "@/components/cards/StatCard";
import { GenreBarChart } from "@/components/charts/GenreBarChart";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useLPAll, useLPStats, useUndervalued } from "@/hooks/useLPData";
import { fmtNumber, fmtPrice, fmtRatio, gapColor } from "@/lib/utils";
import type { LPRecord } from "@/types";

// ── 카운트다운 훅 ──────────────────────────────────────────────────────────────

const POLL_MS = 10 * 60 * 1000;

function useCountdown(dataUpdatedAt: number) {
  const [label, setLabel] = useState("--:--");

  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => {
      const ms = Math.max(0, dataUpdatedAt + POLL_MS - Date.now());
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  return label;
}

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

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-2)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function GapBadge({ gap }: { gap: number | null }) {
  if (gap == null) return <span style={{ color: "var(--text-muted)" }}>N/A</span>;
  const color = gapColor(gap);
  const sign = gap > 0 ? "+" : "";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color, background: `${color}18` }}
    >
      {sign}
      {fmtPrice(gap)}
    </span>
  );
}

function UndervaluedTable({
  data,
  loading,
  onArtistClick,
}: {
  data: LPRecord[];
  loading: boolean;
  onArtistClick: (artist: string) => void;
}) {
  const cols = [
    { key: "rank", label: "#", width: "w-10" },
    { key: "title", label: "앨범", width: "flex-1 min-w-0" },
    { key: "artist", label: "아티스트", width: "w-36" },
    { key: "lowest_price", label: "현재가", width: "w-24 text-right" },
    { key: "predicted_price", label: "예측가", width: "w-24 text-right" },
    { key: "price_gap", label: "가격 갭", width: "w-28 text-right" },
    { key: "want_have_ratio", label: "희소성", width: "w-20 text-right" },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center px-4 py-2.5 gap-3 text-xs font-semibold uppercase tracking-wider"
        style={{
          color: "var(--text-muted)",
          background: "var(--bg-sub)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {cols.map((c) => (
          <span key={c.key} className={c.width}>
            {c.label}
          </span>
        ))}
      </div>

      {/* 바디 */}
      {loading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-full"
              style={{ background: "var(--bg-sub)" }}
            />
          ))}
        </div>
      ) : !data.length ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-2"
          style={{ color: "var(--text-muted)" }}
        >
          <AlertCircle className="w-8 h-8 opacity-40" />
          <p className="text-sm">저평가 LP가 없습니다</p>
        </div>
      ) : (
        data.map((lp, i) => (
          <div
            key={lp.release_id}
            className="flex items-center px-4 py-3 gap-3 cursor-pointer transition-colors"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-sub)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            onClick={() => onArtistClick(lp.artist)}
          >
            <span className="w-10 text-xs" style={{ color: "var(--text-muted)" }}>
              {i + 1}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className="block text-sm font-medium truncate"
                style={{ color: "var(--text-1)" }}
              >
                {lp.title}
              </span>
            </span>
            <span className="w-36 text-sm truncate" style={{ color: "var(--text-2)" }}>
              {lp.artist}
            </span>
            <span
              className="w-24 text-sm text-right"
              style={{ color: "var(--text-1)" }}
            >
              {fmtPrice(lp.lowest_price)}
            </span>
            <span
              className="w-24 text-sm text-right"
              style={{ color: "var(--text-2)" }}
            >
              {fmtPrice(lp.predicted_price)}
            </span>
            <span className="w-28 text-right">
              <GapBadge gap={lp.price_gap} />
            </span>
            <span
              className="w-20 text-sm text-right"
              style={{ color: "var(--text-2)" }}
            >
              {fmtRatio(lp.want_have_ratio)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onArtistClick: (artist: string) => void;
}

export function DashboardPage({ onArtistClick }: DashboardPageProps) {
  const queryClient = useQueryClient();

  const statsQuery = useLPStats();
  const allQuery = useLPAll(500);
  const undervaluedQuery = useUndervalued(20);

  const countdown = useCountdown(statsQuery.dataUpdatedAt);
  const lastUpdated = statsQuery.dataUpdatedAt
    ? new Date(statsQuery.dataUpdatedAt).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const [searchVal, setSearchVal] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (q.length >= 2) onArtistClick(q);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const stats = statsQuery.data;
  const allLPs = allQuery.data?.data ?? [];
  const undervalued = undervaluedQuery.data?.data ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-root)" }}>
      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6"
        style={{
          background: "rgba(15,15,15,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center h-14 gap-4">
          {/* 로고 */}
          <div className="flex items-center gap-2 shrink-0">
            <Disc3 className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <span
              className="text-base font-black tracking-[0.2em] uppercase"
              style={{ color: "var(--text-1)" }}
            >
              Flipside
            </span>
          </div>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
            <div
              className="flex items-center gap-2 rounded-lg px-3 h-8"
              style={{ background: "var(--bg-sub)", border: "1px solid var(--border)" }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                ref={searchRef}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="아티스트 검색 (Enter)"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
              />
            </div>
          </form>

          {/* 업데이트 정보 */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {lastUpdated && (
              <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
                {lastUpdated} 업데이트 · 다음{" "}
                <span style={{ color: "var(--text-2)" }}>{countdown}</span>
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg px-3 h-8 text-xs font-medium transition-colors"
              style={{
                background: "var(--bg-sub)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-2)")
              }
            >
              <RefreshCw className="w-3 h-3" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      {/* ── 본문 ─────────────────────────────────────────────────────────── */}
      <main className="px-6 py-6 space-y-8 max-w-screen-2xl mx-auto">
        {/* KPI 카드 */}
        <section>
          <SectionTitle>핵심 지표</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="총 보유 LP"
              value={stats ? fmtNumber(stats.total) + "개" : "—"}
              subtitle="전체 재고"
              icon={<Disc3 className="w-4 h-4" />}
              loading={statsQuery.isLoading}
              error={statsQuery.isError}
              onRetry={() => statsQuery.refetch()}
            />
            <StatCard
              title="평균 재판매가"
              value={stats ? fmtPrice(stats.avg_price) : "—"}
              subtitle="lowest_price 기준"
              icon={<DollarSign className="w-4 h-4" />}
              loading={statsQuery.isLoading}
              error={statsQuery.isError}
              onRetry={() => statsQuery.refetch()}
            />
            <StatCard
              title="저평가 LP"
              value={stats ? fmtNumber(stats.undervalued_count) + "개" : "—"}
              subtitle="예측가 > 현재가"
              icon={<TrendingUp className="w-4 h-4" />}
              loading={statsQuery.isLoading}
              error={statsQuery.isError}
              onRetry={() => statsQuery.refetch()}
            />
            <StatCard
              title="평균 희소성"
              value={stats ? fmtRatio(stats.avg_want_have_ratio) : "—"}
              subtitle="want / have 비율"
              icon={<BarChart3 className="w-4 h-4" />}
              loading={statsQuery.isLoading}
              error={statsQuery.isError}
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        </section>

        {/* 차트 2열 */}
        <section>
          <SectionTitle>데이터 분석</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="장르별 평균 재판매가">
              <GenreBarChart
                data={stats?.genre_stats ?? []}
                loading={statsQuery.isLoading}
              />
            </ChartCard>
            <ChartCard title="희소성 vs 가격 분포">
              <ScatterPlot
                data={allLPs}
                loading={allQuery.isLoading}
              />
            </ChartCard>
          </div>
        </section>

        {/* 연도별 추세 (전체 너비) */}
        <section>
          <ChartCard title="발매 연도별 평균 재판매가 추세">
            <TrendLineChart
              data={allLPs}
              avgPrice={stats?.avg_price}
              loading={allQuery.isLoading}
            />
          </ChartCard>
        </section>

        {/* 저평가 LP 테이블 */}
        <section>
          <SectionTitle>
            저평가 LP TOP {undervalued.length} · 클릭하면 아티스트 상세 페이지로 이동
          </SectionTitle>
          <UndervaluedTable
            data={undervalued}
            loading={undervaluedQuery.isLoading}
            onArtistClick={onArtistClick}
          />
        </section>
      </main>
    </div>
  );
}
