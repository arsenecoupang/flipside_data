# 사용법: python recommend.py
# 필요 패키지: pip install spotipy pandas

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import pandas as pd

# ── CONFIG ─────────────────────────────────────────────────────────────────────
SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID"
SPOTIFY_CLIENT_SECRET = "YOUR_SPOTIFY_CLIENT_SECRET"

INVENTORY_PATH = "./output/lp_analysis_final.csv"
OUTPUT_PATH = "./output/lp_recommendations.csv"

TARGET_ARTISTS = ["Radiohead", "Portishead", "Massive Attack"]
# ───────────────────────────────────────────────────────────────────────────────


def init_spotify() -> spotipy.Spotify:
    """Spotify 클라이언트를 초기화하고 반환한다."""
    creds = SpotifyClientCredentials(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(auth_manager=creds)


def get_artist_genres(sp: spotipy.Spotify, artist_name: str) -> list[str]:
    """
    Spotify에서 아티스트를 검색하고 해당 아티스트의 장르 목록을 반환한다.

    Note:
        Spotify의 artist_related_artists 엔드포인트는 2024년 11월 폐기되어
        장르 겹침 기반 유사도 매칭으로 대체한다.

    Returns:
        장르 이름 리스트. 아티스트 미발견 시 빈 리스트.
    """
    results = sp.search(q=f"artist:{artist_name}", type="artist", limit=1)
    items = results["artists"]["items"]
    if not items:
        print(f"  [WARN] Spotify에서 '{artist_name}'을(를) 찾을 수 없습니다.")
        return []

    artist_id = items[0]["id"]
    try:
        full_artist = sp.artist(artist_id)
        return full_artist.get("genres", [])
    except Exception:
        return items[0].get("genres", [])


def recommend_lps(
    artist_name: str,
    inventory: pd.DataFrame,
    sp: spotipy.Spotify,
    top_n: int = 5,
) -> pd.DataFrame:
    """
    특정 아티스트의 Spotify 장르와 겹치는 재고 LP를 추천한다.

    장르 정보가 없으면 아티스트 이름 부분 일치로 폴백한다.

    Args:
        artist_name: 기준 아티스트 이름
        inventory: lp_analysis_final.csv 로드된 DataFrame
        sp: Spotify 클라이언트
        top_n: 반환할 추천 LP 수

    Returns:
        추천 LP DataFrame (want_have_ratio 내림차순). 추천 결과 없을 시 빈 DataFrame.
    """
    input_genres = get_artist_genres(sp, artist_name)
    input_genres_lower = {g.lower() for g in input_genres}

    # 재고의 spotify_genres 컬럼과 장르 겹침으로 후보 필터링
    if input_genres_lower and "spotify_genres" in inventory.columns:
        def _has_overlap(row_genres):
            if not isinstance(row_genres, str):
                return False
            row_set = {g.strip().lower() for g in row_genres.split(",")}
            return bool(row_set & input_genres_lower)

        mask = inventory["spotify_genres"].apply(_has_overlap)
        candidates = inventory[mask].copy()
    else:
        candidates = pd.DataFrame()

    # 장르 매칭 결과가 없으면 전체 재고에서 수요 높은 순으로 fallback
    if candidates.empty:
        print(f"  [INFO] '{artist_name}' 장르 매칭 결과 없음 — 전체 재고 기준 수요 상위 추천")
        candidates = inventory.copy()

    if candidates.empty:
        print(f"  [INFO] '{artist_name}'의 유사 아티스트 LP가 재고에 없습니다.")
        return pd.DataFrame()

    candidates = candidates.sort_values(
        ["want_have_ratio", "spotify_popularity"],
        ascending=[False, False],
    ).head(top_n)

    candidates.insert(0, "input_artist", artist_name)
    return candidates[
        [
            "input_artist", "title", "artist",
            "lowest_price", "predicted_price",
            "want_have_ratio", "spotify_popularity",
        ]
    ].rename(columns={"title": "recommended_title", "artist": "recommended_artist"})


def batch_recommend(artist_list: list[str], inventory: pd.DataFrame, sp: spotipy.Spotify) -> pd.DataFrame:
    """
    아티스트 목록 전체에 대해 추천을 생성하고 결과를 CSV로 저장한다.

    Returns:
        모든 추천 결과를 합친 DataFrame.
    """
    all_results = []
    for name in artist_list:
        print(f"\n[추천 생성] 기준 아티스트: {name}")
        result = recommend_lps(name, inventory, sp)
        if not result.empty:
            all_results.append(result)

    if not all_results:
        print("추천 결과가 없습니다.")
        return pd.DataFrame()

    combined = pd.concat(all_results, ignore_index=True)
    combined.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")
    print(f"\n추천 결과 저장 완료: {OUTPUT_PATH}  ({len(combined)}행)")
    return combined


def main():
    """추천 시스템 파이프라인 진입점."""
    sp = init_spotify()
    inventory = pd.read_csv(INVENTORY_PATH)

    # 단일 아티스트 예시
    print("=== 단일 추천 예시: Radiohead ===")
    single = recommend_lps("Radiohead", inventory, sp, top_n=5)
    print(single.to_string(index=False) if not single.empty else "(결과 없음)")

    # 배치 추천
    print("\n=== 배치 추천 ===")
    batch_recommend(TARGET_ARTISTS, inventory, sp)


if __name__ == "__main__":
    main()

# 사용 예시:
#   from recommend import recommend_lps, init_spotify
#   import pandas as pd
#   sp = init_spotify()
#   inv = pd.read_csv("./output/lp_analysis_final.csv")
#   print(recommend_lps("Radiohead", inv, sp, top_n=5))
