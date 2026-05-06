# 사용법: python preprocess_eda.py
# 필요 패키지: pip install pandas matplotlib seaborn

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# ── CONFIG ─────────────────────────────────────────────────────────────────────
INPUT_PATH = "./output/lp_raw_data.csv"
OUTPUT_CSV = "./output/lp_clean_data.csv"
NO_PRICE_CSV = "./output/lp_no_price.csv"
OUTPUT_DIR = "./output"
# ───────────────────────────────────────────────────────────────────────────────

sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams["figure.dpi"] = 120
# Windows 한글 폰트 설정 (맑은 고딕 우선, 없으면 기본폰트 유지)
import matplotlib.font_manager as _fm
_priority = ["Malgun Gothic", "AppleGothic", "NanumGothic", "Dotum", "Gulim", "Batang"]
_available = {f.name for f in _fm.fontManager.ttflist}
_korean_font = next((f for f in _priority if f in _available), None)
if _korean_font:
    plt.rcParams["font.family"] = _korean_font
plt.rcParams["axes.unicode_minus"] = False


def load_and_audit(path: str) -> pd.DataFrame:
    """
    CSV를 로드하고 결측값 비율, 데이터 타입, 중복 행을 출력한다.
    lowest_price가 없는 행을 별도 CSV로 분리 저장하고 나머지를 반환한다.
    """
    df = pd.read_csv(path)
    print("=== 기본 품질 확인 ===")
    print(f"행 수: {len(df)}, 컬럼 수: {len(df.columns)}")
    print("\n결측값 비율(%):")
    print((df.isnull().mean() * 100).round(2).to_string())
    print(f"\n중복 행: {df.duplicated().sum()}개")
    print("\n데이터 타입:")
    print(df.dtypes.to_string())

    no_price = df[df["lowest_price"].isnull()].copy()
    no_price.to_csv(NO_PRICE_CSV, index=False, encoding="utf-8-sig")
    print(f"\nlower_price 없는 행 → {NO_PRICE_CSV} ({len(no_price)}행)")

    df = df.dropna(subset=["lowest_price"]).copy()
    df["lowest_price"] = pd.to_numeric(df["lowest_price"], errors="coerce")
    df = df.dropna(subset=["lowest_price"])
    return df


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """want_have_ratio, is_high_demand, price_tier 파생 피처를 추가한다."""
    if df.empty:
        print("[WARN] 가격 데이터가 없어 파생 피처를 생성할 수 없습니다.")
        for col in ("want_have_ratio", "is_high_demand", "price_tier"):
            df[col] = np.nan
        return df

    df["want_have_ratio"] = df["want"] / (df["have"] + 1)
    df["is_high_demand"] = df["want_have_ratio"] > 2.0

    low = df["lowest_price"].quantile(0.33)
    high = df["lowest_price"].quantile(0.67)

    # 데이터가 너무 적거나 값이 모두 같으면 단순 3등분이 불가능하므로 rank 기반으로 대체
    if low == high or pd.isna(low) or pd.isna(high):
        tertile = df["lowest_price"].rank(pct=True)
        df["price_tier"] = pd.cut(
            tertile,
            bins=[0, 0.33, 0.67, 1.0],
            labels=["low", "mid", "high"],
            include_lowest=True,
        )
    else:
        df["price_tier"] = pd.cut(
            df["lowest_price"],
            bins=[-np.inf, low, high, np.inf],
            labels=["low", "mid", "high"],
        )
    return df


def remove_outliers_iqr(df: pd.DataFrame, col: str = "lowest_price") -> pd.DataFrame:
    """IQR 방식으로 지정 컬럼의 이상치를 제거하고 결과를 출력한다."""
    q1 = df[col].quantile(0.25)
    q3 = df[col].quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr

    mask = df[col].between(lower, upper)
    removed = (~mask).sum()
    print(f"\n=== 이상치 처리 ({col}) ===")
    print(f"정상 범위: {lower:.2f} ~ {upper:.2f}")
    print(f"제거된 행: {removed}개 / 남은 행: {mask.sum()}개")
    return df[mask].copy()


def plot_all(df: pd.DataFrame, out_dir: str):
    """5개 시각화를 PNG 파일로 저장한다."""
    os.makedirs(out_dir, exist_ok=True)

    # eda_01: 장르별 평균 재판매가
    fig, ax = plt.subplots(figsize=(10, 5))
    genre_mean = df.groupby("genre")["lowest_price"].mean().sort_values(ascending=False)
    sns.barplot(x=genre_mean.index, y=genre_mean.values, ax=ax)
    ax.set_title("장르별 평균 재판매가")
    ax.set_xlabel("장르")
    ax.set_ylabel("평균 가격 (USD)")
    ax.tick_params(axis="x", rotation=45)
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "eda_01_genre.png"))
    plt.close(fig)

    # eda_02: want_have_ratio vs lowest_price 산점도
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.scatterplot(data=df, x="want_have_ratio", y="lowest_price", alpha=0.6, ax=ax)
    ax.set_title("Want/Have 비율 vs 재판매가")
    ax.set_xlabel("want_have_ratio")
    ax.set_ylabel("최저가 (USD)")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "eda_02_ratio_vs_price.png"))
    plt.close(fig)

    # eda_03: 발매 연도별 평균 가격 선그래프
    fig, ax = plt.subplots(figsize=(12, 5))
    year_mean = df.groupby("year")["lowest_price"].mean().dropna()
    ax.plot(year_mean.index, year_mean.values, marker="o", linewidth=1.5)
    ax.set_title("발매 연도별 평균 재판매가")
    ax.set_xlabel("발매 연도")
    ax.set_ylabel("평균 가격 (USD)")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "eda_03_year.png"))
    plt.close(fig)

    # eda_04: spotify_popularity vs lowest_price 산점도
    fig, ax = plt.subplots(figsize=(8, 5))
    plot_df = df.dropna(subset=["spotify_popularity"])
    sns.scatterplot(data=plot_df, x="spotify_popularity", y="lowest_price", alpha=0.6, ax=ax)
    ax.set_title("Spotify 인기도 vs 재판매가")
    ax.set_xlabel("spotify_popularity (0~100)")
    ax.set_ylabel("최저가 (USD)")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "eda_04_spotify.png"))
    plt.close(fig)

    # eda_05: 한정판 여부에 따른 가격 분포 박스플롯
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.boxplot(data=df, x="is_limited_edition", y="lowest_price", ax=ax)
    ax.set_title("한정판 여부에 따른 가격 분포")
    ax.set_xlabel("한정판 여부")
    ax.set_ylabel("최저가 (USD)")
    ax.set_xticklabels(["일반반", "한정반"])
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "eda_05_limited.png"))
    plt.close(fig)

    print(f"\nEDA 시각화 5개 저장 완료 → {out_dir}")


def main():
    """전처리 및 EDA 파이프라인 진입점."""
    df = load_and_audit(INPUT_PATH)
    df = add_derived_features(df)
    df = remove_outliers_iqr(df)
    plot_all(df, OUTPUT_DIR)

    print("\n=== 최종 데이터 요약 통계 ===")
    print(df[["lowest_price", "want_have_ratio", "spotify_popularity", "spotify_followers"]].describe().round(2))

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\n저장 완료: {OUTPUT_CSV}  ({len(df)}행)")


if __name__ == "__main__":
    main()
