# backend/services/data_service.py
"""
CSV 파일 로딩·캐싱과 비즈니스 로직을 담당하는 서비스 레이어.

lru_cache(maxsize=1)로 프로세스 수명 동안 CSV를 메모리에 1회만 로드한다.
호출자에게는 .copy()를 반환해 원본 캐시가 변형되지 않도록 보호한다.
"""

import math
import os
from functools import lru_cache

import pandas as pd
from fastapi import HTTPException

from models import ArtistStats, GenreStat, LPRecord, LPStats, RecommendRecord

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(__file__)
LP_CSV = os.path.normpath(os.path.join(_BASE, "..", "..", "output", "lp_analysis_final.csv"))
REC_CSV = os.path.normpath(os.path.join(_BASE, "..", "..", "output", "lp_recommendations.csv"))


# ── 내부 로더 (캐시 대상) ──────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _cached_lp() -> pd.DataFrame:
    """lp_analysis_final.csv를 읽고 타입을 정규화한다. 결과는 프로세스 내 캐시된다."""
    if not os.path.exists(LP_CSV):
        raise FileNotFoundError(f"LP CSV 파일을 찾을 수 없습니다: {LP_CSV}")

    df = pd.read_csv(LP_CSV)

    # 불리언
    df["is_limited_edition"] = df["is_limited_edition"].astype(bool)

    # 숫자
    for col in ("lowest_price", "predicted_price", "price_gap",
                "want_have_ratio", "spotify_popularity", "have", "want"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # 연도: NaN → 0
    df["year"] = pd.to_numeric(df["year"], errors="coerce").fillna(0).astype(int)

    return df


@lru_cache(maxsize=1)
def _cached_rec() -> pd.DataFrame:
    """lp_recommendations.csv를 읽고 타입을 정규화한다. 결과는 프로세스 내 캐시된다."""
    if not os.path.exists(REC_CSV):
        raise FileNotFoundError(f"추천 CSV 파일을 찾을 수 없습니다: {REC_CSV}")

    df = pd.read_csv(REC_CSV)
    for col in ("lowest_price", "predicted_price", "want_have_ratio", "spotify_popularity"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


# ── 유틸 ──────────────────────────────────────────────────────────────────────

def _nan_to_none(val):
    """float NaN을 None으로 변환한다. Pydantic 직렬화 시 null로 출력된다."""
    if isinstance(val, float) and math.isnan(val):
        return None
    return val


def _row_to_lp(row: pd.Series) -> LPRecord:
    """DataFrame 행 → LPRecord Pydantic 모델."""
    d = {k: _nan_to_none(v) for k, v in row.items()}
    return LPRecord(**d)


def _row_to_rec(row: pd.Series) -> RecommendRecord:
    """DataFrame 행 → RecommendRecord Pydantic 모델."""
    d = {k: _nan_to_none(v) for k, v in row.items()}
    return RecommendRecord(**d)


def _safe_round(val, ndigits: int = 2):
    """None·NaN에 안전한 반올림."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    return round(float(val), ndigits)


def _raise_csv_error(exc: Exception) -> None:
    raise HTTPException(status_code=500, detail=f"CSV 로딩 실패: {exc}")


# ── 공개 서비스 함수 ───────────────────────────────────────────────────────────

def get_all_lp() -> pd.DataFrame:
    """
    전체 LP DataFrame의 복사본을 반환한다.

    Returns:
        lp_analysis_final.csv 전체 데이터 (복사본).
    Raises:
        HTTPException 500: CSV 파일을 읽을 수 없는 경우.
    """
    try:
        return _cached_lp().copy()
    except FileNotFoundError as e:
        _raise_csv_error(e)


def get_all_rec() -> pd.DataFrame:
    """
    전체 추천 DataFrame의 복사본을 반환한다.

    Returns:
        lp_recommendations.csv 전체 데이터 (복사본).
    Raises:
        HTTPException 500: CSV 파일을 읽을 수 없는 경우.
    """
    try:
        return _cached_rec().copy()
    except FileNotFoundError as e:
        _raise_csv_error(e)


def get_lp_stats() -> LPStats:
    """
    대시보드 요약 통계를 계산해 반환한다.

    포함 항목:
        - 총 LP 수
        - 평균 재판매가 (lowest_price)
        - 평균 want_have_ratio
        - 저평가 LP 수 (price_gap > 0)
        - 한정판 LP 수
        - 장르별 평균가·LP 수·평균 want_have_ratio

    Returns:
        LPStats 모델.
    """
    df = get_all_lp()

    total = len(df)
    avg_price = _safe_round(df["lowest_price"].mean())
    avg_ratio = _safe_round(df["want_have_ratio"].mean())
    undervalued = int((df["price_gap"].fillna(0) > 0).sum())
    limited = int(df["is_limited_edition"].sum())

    genre_stats: list[GenreStat] = []
    genre_df = df.dropna(subset=["genre"])
    if not genre_df.empty:
        for genre, grp in genre_df.groupby("genre"):
            genre_stats.append(
                GenreStat(
                    genre=str(genre),
                    count=len(grp),
                    avg_price=_safe_round(grp["lowest_price"].mean()),
                    avg_want_have_ratio=_safe_round(grp["want_have_ratio"].mean()),
                )
            )
        genre_stats.sort(key=lambda g: g.avg_price or 0, reverse=True)

    return LPStats(
        total=total,
        avg_price=avg_price,
        avg_want_have_ratio=avg_ratio,
        undervalued_count=undervalued,
        limited_count=limited,
        genre_stats=genre_stats,
    )


def search_by_artist(artist_name: str) -> list[LPRecord]:
    """
    아티스트명 부분 일치로 LP를 검색한다 (대소문자 무시).

    Args:
        artist_name: 검색할 아티스트 이름 (부분 문자열).

    Returns:
        일치하는 LPRecord 리스트 (price_gap 내림차순).
    """
    df = get_all_lp()
    mask = df["artist"].str.lower().str.contains(artist_name.lower(), na=False, regex=False)
    result = df[mask].sort_values("price_gap", ascending=False, na_position="last")
    return [_row_to_lp(row) for _, row in result.iterrows()]


def get_lp_by_artist(artist_name: str) -> list[LPRecord]:
    """
    특정 아티스트의 모든 LP를 정확히 일치해 반환한다 (대소문자 무시).

    Args:
        artist_name: 아티스트 정확한 이름.

    Returns:
        해당 아티스트 LPRecord 리스트.
    """
    df = get_all_lp()
    mask = df["artist"].str.lower() == artist_name.lower()
    result = df[mask].sort_values("price_gap", ascending=False, na_position="last")
    return [_row_to_lp(row) for _, row in result.iterrows()]


def get_recommendations(artist_name: str) -> list[RecommendRecord]:
    """
    특정 아티스트 팬을 위한 추천 LP를 반환한다 (대소문자 무시).

    Args:
        artist_name: 기준 아티스트 이름 (input_artist 컬럼과 정확히 일치).

    Returns:
        RecommendRecord 리스트 (want_have_ratio 내림차순).
    """
    df = get_all_rec()
    mask = df["input_artist"].str.lower() == artist_name.lower()
    result = df[mask].sort_values("want_have_ratio", ascending=False, na_position="last")
    return [_row_to_rec(row) for _, row in result.iterrows()]


def get_artist_stats(artist_name: str) -> ArtistStats:
    """
    특정 아티스트의 요약 통계를 반환한다.

    포함 항목: 보유 LP 수, 평균가, 최고가, 평균 Spotify 인기도.

    Args:
        artist_name: 아티스트 이름 (정확 일치, 대소문자 무시).

    Returns:
        ArtistStats 모델.
    Raises:
        HTTPException 404: 해당 아티스트 LP가 없는 경우.
    """
    df = get_all_lp()
    mask = df["artist"].str.lower() == artist_name.lower()
    grp = df[mask]

    if grp.empty:
        raise HTTPException(status_code=404, detail=f"아티스트 '{artist_name}'의 LP를 찾을 수 없습니다.")

    return ArtistStats(
        artist=str(grp["artist"].iloc[0]),
        lp_count=len(grp),
        avg_price=_safe_round(grp["lowest_price"].mean()),
        max_price=_safe_round(grp["lowest_price"].max()),
        avg_spotify_popularity=_safe_round(grp["spotify_popularity"].mean()),
    )


def invalidate_cache() -> None:
    """lru_cache를 초기화한다. CSV 파일이 갱신된 후 호출한다."""
    _cached_lp.cache_clear()
    _cached_rec.cache_clear()
