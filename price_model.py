# 사용법: python price_model.py
# 필요 패키지: pip install pandas numpy xgboost scikit-learn matplotlib seaborn

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as _fm
import seaborn as sns

_priority = ["Malgun Gothic", "AppleGothic", "NanumGothic", "Dotum", "Gulim", "Batang"]
_available = {f.name for f in _fm.fontManager.ttflist}
_korean_font = next((f for f in _priority if f in _available), None)
if _korean_font:
    plt.rcParams["font.family"] = _korean_font
plt.rcParams["axes.unicode_minus"] = False
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

# ── CONFIG ─────────────────────────────────────────────────────────────────────
INPUT_PATH = "./output/lp_clean_data.csv"
OUTPUT_CSV = "./output/lp_analysis_final.csv"
FI_PNG = "./output/feature_importance.png"

FEATURES = [
    "want_have_ratio",
    "spotify_popularity",
    "spotify_followers",
    "year",
    "have",
    "want",
    "is_limited_edition",
    "genre_encoded",
]
TARGET = "lowest_price"
RANDOM_STATE = 42
# ───────────────────────────────────────────────────────────────────────────────


def load_and_encode(path: str) -> pd.DataFrame:
    """CSV 로드 후 genre를 Label Encoding하여 반환한다."""
    df = pd.read_csv(path)
    df["is_limited_edition"] = df["is_limited_edition"].astype(int)
    le = LabelEncoder()
    df["genre_encoded"] = le.fit_transform(df["genre"].fillna("Unknown"))
    df["spotify_popularity"] = pd.to_numeric(df["spotify_popularity"], errors="coerce").fillna(0)
    df["spotify_followers"] = pd.to_numeric(df["spotify_followers"], errors="coerce").fillna(0)
    df["year"] = pd.to_numeric(df["year"], errors="coerce").fillna(df["year"].median() if "year" in df else 2000)
    return df


def train_model(df: pd.DataFrame):
    """
    XGBRegressor를 학습하고 (model, X_test, y_test, y_pred_test) 튜플을 반환한다.
    5-Fold CV MAE와 Test MAE/RMSE/R²를 콘솔에 출력한다.
    """
    available = [f for f in FEATURES if f in df.columns]
    X = df[available].fillna(0)
    y = np.log1p(df[TARGET])

    # 샘플이 너무 적으면 train/test split 비율과 CV 폴드 수를 자동 축소
    n = len(X)
    test_size = 0.2 if n >= 10 else max(1, int(n * 0.2)) / n
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE
    )

    model = XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        random_state=RANDOM_STATE,
        verbosity=0,
    )

    n_splits = min(5, len(X_train))
    if n_splits < 2:
        print(f"\n[WARN] 학습 샘플 {len(X_train)}개 — CV 생략, 전체 데이터로 학습")
        cv_mae = float("nan")
    else:
        cv_scores = cross_val_score(model, X_train, y_train, cv=n_splits, scoring="neg_mean_absolute_error")
        cv_mae = -cv_scores.mean()
        print(f"\n{n_splits}-Fold CV MAE (log scale): {cv_mae:.4f}")

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"Test  MAE : {mae:.4f}")
    print(f"Test  RMSE: {rmse:.4f}")
    print(f"Test  R²  : {r2:.4f}")

    return model, X_test, y_test, y_pred, available


def plot_feature_importance(model, feature_names: list[str], out_path: str):
    """피처 중요도 상위 7개를 막대그래프로 저장한다."""
    importances = model.feature_importances_
    fi = pd.Series(importances, index=feature_names).sort_values(ascending=False).head(7)

    fig, ax = plt.subplots(figsize=(8, 5))
    sns.barplot(x=fi.values, y=fi.index, ax=ax)
    ax.set_title("피처 중요도 TOP 7")
    ax.set_xlabel("중요도")
    fig.tight_layout()
    fig.savefig(out_path)
    plt.close(fig)
    print(f"피처 중요도 저장 → {out_path}")


def add_predictions(df: pd.DataFrame, model, feature_names: list[str]) -> pd.DataFrame:
    """전체 데이터에 predicted_price와 price_gap 컬럼을 추가한다."""
    X_all = df[feature_names].fillna(0)
    df["predicted_price"] = np.expm1(model.predict(X_all))
    df["price_gap"] = df["predicted_price"] - df["lowest_price"]
    return df


def main():
    """가격 예측 모델 학습 파이프라인 진입점."""
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

    df = load_and_encode(INPUT_PATH)
    model, _, _, _, feature_names = train_model(df)
    plot_feature_importance(model, feature_names, FI_PNG)

    df = add_predictions(df, model, feature_names)

    col_order = [
        "release_id", "title", "artist", "year", "genre",
        "have", "want", "want_have_ratio", "is_limited_edition",
        "spotify_popularity", "lowest_price", "predicted_price", "price_gap", "price_tier",
    ]
    final_cols = [c for c in col_order if c in df.columns]
    df[final_cols].to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\n저장 완료: {OUTPUT_CSV}  ({len(df)}행)")

    print("\n=== 저평가 TOP 10 LP (price_gap 내림차순) ===")
    top10 = (
        df[["title", "artist", "lowest_price", "predicted_price", "price_gap"]]
        .sort_values("price_gap", ascending=False)
        .head(10)
        .reset_index(drop=True)
    )
    print(top10.to_string(index=True))


if __name__ == "__main__":
    main()
