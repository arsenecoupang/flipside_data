# backend/models.py
"""프로젝트 전체에서 공유하는 Pydantic 응답 모델."""

from typing import Optional
from pydantic import BaseModel, Field


# ── LP ────────────────────────────────────────────────────────────────────────

class LPRecord(BaseModel):
    """lp_analysis_final.csv 한 행에 대응하는 모델."""

    release_id: int
    title: str
    artist: str
    year: int
    genre: Optional[str] = None
    have: int = 0
    want: int = 0
    want_have_ratio: Optional[float] = None
    is_limited_edition: bool = False
    spotify_popularity: Optional[float] = None
    lowest_price: Optional[float] = None
    predicted_price: Optional[float] = None
    price_gap: Optional[float] = None
    price_tier: Optional[str] = None


class LPListResponse(BaseModel):
    """LP 목록 응답."""

    data: list[LPRecord]
    total: int
    skip: int = 0
    limit: Optional[int] = None


# ── 통계 ──────────────────────────────────────────────────────────────────────

class GenreStat(BaseModel):
    """장르별 집계 통계."""

    genre: str
    count: int
    avg_price: Optional[float] = None
    avg_want_have_ratio: Optional[float] = None


class LPStats(BaseModel):
    """대시보드 요약 통계 응답."""

    total: int
    avg_price: Optional[float] = None
    avg_want_have_ratio: Optional[float] = None
    undervalued_count: int = Field(..., description="price_gap > 0 인 LP 수")
    limited_count: int
    genre_stats: list[GenreStat]


class TopGenreResponse(BaseModel):
    """장르 순위 응답."""

    data: list[GenreStat]
    total: int


# ── 추천 ──────────────────────────────────────────────────────────────────────

class RecommendRecord(BaseModel):
    """lp_recommendations.csv 한 행에 대응하는 모델."""

    input_artist: str
    recommended_title: str
    recommended_artist: str
    lowest_price: Optional[float] = None
    predicted_price: Optional[float] = None
    want_have_ratio: Optional[float] = None
    spotify_popularity: Optional[float] = None


class RecommendListResponse(BaseModel):
    """추천 LP 목록 응답."""

    data: list[RecommendRecord]
    total: int


# ── 아티스트 ──────────────────────────────────────────────────────────────────

class ArtistStats(BaseModel):
    """아티스트별 요약 통계 응답."""

    artist: str
    lp_count: int
    avg_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_spotify_popularity: Optional[float] = None
