// src/api/lpApi.ts
import axiosInstance from "./axiosInstance";
import type {
  ApiListResponse,
  ArtistStats,
  GenreStat,
  LPRecord,
  LPStats,
  RecommendRecord,
} from "@/types";

/** GET /api/lp/stats — 대시보드 요약 통계 */
export async function fetchLPStats(): Promise<LPStats> {
  const { data } = await axiosInstance.get<LPStats>("/api/lp/stats");
  return data;
}

/** GET /api/lp/all — 전체 LP 목록 (페이지네이션) */
export async function fetchAllLP(
  skip = 0,
  limit = 500
): Promise<ApiListResponse<LPRecord>> {
  const { data } = await axiosInstance.get<ApiListResponse<LPRecord>>(
    "/api/lp/all",
    { params: { skip, limit } }
  );
  return data;
}

/** GET /api/lp/undervalued — 저평가 LP (price_gap > 0) */
export async function fetchUndervaluedLP(
  limit = 20
): Promise<ApiListResponse<LPRecord>> {
  const { data } = await axiosInstance.get<ApiListResponse<LPRecord>>(
    "/api/lp/undervalued",
    { params: { limit } }
  );
  return data;
}

/** GET /api/lp/top-genres — 장르별 통계 순위 */
export async function fetchTopGenres(
  limit = 10
): Promise<ApiListResponse<GenreStat>> {
  const { data } = await axiosInstance.get<ApiListResponse<GenreStat>>(
    "/api/lp/top-genres",
    { params: { limit } }
  );
  return data;
}

/** GET /api/artist/search?q= — 아티스트 부분 일치 검색 */
export async function searchArtist(
  query: string
): Promise<ApiListResponse<LPRecord>> {
  const { data } = await axiosInstance.get<ApiListResponse<LPRecord>>(
    "/api/artist/search",
    { params: { q: query } }
  );
  return data;
}

/** GET /api/artist/{name}/lps — 아티스트 전체 LP */
export async function fetchArtistLPs(
  artistName: string
): Promise<ApiListResponse<LPRecord>> {
  const { data } = await axiosInstance.get<ApiListResponse<LPRecord>>(
    `/api/artist/${encodeURIComponent(artistName)}/lps`
  );
  return data;
}

/** GET /api/artist/{name}/recommendations — 아티스트 팬 추천 LP */
export async function fetchArtistRecommendations(
  artistName: string
): Promise<ApiListResponse<RecommendRecord>> {
  const { data } = await axiosInstance.get<ApiListResponse<RecommendRecord>>(
    `/api/artist/${encodeURIComponent(artistName)}/recommendations`
  );
  return data;
}

/** GET /api/artist/{name}/stats — 아티스트 요약 통계 */
export async function fetchArtistStats(artistName: string): Promise<ArtistStats> {
  const { data } = await axiosInstance.get<ArtistStats>(
    `/api/artist/${encodeURIComponent(artistName)}/stats`
  );
  return data;
}
