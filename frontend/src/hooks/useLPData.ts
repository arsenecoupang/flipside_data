// src/hooks/useLPData.ts
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllLP,
  fetchLPStats,
  fetchTopGenres,
  fetchUndervaluedLP,
} from "@/api/lpApi";

const POLL = 10 * 60 * 1000; // 10분
const STALE = 9 * 60 * 1000; // 9분

/** /api/lp/stats — 대시보드 KPI + 장르 통계 */
export function useLPStats() {
  return useQuery({
    queryKey: ["lp", "stats"],
    queryFn: fetchLPStats,
    staleTime: STALE,
    refetchInterval: POLL,
  });
}

/** /api/lp/all — 전체 LP (차트용) */
export function useLPAll(limit = 500) {
  return useQuery({
    queryKey: ["lp", "all", limit],
    queryFn: () => fetchAllLP(0, limit),
    staleTime: STALE,
    refetchInterval: POLL,
  });
}

/** /api/lp/undervalued — 저평가 LP 테이블 */
export function useUndervalued(limit = 20) {
  return useQuery({
    queryKey: ["lp", "undervalued", limit],
    queryFn: () => fetchUndervaluedLP(limit),
    staleTime: STALE,
    refetchInterval: POLL,
  });
}

/** /api/lp/top-genres — 장르 순위 */
export function useTopGenres(limit = 8) {
  return useQuery({
    queryKey: ["lp", "top-genres", limit],
    queryFn: () => fetchTopGenres(limit),
    staleTime: STALE,
    refetchInterval: POLL,
  });
}
