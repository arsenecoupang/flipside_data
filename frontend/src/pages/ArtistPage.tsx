// src/pages/ArtistPage.tsx
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Clock,
  Disc3,
  DollarSign,
  Search,
  Star,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LPCard } from "@/components/cards/LPCard";
import { RecommendCard } from "@/components/cards/RecommendCard";
import { PriceDistributionChart } from "@/components/charts/PriceDistributionChart";
import {
  useArtistLPs,
  useArtistRecommendations,
  useArtistSearch,
  useArtistStats,
} from "@/hooks/useArtistSearch";
import { fmtNumber, fmtPrice } from "@/lib/utils";
import type { LPRecord } from "@/types";

// ── LocalStorage 최근 검색 관리 ───────────────────────────────────────────────

const RECENT_KEY = "flipside_recent_artists";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addToRecent(artist: string): void {
  const recent = getRecent().filter(
    (a) => a.toLowerCase() !== artist.toLowerCase()
  );
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([artist, ...recent].slice(0, MAX_RECENT))
  );
}

function removeFromRecent(artist: string): void {
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(getRecent().filter((a) => a !== artist))
  );
}

// ── 정렬 유틸 ─────────────────────────────────────────────────────────────────

type SortKey = "price" | "ratio" | "year";

function sortLPs(lps: LPRecord[], key: SortKey): LPRecord[] {
  return [...lps].sort((a, b) => {
    switch (key) {
      case "price":
        return (a.lowest_price ?? Infinity) - (b.lowest_price ?? Infinity);
      case "ratio":
        return (b.want_have_ratio ?? 0) - (a.want_have_ratio ?? 0);
      case "year":
        return b.year - a.year;
    }
  });
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

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

function KpiBox({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <span style={{ color: "var(--primary)" }}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" style={{ background: "var(--bg-sub)" }} />
      ) : (
        <p className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
          {value}
        </p>
      )}
    </div>
  );
}

// ── 빈 상태: 검색 유도 ────────────────────────────────────────────────────────

function EmptyState({ onSelect }: { onSelect: (artist: string) => void }) {
  const [recent, setRecent] = useState<string[]>(getRecent);

  const handleRemove = (artist: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromRecent(artist);
    setRecent(getRecent());
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div
        className="rounded-full p-6"
        style={{ background: "var(--bg-card)" }}
      >
        <Search className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-base font-semibold" style={{ color: "var(--text-2)" }}>
          아티스트 이름을 입력하세요
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          보유 LP 목록, 가격 분석, 추천 LP를 확인할 수 있습니다
        </p>
      </div>

      {recent.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          <p
            className="text-xs uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock className="w-3 h-3" /> 최근 검색
          </p>
          <div className="space-y-1">
            {recent.map((artist) => (
              <div
                key={artist}
                className="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                onClick={() => onSelect(artist)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--primary)50")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)")
                }
              >
                <div className="flex items-center gap-2.5">
                  <Disc3 className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                  <span className="text-sm" style={{ color: "var(--text-2)" }}>
                    {artist}
                  </span>
                </div>
                <button
                  onClick={(e) => handleRemove(artist, e)}
                  className="p-0.5 rounded transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "var(--danger)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      "var(--text-muted)")
                  }
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 결과 없을 때: 검색 제안 ───────────────────────────────────────────────────

function NoResultsSuggestion({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (artist: string) => void;
}) {
  const searchQ = useArtistSearch(query);
  const suggestions = useMemo(
    () =>
      [
        ...new Set(
          (searchQ.data?.data ?? []).map((lp) => lp.artist)
        ),
      ].slice(0, 3),
    [searchQ.data]
  );

  return (
    <div className="flex flex-col items-center py-16 gap-4">
      <AlertCircle className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-2)" }}>
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>
          '{query}'
        </span>{" "}
        아티스트의 LP가 없습니다
      </p>

      {suggestions.length > 0 && (
        <div className="space-y-2 w-full max-w-xs">
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            비슷한 검색어
          </p>
          {suggestions.map((artist) => (
            <button
              key={artist}
              onClick={() => onSelect(artist)}
              className="w-full rounded-lg px-4 py-2 text-sm text-left transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--primary)",
              }}
            >
              {artist}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function ArtistPage() {
  const { artistName } = useParams<{ artistName?: string }>();
  const navigate = useNavigate();

  const decoded = artistName ? decodeURIComponent(artistName) : "";

  // 검색바 로컬 상태
  const [searchVal, setSearchVal] = useState(decoded);
  const inputRef = useRef<HTMLInputElement>(null);

  // 정렬
  const [sortKey, setSortKey] = useState<SortKey>("price");

  // 데이터 훅
  const statsQ = useArtistStats(decoded);
  const lpsQ   = useArtistLPs(decoded);
  const recQ   = useArtistRecommendations(decoded);

  const stats = statsQ.data;
  const lps   = lpsQ.data?.data ?? [];
  const recs  = recQ.data?.data ?? [];

  const sortedLPs = useMemo(() => sortLPs(lps, sortKey), [lps, sortKey]);

  // 아티스트가 성공적으로 로드되면 최근 검색에 추가
  const wasAdded = useRef(false);
  if (decoded && lps.length > 0 && !wasAdded.current) {
    addToRecent(decoded);
    wasAdded.current = true;
  }

  // 검색 실행
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (q.length >= 1) navigate(`/artist/${encodeURIComponent(q)}`);
  };

  // 아티스트 선택 (EmptyState / Suggestion 에서)
  const handleSelect = (artist: string) => {
    setSearchVal(artist);
    navigate(`/artist/${encodeURIComponent(artist)}`);
  };

  const isLoading = lpsQ.isLoading || statsQ.isLoading;
  const hasData   = !isLoading && lps.length > 0;
  const noResults = !isLoading && decoded && lps.length === 0 && !lpsQ.isError;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-root)" }}>

      {/* ── 헤더 네비게이션 ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6"
        style={{
          background: "rgba(15,15,15,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center h-14 gap-3">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm shrink-0 transition-colors"
            style={{ color: "var(--text-2)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)")
            }
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">대시보드로</span>
          </button>

          <div
            className="h-4 w-px"
            style={{ background: "var(--border)" }}
          />

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div
              className="flex items-center gap-2 rounded-lg px-3 h-8"
              style={{ background: "var(--bg-sub)", border: "1px solid var(--border)" }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="아티스트 검색..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => { setSearchVal(""); inputRef.current?.focus(); }}
                >
                  <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          </form>
        </div>
      </header>

      {/* ── 본문 ─────────────────────────────────────────────────────── */}
      <main className="px-6 py-6 max-w-screen-2xl mx-auto space-y-8">

        {/* 검색어 없음 → 검색 유도 */}
        {!decoded && (
          <EmptyState onSelect={handleSelect} />
        )}

        {/* 검색 결과 없음 */}
        {noResults && (
          <NoResultsSuggestion query={decoded} onSelect={handleSelect} />
        )}

        {/* 로딩 */}
        {decoded && isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" style={{ background: "var(--bg-card)" }} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" style={{ background: "var(--bg-card)" }} />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" style={{ background: "var(--bg-card)" }} />
          </div>
        )}

        {/* ─ 데이터 있을 때 ───────────────────────────────────────────── */}
        {hasData && (
          <>
            {/* ── 섹션 A: 아티스트 요약 헤더 ───────────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: "var(--bg-sub)" }}
                >
                  <Disc3 className="w-5 h-5" style={{ color: "var(--primary)" }} />
                </div>
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ color: "var(--text-1)" }}
                >
                  {decoded}
                </h1>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiBox
                  label="보유 LP"
                  value={stats ? `${fmtNumber(stats.lp_count)}개` : "—"}
                  icon={<Disc3 className="w-4 h-4" />}
                  loading={statsQ.isLoading}
                />
                <KpiBox
                  label="평균가"
                  value={stats ? fmtPrice(stats.avg_price) : "—"}
                  icon={<DollarSign className="w-4 h-4" />}
                  loading={statsQ.isLoading}
                />
                <KpiBox
                  label="최고가"
                  value={stats ? fmtPrice(stats.max_price) : "—"}
                  icon={<BarChart3 className="w-4 h-4" />}
                  loading={statsQ.isLoading}
                />
                <KpiBox
                  label="평균 인기도"
                  value={
                    stats?.avg_spotify_popularity != null
                      ? stats.avg_spotify_popularity.toFixed(0)
                      : "—"
                  }
                  icon={<Star className="w-4 h-4" />}
                  loading={statsQ.isLoading}
                />
              </div>
            </section>

            {/* ── 섹션 B: 가격 분포 + LP 목록 ────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 가격 분포 차트 */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <p
                  className="text-sm font-semibold mb-4"
                  style={{ color: "var(--text-2)" }}
                >
                  가격 분포 (현재가 vs 예측가)
                </p>
                <PriceDistributionChart data={lps} loading={lpsQ.isLoading} />
              </div>

              {/* LP 목록 */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                    LP 목록
                    <span
                      className="ml-2 text-xs font-normal"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {sortedLPs.length}개
                    </span>
                  </p>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="text-xs rounded-lg px-2 py-1 outline-none"
                    style={{
                      background: "var(--bg-sub)",
                      border: "1px solid var(--border)",
                      color: "var(--text-2)",
                    }}
                  >
                    <option value="price">가격순</option>
                    <option value="ratio">희소성순</option>
                    <option value="year">연도순</option>
                  </select>
                </div>

                <div
                  className="overflow-y-auto space-y-3 pr-1"
                  style={{ maxHeight: "600px" }}
                >
                  {sortedLPs.map((lp) => (
                    <LPCard key={lp.release_id} lp={lp} />
                  ))}
                </div>
              </div>
            </section>

            {/* ── 섹션 C: 추천 LP ─────────────────────────────────── */}
            <section>
              <SectionTitle>이 아티스트를 좋아한다면</SectionTitle>

              {recQ.isLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="shrink-0 w-56 h-48 rounded-xl"
                      style={{ background: "var(--bg-card)" }}
                    />
                  ))}
                </div>
              ) : recs.length === 0 ? (
                <div
                  className="flex items-center justify-center py-8 gap-2 text-sm rounded-xl"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <AlertCircle className="w-4 h-4 opacity-50" />
                  추천 데이터가 없습니다
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
                  {recs.slice(0, 10).map((rec, i) => (
                    <RecommendCard key={i} rec={rec} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
