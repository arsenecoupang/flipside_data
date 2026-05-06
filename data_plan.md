# LP 재판매 데이터 분석 계획서

> 작성일: 2026년 5월 6일  
> 목적: Flipside LP 재판매를 위한 데이터 수집·분석·추천 전략 수립

---

## 목차

1. [해외 LP 판매 주요 플랫폼 및 API 현황](#1-해외-lp-판매-주요-플랫폼-및-api-현황)
2. [음악 청취 데이터 및 추천 API](#2-음악-청취-데이터-및-추천-api)
3. [수집 가능 피처 목록](#3-수집-가능-피처-목록)
4. [데이터 분석 로드맵 (4단계)](#4-데이터-분석-로드맵-4단계)
5. [핵심 분석 질문 (비즈니스 목표)](#5-핵심-분석-질문-비즈니스-목표)
6. [추천 기술 스택](#6-추천-기술-스택)
7. [API 현황 요약 테이블](#7-api-현황-요약-테이블)

---

## 1. 해외 LP 판매 주요 플랫폼 및 API 현황

### 1-1. Discogs

LP 재판매 분석에 가장 중요한 플랫폼입니다.

- **공식 문서**: [discogs.com/developers](https://www.discogs.com/developers)
- **API 방식**: RESTful, JSON 응답
- **인증**: Personal Access Token 또는 OAuth

**제공 데이터** (출처: [Discogs API 공식 문서](https://www.discogs.com/developers))
- 아티스트·릴리즈·레이블 등 데이터베이스 객체 정보 (공개)
- 유저 컬렉션·위시리스트 관리
- 마켓플레이스 리스팅 생성
- `Release Stats` 엔드포인트: 커뮤니티 have / want 수치 반환
- 마켓플레이스 최저가 (인증 필요)

**⚠ API 한계** (출처: [Discogs Forum](https://www.discogs.com/forum/thread/904114))
- 특정 릴리즈의 마켓플레이스 리스팅 목록 조회 엔드포인트는 수 년 전 종료됨
- **판매 이력·중앙값 가격은 API가 아닌 웹 인터페이스에서만 제공**
  - 웹에서는 최근 30건 기준 최저·중앙·최고 판매가 확인 가능 (출처: [Discogs 가격 가이드](https://www.discogs.com/digs/collecting/vinyl-record-price-guide/))

**Python 클라이언트 예시** (출처: [python3-discogs-client 문서](https://python3-discogs-client.readthedocs.io/en/latest/fetching_data.html))

```python
import discogs_client

d = discogs_client.Client('MyApp/1.0', user_token='YOUR_TOKEN')
release = d.release(249504)

print(release.title)               # 앨범 제목
print(release.artists[0].name)     # 아티스트명
print(release.community.want)      # 위시리스트 수
print(release.marketplace_stats)   # 마켓플레이스 최저가·수량
```

---

### 1-2. Popsike

Discogs와 함께 자주 쓰이는 보완 데이터 소스입니다.

- **특징**: 2003년부터의 eBay 경매 낙찰가 아카이브 제공 (출처: [VinylAI 가격 가이드](https://vinylai.app/guides/how-to-price-vinyl-discogs/))
- 레어 재즈·소울·록 프레싱의 상한가 파악에 유용
- **⚠ 공개 API 없음** → 웹 스크래핑 또는 CSV 수동 활용 필요

---

### 1-3. Reverb LP

- 빈티지·오디오파일 프레싱 분야 특화 플랫폼 (출처: [VinylAI 가격 가이드](https://vinylai.app/guides/how-to-price-vinyl-discogs/))
- 판매 수수료 5%로 Discogs보다 낮음
- 리스팅 약 200만 건 (Discogs 800만 건 이상 대비 소규모)
- **⚠ API 공개 여부 별도 확인 필요**

---

## 2. 음악 청취 데이터 및 추천 API

### 2-1. Spotify Web API

청취 기반 음악 분석에 핵심 도구입니다.

- **공식 문서**: [developer.spotify.com](https://developer.spotify.com/documentation/web-api)
- **인증**: OAuth 2.0 (Client Credentials Flow로 공개 데이터 접근 가능)

**핵심 엔드포인트** (출처: [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/reference/get-recommendations))

| 엔드포인트 | 설명 |
|---|---|
| `GET /artists/{id}/related-artists` | Spotify 커뮤니티 청취 이력 기반 유사 아티스트 최대 20명 반환 |
| `GET /recommendations` | seed 아티스트·트랙·장르 기반 유사 트랙 목록 생성 |
| `GET /audio-features/{id}` | 트랙의 energy, tempo, danceability 등 오디오 피처 반환 |
| `GET /artists/{id}` | 아티스트 인기 점수(0~100) 포함 상세 정보 |

**⚠ API 한계**
- 개인 청취 이력 조회는 OAuth 사용자 인증 필요
- 인기 점수는 실시간이 아닌 수 일 지연 업데이트

**Python 예시** (출처: [Spotipy 라이브러리](https://spotipy.readthedocs.io/))

```python
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id='CLIENT_ID',
    client_secret='CLIENT_SECRET'
))

# 유사 아티스트 조회
related = sp.artist_related_artists('ARTIST_SPOTIFY_ID')
for artist in related['artists']:
    print(artist['name'], artist['popularity'])

# 트랙 추천
recs = sp.recommendations(seed_artists=['ARTIST_ID'], limit=20)
for track in recs['tracks']:
    print(track['name'])
```

---

### 2-2. Last.fm API

- **공식 문서**: [last.fm/api](https://www.last.fm/api)
- 아티스트 태그·유사 아티스트 (공개, API 키만 필요)
- 청취 횟수·장르 클러스터링에 활용 가능
- 무료 플랜으로 충분한 데이터 접근 가능

---

## 3. 수집 가능 피처 목록

### LP 메타데이터 (Discogs)

| 피처 | 설명 |
|---|---|
| 장르·스타일 | Rock, Jazz, Electronic 등 다중 분류 |
| 발매 연도·국가 | 프레싱 국가 포함 |
| 레이블·포맷 | LP, 12", 한정판 등 |
| 커뮤니티 have | 컬렉션에 보유한 유저 수 |
| 커뮤니티 want | 위시리스트에 추가한 유저 수 |
| 마켓플레이스 최저가 | 현재 판매 중인 최저 가격 |
| 한정판 여부 | Limited Edition, Numbered 등 |

### 아티스트 피처 (Spotify + Last.fm)

| 피처 | 출처 |
|---|---|
| 인기 점수 (0~100) | Spotify |
| 유사 아티스트 목록 | Spotify |
| 대표 장르 태그 | Spotify / Last.fm |
| 청취 횟수 (Scrobbles) | Last.fm |
| 팔로워 수 | Spotify |

### 가격·수요 신호 (Discogs + Popsike)

| 피처 | 비고 |
|---|---|
| 마켓 최저·중앙 가격 | 중앙값은 웹 크롤링 필요 |
| Popsike 경매 최고가 | 스크래핑 필요 |
| 현재 매물 수량 | API 제공 |
| want / have 비율 | 희소성 지표 (파생 피처) |
| 가격 추세 (시계열) | 웹 크롤링 필요 |

**파생 피처 예시**

```python
df['want_have_ratio'] = df['want'] / (df['have'] + 1)   # 희소성 지표
df['artist_popularity_x_want'] = df['spotify_popularity'] * df['want_have_ratio']
```

---

## 4. 데이터 분석 로드맵 (4단계)

### 1단계 — 데이터 수집

**목표**: 보유 LP 목록 기반 Discogs + Spotify 데이터 결합

```python
import discogs_client
import spotipy
import pandas as pd

# Discogs에서 LP 메타데이터 수집
def collect_discogs_data(release_ids: list) -> pd.DataFrame:
    d = discogs_client.Client('FlipsideApp/1.0', user_token='TOKEN')
    records = []
    for rid in release_ids:
        r = d.release(rid)
        records.append({
            'release_id': rid,
            'title': r.title,
            'artist': r.artists[0].name,
            'year': r.year,
            'genre': r.genres,
            'want': r.community.want,
            'have': r.community.have,
            'lowest_price': r.marketplace_stats.get('lowest_price', {}).get('value')
        })
    return pd.DataFrame(records)

# Spotify에서 아티스트 인기도 수집
def enrich_with_spotify(df: pd.DataFrame, sp: spotipy.Spotify) -> pd.DataFrame:
    for idx, row in df.iterrows():
        results = sp.search(q=f'artist:{row["artist"]}', type='artist', limit=1)
        items = results['artists']['items']
        if items:
            df.at[idx, 'spotify_popularity'] = items[0]['popularity']
            df.at[idx, 'spotify_followers'] = items[0]['followers']['total']
    return df
```

---

### 2단계 — 전처리 및 EDA

**목표**: 피처 엔지니어링 및 데이터 품질 확보

```python
import pandas as pd
import numpy as np

# 희소성 지표 생성
df['want_have_ratio'] = df['want'] / (df['have'] + 1)

# 가격 이상치 제거 (IQR)
Q1 = df['lowest_price'].quantile(0.25)
Q3 = df['lowest_price'].quantile(0.75)
IQR = Q3 - Q1
df_clean = df[
    (df['lowest_price'] >= Q1 - 1.5 * IQR) &
    (df['lowest_price'] <= Q3 + 1.5 * IQR)
]

# 결측값 처리
df_clean['spotify_popularity'].fillna(df_clean['spotify_popularity'].median(), inplace=True)

# 주요 분포 확인
print(df_clean[['lowest_price', 'want_have_ratio', 'spotify_popularity']].describe())
```

**EDA 체크리스트**

- [ ] 장르별 평균 재판매가 분포
- [ ] 발매 연도 vs. 현재 가격 상관관계
- [ ] want/have 비율 vs. 가격 산점도
- [ ] 아티스트 인기도 vs. LP 가격 히트맵
- [ ] 한정판 여부에 따른 가격 차이 (t-test)

---

### 3단계 — 모델링

#### A. LP 재판매 가격 예측 (회귀 모델)

```python
from sklearn.model_selection import train_test_split, cross_val_score
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error
import numpy as np

features = [
    'want_have_ratio', 'spotify_popularity', 'year',
    'have', 'want', 'is_limited_edition'
]

X = df_clean[features]
y = np.log1p(df_clean['lowest_price'])   # 로그 변환으로 정규화

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
model.fit(X_train, y_train)

# 평가
y_pred = model.predict(X_test)
mae = mean_absolute_error(np.expm1(y_test), np.expm1(y_pred))
print(f"MAE: ${mae:.2f}")

# 피처 중요도
import pandas as pd
feat_importance = pd.Series(
    model.feature_importances_, index=features
).sort_values(ascending=False)
print(feat_importance)
```

#### B. 아티스트 유사도 기반 LP 추천

```python
# Spotify 유사 아티스트 그래프 기반 추천
def recommend_lps_by_artist(artist_name: str, sp, df_inventory: pd.DataFrame) -> pd.DataFrame:
    """
    특정 아티스트 팬이 관심 가질 LP 목록 추천
    """
    # 아티스트 Spotify ID 검색
    results = sp.search(q=f'artist:{artist_name}', type='artist', limit=1)
    artist_id = results['artists']['items'][0]['id']
    
    # 유사 아티스트 조회
    related = sp.artist_related_artists(artist_id)
    related_names = {a['name'].lower() for a in related['artists']}
    
    # 보유 재고에서 유사 아티스트 LP 필터링
    recommended = df_inventory[
        df_inventory['artist'].str.lower().isin(related_names)
    ].sort_values('want_have_ratio', ascending=False)
    
    return recommended[['title', 'artist', 'lowest_price', 'want_have_ratio']]
```

---

### 4단계 — 인사이트 및 대시보드

**Streamlit 대시보드 구성 예시**

```python
import streamlit as st
import plotly.express as px

st.title("Flipside LP 재판매 분석 대시보드")

# 사이드바 필터
genre_filter = st.sidebar.multiselect("장르 선택", df_clean['genre'].explode().unique())
price_range = st.sidebar.slider("가격 범위 ($)", 0, 500, (0, 200))

filtered = df_clean[df_clean['lowest_price'].between(*price_range)]

# 차트 1: 장르별 평균 가격
fig1 = px.bar(
    filtered.explode('genre').groupby('genre')['lowest_price'].mean().reset_index(),
    x='genre', y='lowest_price', title='장르별 평균 재판매가'
)
st.plotly_chart(fig1)

# 차트 2: 희소성 vs 가격
fig2 = px.scatter(
    filtered, x='want_have_ratio', y='lowest_price',
    color='spotify_popularity', hover_data=['title', 'artist'],
    title='희소성(want/have) vs 재판매가'
)
st.plotly_chart(fig2)

# LP 추천
st.subheader("아티스트 기반 LP 추천")
input_artist = st.text_input("아티스트 이름 입력")
if input_artist:
    recommendations = recommend_lps_by_artist(input_artist, sp, df_clean)
    st.dataframe(recommendations)
```

---

## 5. 핵심 분석 질문 (비즈니스 목표)

| # | 질문 | 분석 방법 |
|---|---|---|
| 1 | **어떤 피처가 LP 재판매가를 높이는가?** | XGBoost 피처 중요도 분석 |
| 2 | **want/have 비율이 높은 LP는 실제로 더 비싸게 팔리는가?** | Pearson 상관계수, 산점도 |
| 3 | **A 아티스트의 팬이 관심 가질 다른 LP는?** | Spotify 유사 아티스트 그래프 |
| 4 | **신흥 인기 아티스트 LP를 조기에 매입할 수 있는가?** | Spotify 팔로워 성장률 추적 |
| 5 | **장르별·연도별로 가격이 어떻게 다른가?** | 그룹별 기술통계, 박스플롯 |

---

## 6. 추천 기술 스택

### 데이터 수집
| 라이브러리 | 용도 |
|---|---|
| `python-discogs-client` | Discogs API 연동 |
| `spotipy` | Spotify Web API 연동 |
| `requests` + `BeautifulSoup` | Popsike 등 크롤링 보완 |

### 데이터 분석·모델링
| 라이브러리 | 용도 |
|---|---|
| `pandas` | 데이터 처리·피처 엔지니어링 |
| `scikit-learn` | 전처리, 교차 검증, 평가 지표 |
| `xgboost` | 가격 예측 회귀 모델 |
| `scipy` | 통계 검정 (t-test, 상관계수) |

### 시각화·대시보드
| 라이브러리 | 용도 |
|---|---|
| `plotly` | 대화형 차트 |
| `seaborn` / `matplotlib` | 정적 시각화·EDA |
| `Streamlit` | 웹 대시보드 |

### 저장·관리
| 도구 | 용도 |
|---|---|
| `SQLite` / `PostgreSQL` | 수집 데이터 저장 |
| `CSV` | 배치 수집 결과 저장 |

---

## 7. API 현황 요약 테이블

| 플랫폼 | API 제공 | 가격 데이터 | 추천 활용 | 비고 |
|---|---|---|---|---|
| **Discogs** | ✅ 공개 API | have/want·최저가만 | LP 메타데이터 | 판매 이력은 웹 전용 |
| **Spotify** | ✅ 공개 API | 없음 | 아티스트 유사도·추천 | OAuth 필요 (개인 이력) |
| **Last.fm** | ✅ 공개 API | 없음 | 장르·태그·청취 수 | 무료 API 키 발급 |
| **Popsike** | ❌ 없음 | 경매 낙찰가 아카이브 | — | 스크래핑 필요 |
| **Reverb LP** | 확인 필요 | 마켓 가격 | — | 규모 소규모 |

---

## 참고 출처

- Discogs API 공식 문서: https://www.discogs.com/developers
- python3-discogs-client 문서: https://python3-discogs-client.readthedocs.io/en/latest/fetching_data.html
- Spotify Web API Reference (관련 아티스트): https://developer.spotify.com/documentation/web-api/reference/get-recommendations
- Discogs 가격 가이드: https://www.discogs.com/digs/collecting/vinyl-record-price-guide/
- VinylAI 가격 전략 가이드: https://vinylai.app/guides/how-to-price-vinyl-discogs/
- Discogs Forum (마켓플레이스 리스팅 API 종료): https://www.discogs.com/forum/thread/904114
- LP 재판매 가격 예측 프로젝트 사례: https://medium.com/@kdavis7190/vinyl-resale-price-prediction-6cb0adaedcb9
