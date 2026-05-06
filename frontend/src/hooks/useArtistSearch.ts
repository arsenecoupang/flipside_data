// src/hooks/useArtistSearch.ts
import { useQuery } from "@tanstack/react-query";
import {
  fetchArtistLPs,
  fetchArtistRecommendations,
  fetchArtistStats,
  searchArtist,
} from "@/api/lpApi";

const STALE = 5 * 60 * 1000;

/** /api/artist/search?q= — 부분 일치 검색 */
export function useArtistSearch(q: string) {
  return useQuery({
    queryKey: ["artist", "search", q],
    queryFn: () => searchArtist(q),
    enabled: q.trim().length >= 2,
    staleTime: STALE,
  });
}

/** /api/artist/{name}/lps */
export function useArtistLPs(artistName: string) {
  return useQuery({
    queryKey: ["artist", "lps", artistName],
    queryFn: () => fetchArtistLPs(artistName),
    enabled: artistName.trim().length >= 1,
    staleTime: STALE,
  });
}

/** /api/artist/{name}/recommendations */
export function useArtistRecommendations(artistName: string) {
  return useQuery({
    queryKey: ["artist", "recommendations", artistName],
    queryFn: () => fetchArtistRecommendations(artistName),
    enabled: artistName.trim().length >= 1,
    staleTime: STALE,
  });
}

/** /api/artist/{name}/stats */
export function useArtistStats(artistName: string) {
  return useQuery({
    queryKey: ["artist", "stats", artistName],
    queryFn: () => fetchArtistStats(artistName),
    enabled: artistName.trim().length >= 1,
    staleTime: STALE,
  });
}
