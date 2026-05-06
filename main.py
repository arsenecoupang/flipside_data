# 사용법: python main.py
# 필요 패키지: pip install python-discogs-client spotipy pandas xgboost scikit-learn matplotlib seaborn

"""
Flipside LP 재판매 분석 — 원클릭 통합 파이프라인

Step 1: Discogs + Spotify 데이터 수집  → lp_raw_data.csv
Step 2: 전처리 및 EDA                  → lp_clean_data.csv + EDA PNG 5개
Step 3: 가격 예측 모델 학습            → lp_analysis_final.csv + feature_importance.png
Step 4: 아티스트 유사도 추천           → lp_recommendations.csv
Step 5: 비즈니스 인사이트 리포트 생성 → report.md
"""

import io
import logging
import os
import sys
import time
from datetime import datetime

# Windows CP949 터미널에서 한글·특수문자 깨짐 방지
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ── CONFIG — .env 또는 환경변수에서 읽음 ──────────────────────────────────────
# 로컬 실행: .env 파일에 아래 값들을 설정하거나 환경변수로 직접 지정
DISCOGS_TOKEN       = os.environ.get("DISCOGS_TOKEN", "")
SPOTIFY_CLIENT_ID   = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")

RELEASE_IDS = [249504, 1443762, 3185713]
TARGET_ARTISTS = ["Radiohead", "Portishead", "Massive Attack"]
OUTPUT_DIR = "./output"
# ───────────────────────────────────────────────────────────────────────────────

# 각 모듈이 참조하는 CONFIG를 환경변수로 전달
os.environ.setdefault("DISCOGS_TOKEN", DISCOGS_TOKEN)
os.environ.setdefault("SPOTIFY_CLIENT_ID", SPOTIFY_CLIENT_ID)
os.environ.setdefault("SPOTIFY_CLIENT_SECRET", SPOTIFY_CLIENT_SECRET)

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def _ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def step1_collect() -> int:
    """Discogs + Spotify 데이터를 수집하고 lp_raw_data.csv를 저장한다."""
    import collect_data as cd

    cd.DISCOGS_TOKEN = DISCOGS_TOKEN
    cd.SPOTIFY_CLIENT_ID = SPOTIFY_CLIENT_ID
    cd.SPOTIFY_CLIENT_SECRET = SPOTIFY_CLIENT_SECRET
    cd.RELEASE_IDS = RELEASE_IDS
    cd.OUTPUT_PATH = os.path.join(OUTPUT_DIR, "lp_raw_data.csv")

    df = cd.collect_all(RELEASE_IDS)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df.to_csv(cd.OUTPUT_PATH, index=False, encoding="utf-8-sig")
    return len(df)


def step2_preprocess() -> int:
    """전처리 및 EDA를 수행하고 lp_clean_data.csv와 PNG를 저장한다."""
    import preprocess_eda as pe

    pe.INPUT_PATH = os.path.join(OUTPUT_DIR, "lp_raw_data.csv")
    pe.OUTPUT_CSV = os.path.join(OUTPUT_DIR, "lp_clean_data.csv")
    pe.NO_PRICE_CSV = os.path.join(OUTPUT_DIR, "lp_no_price.csv")
    pe.OUTPUT_DIR = OUTPUT_DIR

    import pandas as pd

    df = pe.load_and_audit(pe.INPUT_PATH)
    df = pe.add_derived_features(df)
    df = pe.remove_outliers_iqr(df)
    pe.plot_all(df, OUTPUT_DIR)
    df.to_csv(pe.OUTPUT_CSV, index=False, encoding="utf-8-sig")
    return len(df)


def step3_model() -> int:
    """가격 예측 모델을 학습하고 lp_analysis_final.csv를 저장한다."""
    import price_model as pm

    pm.INPUT_PATH = os.path.join(OUTPUT_DIR, "lp_clean_data.csv")
    pm.OUTPUT_CSV = os.path.join(OUTPUT_DIR, "lp_analysis_final.csv")
    pm.FI_PNG = os.path.join(OUTPUT_DIR, "feature_importance.png")

    import pandas as pd

    df = pm.load_and_encode(pm.INPUT_PATH)
    model, _, _, _, feature_names = pm.train_model(df)
    pm.plot_feature_importance(model, feature_names, pm.FI_PNG)
    df = pm.add_predictions(df, model, feature_names)

    col_order = [
        "release_id",
        "title",
        "artist",
        "year",
        "genre",
        "have",
        "want",
        "want_have_ratio",
        "is_limited_edition",
        "spotify_popularity",
        "lowest_price",
        "predicted_price",
        "price_gap",
        "price_tier",
    ]
    final_cols = [c for c in col_order if c in df.columns]
    df[final_cols].to_csv(pm.OUTPUT_CSV, index=False, encoding="utf-8-sig")
    return len(df)


def step4_recommend() -> int:
    """추천 시스템을 실행하고 lp_recommendations.csv를 저장한다."""
    import pandas as pd

    import recommend as rc

    rc.SPOTIFY_CLIENT_ID = SPOTIFY_CLIENT_ID
    rc.SPOTIFY_CLIENT_SECRET = SPOTIFY_CLIENT_SECRET
    rc.INVENTORY_PATH = os.path.join(OUTPUT_DIR, "lp_analysis_final.csv")
    rc.OUTPUT_PATH = os.path.join(OUTPUT_DIR, "lp_recommendations.csv")
    rc.TARGET_ARTISTS = TARGET_ARTISTS

    sp = rc.init_spotify()
    inventory = pd.read_csv(rc.INVENTORY_PATH)
    result = rc.batch_recommend(TARGET_ARTISTS, inventory, sp)
    return len(result)


def step5_report():
    """비즈니스 인사이트 리포트를 생성하고 report.md를 저장한다."""
    import generate_report as gr

    gr.ANALYSIS_CSV = os.path.join(OUTPUT_DIR, "lp_analysis_final.csv")
    gr.RECOMMEND_CSV = os.path.join(OUTPUT_DIR, "lp_recommendations.csv")
    gr.OUTPUT_MD = os.path.join(OUTPUT_DIR, "report.md")
    gr.main()


def run_step(step_num: int, label: str, fn, *args, **kwargs):
    """
    단일 Step을 실행하고 타임스탬프 로그를 출력한다.
    실패 시 이전 결과를 보존하고 다음 Step으로 넘어간다.
    """
    log.info(f"[{_ts()}] STEP {step_num} 시작: {label}")
    t0 = time.time()
    try:
        result = fn(*args, **kwargs)
        elapsed = time.time() - t0
        suffix = f"총 {result}개 처리됨" if isinstance(result, int) else "완료"
        log.info(f"[{_ts()}] STEP {step_num} 완료: {label} — {suffix} ({elapsed:.1f}s)")
        return True
    except Exception as e:
        log.error(f"[{_ts()}] STEP {step_num} 실패: {label} — {e}")
        return False


def print_summary(results: dict[int, bool]):
    """실행 완료 후 생성 파일 목록과 Step 결과를 출력한다."""
    files = [
        ("lp_raw_data.csv", "원본 수집 데이터"),
        ("lp_no_price.csv", "가격 없는 항목"),
        ("lp_clean_data.csv", "전처리 완료 데이터"),
        ("lp_analysis_final.csv", "예측가·가격갭 포함 최종 분석"),
        ("lp_recommendations.csv", "아티스트별 LP 추천"),
        ("eda_01_genre.png", "EDA: 장르별 평균가"),
        ("eda_02_ratio_vs_price.png", "EDA: 수요비율 vs 가격"),
        ("eda_03_year.png", "EDA: 연도별 가격 추이"),
        ("eda_04_spotify.png", "EDA: Spotify 인기도 vs 가격"),
        ("eda_05_limited.png", "EDA: 한정판 가격 분포"),
        ("feature_importance.png", "피처 중요도 TOP 7"),
        ("report.md", "비즈니스 인사이트 리포트"),
    ]

    print("\n" + "=" * 56)
    print("  생성된 파일 목록")
    print("=" * 56)
    for fname, desc in files:
        path = os.path.join(OUTPUT_DIR, fname)
        status = "✓" if os.path.exists(path) else "✗"
        print(f"  [{status}] {fname:<30} {desc}")

    print("\n  Step 결과 요약")
    print("-" * 56)
    labels = {
        1: "데이터 수집",
        2: "전처리·EDA",
        3: "가격 예측 모델",
        4: "추천 시스템",
        5: "리포트 생성",
    }
    for step_num, success in results.items():
        mark = "OK" if success else "FAIL"
        print(f"  [{mark}] STEP {step_num}: {labels[step_num]}")
    print("=" * 56)


def main():
    """전체 파이프라인 진입점."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = {}

    results[1] = run_step(1, "데이터 수집 (Discogs + Spotify)", step1_collect)
    results[2] = run_step(2, "전처리 및 EDA", step2_preprocess)
    results[3] = run_step(3, "가격 예측 모델 학습 (XGBoost)", step3_model)
    results[4] = run_step(4, "아티스트 유사도 추천 시스템", step4_recommend)
    results[5] = run_step(5, "비즈니스 인사이트 리포트 생성", step5_report)

    print_summary(results)


if __name__ == "__main__":
    main()
