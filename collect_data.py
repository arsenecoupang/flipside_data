# 사용법: python collect_data.py
# 필요 패키지: pip install discogs-client spotipy pandas

import time
import requests
import discogs_client
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import pandas as pd

# ── CONFIG ─────────────────────────────────────────────────────────────────────
DISCOGS_TOKEN       = os.environ.get("DISCOGS_TOKEN", "")
SPOTIFY_CLIENT_ID   = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")

RELEASE_IDS = [249504, 1443762, 3185713]
OUTPUT_PATH = "./output/lp_raw_data.csv"

DISCOGS_RATE_LIMIT_SLEEP = 1.1  # 분당 60회 제한 준수
# ───────────────────────────────────────────────────────────────────────────────


def init_discogs() -> discogs_client.Client:
    """Discogs API 클라이언트를 초기화하고 반환한다."""
    return discogs_client.Client("FlipsideApp/1.0", user_token=DISCOGS_TOKEN)


def init_spotify() -> spotipy.Spotify:
    """Spotify API 클라이언트를 초기화하고 반환한다."""
    credentials = SpotifyClientCredentials(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(auth_manager=credentials)


def _fetch_marketplace_price(release_id: int) -> float | None:
    """
    Discogs /marketplace/stats 엔드포인트로 마켓플레이스 최저가를 조회한다.
    /releases 엔드포인트에는 lowest_price가 포함되지 않으므로 별도 호출이 필요하다.
    """
    try:
        url = f"https://api.discogs.com/marketplace/stats/{release_id}"
        resp = requests.get(
            url,
            headers={"Authorization": f"Discogs token={DISCOGS_TOKEN}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            price_obj = data.get("lowest_price")
            return price_obj.get("value") if price_obj else None
        return None
    except Exception:
        return None


def fetch_discogs_release(client: discogs_client.Client, release_id: int) -> dict:
    """
    단일 Discogs release_id에 대한 메타데이터를 조회한다.

    Returns:
        앨범 제목, 아티스트, 발매연도, 장르, 국가, 레이블,
        community have/want 수, 마켓플레이스 최저가, 한정판 여부를 담은 dict.
        실패 시 release_id만 담은 dict 반환.
    """
    try:
        release = client.release(release_id)
        community = release.data.get("community", {})

        genres = release.data.get("genres", [])
        labels = release.data.get("labels", [])
        label_names = [lb.get("name", "") for lb in labels]

        formats = release.data.get("formats", [])
        descriptions = []
        for fmt in formats:
            descriptions.extend(fmt.get("descriptions", []))
        is_limited = any(
            d.lower() in ("limited edition", "promo", "numbered")
            for d in descriptions
        )

        lowest_price = _fetch_marketplace_price(release_id)

        return {
            "release_id": release_id,
            "title": release.title,
            "artist": release.artists[0].name if release.artists else None,
            "year": release.year,
            "genre": genres[0] if genres else None,
            "country": release.data.get("country", None),
            "label": label_names[0] if label_names else None,
            "have": community.get("have", 0),
            "want": community.get("want", 0),
            "lowest_price": lowest_price,
            "is_limited_edition": is_limited,
        }
    except Exception as e:
        print(f"  [SKIP] Discogs release_id={release_id} 조회 실패: {e}")
        return {"release_id": release_id}


def fetch_spotify_artist(sp: spotipy.Spotify, artist_name: str) -> dict:
    """
    아티스트 이름으로 Spotify에서 인기 점수, 팔로워 수, 대표 장르를 조회한다.

    Returns:
        spotify_popularity, spotify_followers, spotify_genres 키를 담은 dict.
        실패 시 세 값 모두 None인 dict 반환.
    """
    if not artist_name:
        return {"spotify_popularity": None, "spotify_followers": None, "spotify_genres": None}
    try:
        results = sp.search(q=f"artist:{artist_name}", type="artist", limit=1)
        items = results["artists"]["items"]
        if not items:
            return {"spotify_popularity": None, "spotify_followers": None, "spotify_genres": None}
        artist = items[0]
        artist_id = artist.get("id")
        # search 결과에 popularity가 없으면 artist 상세 조회로 보완
        if artist_id and artist.get("popularity") is None:
            try:
                artist = sp.artist(artist_id)
            except Exception:
                pass
        followers = artist.get("followers") or {}
        return {
            "spotify_popularity": artist.get("popularity"),
            "spotify_followers": followers.get("total"),
            "spotify_genres": ", ".join(artist["genres"][:3]) if artist.get("genres") else None,
        }
    except Exception as e:
        print(f"  [SKIP] Spotify 아티스트 '{artist_name}' 조회 실패: {e}")
        return {"spotify_popularity": None, "spotify_followers": None, "spotify_genres": None}


def collect_all(release_ids: list[int]) -> pd.DataFrame:
    """
    release_id 리스트를 순회하며 Discogs + Spotify 데이터를 수집하고
    하나의 DataFrame으로 반환한다.
    """
    dc = init_discogs()
    sp = init_spotify()
    rows = []

    for i, rid in enumerate(release_ids, 1):
        print(f"[{i}/{len(release_ids)}] release_id={rid} 수집 중...")
        discogs_row = fetch_discogs_release(dc, rid)
        time.sleep(DISCOGS_RATE_LIMIT_SLEEP)

        spotify_row = fetch_spotify_artist(sp, discogs_row.get("artist"))
        rows.append({**discogs_row, **spotify_row})

    return pd.DataFrame(rows)


def main():
    """데이터 수집 파이프라인 진입점."""
    import os
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    df = collect_all(RELEASE_IDS)
    df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")
    print(f"\n저장 완료: {OUTPUT_PATH}  ({len(df)}행)")


if __name__ == "__main__":
    main()

# 사용 예시:
#   python collect_data.py
#   → output/lp_raw_data.csv 생성
