// src/types/index.ts

export interface LPRecord {
  release_id: number;
  title: string;
  artist: string;
  year: number;
  genre: string | null;
  have: number;
  want: number;
  want_have_ratio: number | null;
  is_limited_edition: boolean;
  spotify_popularity: number | null;
  lowest_price: number | null;
  predicted_price: number | null;
  price_gap: number | null;
  price_tier: "low" | "mid" | "high" | null;
}

export interface GenreStat {
  genre: string;
  count: number;
  avg_price: number | null;
  avg_want_have_ratio: number | null;
}

export interface LPStats {
  total: number;
  avg_price: number | null;
  avg_want_have_ratio: number | null;
  undervalued_count: number;
  limited_count: number;
  genre_stats: GenreStat[];
}

export interface RecommendRecord {
  input_artist: string;
  recommended_title: string;
  recommended_artist: string;
  lowest_price: number | null;
  predicted_price: number | null;
  want_have_ratio: number | null;
  spotify_popularity: number | null;
}

export interface ArtistStats {
  artist: string;
  lp_count: number;
  avg_price: number | null;
  max_price: number | null;
  avg_spotify_popularity: number | null;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  skip?: number;
  limit?: number;
}
