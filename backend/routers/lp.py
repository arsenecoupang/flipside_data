# backend/routers/lp.py
"""
/api/lp 라우터.

NOTE: FastAPI는 경로를 선언 순서대로 매칭하므로
      /all, /stats, /undervalued, /top-genres 는
      /{release_id} 보다 반드시 먼저 선언해야 한다.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models import LPListResponse, LPRecord, LPStats, TopGenreResponse
from services.data_service import get_all_lp, get_lp_stats

router = APIRouter()


# ── GET /api/lp/all ───────────────────────────────────────────────────────────

@router.get(
    "/all",
    response_model=LPListResponse,
    summary="전체 LP 목록",
    description="페이지네이션(skip/limit)을 지원하는 전체 LP 목록을 반환한다.",
)
def get_lp_all(
    skip: int = Query(0, ge=0, description="건너뛸 행 수"),
    limit: int = Query(100, ge=1, le=500, description="반환할 최대 행 수"),
):
    """
    전체 LP 목록을 반환한다.

    Args:
        skip: 건너뛸 행 수 (기본 0).
        limit: 반환할 최대 행 수 (기본 100, 최대 500).

    Returns:
        LPListResponse: data 리스트, total 전체 수, skip, limit 포함.
    """
    df = get_all_lp()
    total = len(df)
    page = df.iloc[skip : skip + limit]

    records = [LPRecord(**{k: (None if str(v) == "nan" else v) for k, v in row.items()})
               for _, row in page.iterrows()]
    return LPListResponse(data=records, total=total, skip=skip, limit=limit)


# ── GET /api/lp/stats ─────────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=LPStats,
    summary="대시보드 요약 통계",
    description="총 LP 수, 평균가, 저평가 LP 수, 장르별 통계를 반환한다.",
)
def get_stats():
    """
    대시보드에서 사용하는 요약 통계를 반환한다.

    Returns:
        LPStats: 전체 집계 + 장르별 세부 통계.
    """
    return get_lp_stats()


# ── GET /api/lp/undervalued ───────────────────────────────────────────────────

@router.get(
    "/undervalued",
    response_model=LPListResponse,
    summary="저평가 LP 목록",
    description="price_gap > 0 인 LP를 price_gap 내림차순으로 최대 20개 반환한다.",
)
def get_undervalued(
    limit: int = Query(20, ge=1, le=100, description="반환할 최대 행 수"),
):
    """
    저평가 LP(예측가 > 현재가) 목록을 반환한다.

    Args:
        limit: 반환할 최대 행 수 (기본 20).

    Returns:
        LPListResponse: price_gap 내림차순 정렬된 LP 목록.
    """
    df = get_all_lp()
    filtered = (
        df[df["price_gap"].fillna(0) > 0]
        .sort_values("price_gap", ascending=False)
        .head(limit)
    )

    if filtered.empty:
        return LPListResponse(data=[], total=0, skip=0, limit=limit)

    records = [LPRecord(**{k: (None if str(v) == "nan" else v) for k, v in row.items()})
               for _, row in filtered.iterrows()]
    return LPListResponse(data=records, total=len(records), skip=0, limit=limit)


# ── GET /api/lp/top-genres ────────────────────────────────────────────────────

@router.get(
    "/top-genres",
    response_model=TopGenreResponse,
    summary="장르별 통계 순위",
    description="장르별 평균 가격·LP 수·평균 want_have_ratio를 평균가 내림차순으로 반환한다.",
)
def get_top_genres(
    limit: int = Query(10, ge=1, le=50, description="반환할 장르 수"),
):
    """
    장르별 집계 통계를 반환한다.

    Args:
        limit: 반환할 장르 수 (기본 10).

    Returns:
        TopGenreResponse: 평균가 내림차순 GenreStat 목록.
    """
    stats = get_lp_stats()
    top = stats.genre_stats[:limit]
    return TopGenreResponse(data=top, total=len(top))


# ── GET /api/lp/{release_id} ──────────────────────────────────────────────────

@router.get(
    "/{release_id}",
    response_model=LPRecord,
    summary="LP 상세 조회",
    description="release_id로 단일 LP 정보를 반환한다.",
)
def get_lp_detail(release_id: int):
    """
    release_id에 해당하는 LP 상세 정보를 반환한다.

    Args:
        release_id: Discogs release ID (정수).

    Returns:
        LPRecord.
    Raises:
        HTTPException 404: release_id가 존재하지 않는 경우.
    """
    df = get_all_lp()
    row = df[df["release_id"] == release_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"release_id={release_id} LP를 찾을 수 없습니다.")

    d = {k: (None if str(v) == "nan" else v) for k, v in row.iloc[0].items()}
    return LPRecord(**d)
