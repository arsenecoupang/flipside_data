# backend/routers/artist.py
"""
/api/artist 라우터.

NOTE: /search 처럼 고정된 경로 세그먼트는
      /{artist_name}/... 보다 먼저 선언해야 한다.
"""

from fastapi import APIRouter, HTTPException, Query

from models import ArtistStats, LPListResponse, LPRecord, RecommendListResponse
from services.data_service import (
    get_artist_stats,
    get_lp_by_artist,
    get_recommendations,
    search_by_artist,
)

router = APIRouter()


# ── GET /api/artist/search ────────────────────────────────────────────────────

@router.get(
    "/search",
    response_model=LPListResponse,
    summary="아티스트 검색",
    description="아티스트명 부분 일치로 LP를 검색한다 (최대 50개).",
)
def search(
    q: str = Query(..., min_length=2, description="검색할 아티스트 이름 (2자 이상)"),
    limit: int = Query(50, ge=1, le=200, description="반환할 최대 행 수"),
):
    """
    아티스트명 부분 일치 검색으로 LP 목록을 반환한다.

    Args:
        q: 검색 키워드 (2자 이상, 대소문자 무시).
        limit: 반환할 최대 행 수 (기본 50).

    Returns:
        LPListResponse: 일치하는 LP 목록 (price_gap 내림차순).
    """
    results = search_by_artist(q)
    paged = results[:limit]
    return LPListResponse(data=paged, total=len(results), skip=0, limit=limit)


# ── GET /api/artist/{artist_name}/lps ────────────────────────────────────────

@router.get(
    "/{artist_name}/lps",
    response_model=LPListResponse,
    summary="아티스트 LP 전체 조회",
    description="특정 아티스트의 모든 LP를 반환한다.",
)
def get_artist_lps(artist_name: str):
    """
    아티스트 이름과 정확히 일치하는 LP 목록을 반환한다 (대소문자 무시).

    Args:
        artist_name: URL 경로에 포함된 아티스트 이름.

    Returns:
        LPListResponse: 해당 아티스트의 LP 목록.
    Raises:
        HTTPException 404: LP가 전혀 없는 경우.
    """
    results = get_lp_by_artist(artist_name)
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"아티스트 '{artist_name}'의 LP를 찾을 수 없습니다.",
        )
    return LPListResponse(data=results, total=len(results))


# ── GET /api/artist/{artist_name}/recommendations ─────────────────────────────

@router.get(
    "/{artist_name}/recommendations",
    response_model=RecommendListResponse,
    summary="아티스트 팬을 위한 추천 LP",
    description="해당 아티스트 팬에게 추천할 LP 목록을 반환한다.",
)
def get_artist_recommendations(artist_name: str):
    """
    특정 아티스트 팬을 위한 추천 LP를 반환한다.

    추천 데이터는 lp_recommendations.csv에서 input_artist 컬럼으로 조회한다.

    Args:
        artist_name: URL 경로에 포함된 아티스트 이름.

    Returns:
        RecommendListResponse: want_have_ratio 내림차순 추천 목록.
    Raises:
        HTTPException 404: 추천 데이터가 없는 경우.
    """
    results = get_recommendations(artist_name)
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"아티스트 '{artist_name}'에 대한 추천 LP가 없습니다.",
        )
    return RecommendListResponse(data=results, total=len(results))


# ── GET /api/artist/{artist_name}/stats ──────────────────────────────────────

@router.get(
    "/{artist_name}/stats",
    response_model=ArtistStats,
    summary="아티스트 요약 통계",
    description="보유 LP 수, 평균가, 최고가, 평균 Spotify 인기도를 반환한다.",
)
def get_stats(artist_name: str):
    """
    아티스트별 요약 통계를 반환한다.

    Args:
        artist_name: URL 경로에 포함된 아티스트 이름.

    Returns:
        ArtistStats: 보유 LP 수, 평균가, 최고가, 평균 Spotify 인기도.
    Raises:
        HTTPException 404: 해당 아티스트 LP가 없는 경우.
    """
    return get_artist_stats(artist_name)
