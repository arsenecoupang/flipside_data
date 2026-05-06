# backend/main.py
"""
Flipside LP 재판매 대시보드 — FastAPI 진입점.

실행:
    uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import artist, lp
from services.data_service import _cached_lp, _cached_rec, invalidate_cache

logger = logging.getLogger("flipside")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


# ── Lifespan: 앱 시작 시 CSV 1회 로딩 ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작 시 CSV를 미리 로드해 lru_cache를 워밍한다."""
    logger.info("CSV 캐시 워밍 시작...")
    try:
        _cached_lp()
        logger.info("LP 데이터 로드 완료.")
    except FileNotFoundError as e:
        logger.warning("LP CSV 없음 (첫 요청 시 로드 재시도): %s", e)

    try:
        _cached_rec()
        logger.info("추천 데이터 로드 완료.")
    except FileNotFoundError as e:
        logger.warning("추천 CSV 없음 (첫 요청 시 로드 재시도): %s", e)

    yield  # 앱 실행

    logger.info("서버 종료 — 캐시 초기화.")
    invalidate_cache()


# ── FastAPI 앱 ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Flipside LP API",
    version="1.0.0",
    description="LP 재판매 대시보드 백엔드 API",
    lifespan=lifespan,
)

# CORS
_ORIGINS = [
    "http://localhost:5173",   # 로컬 개발
    "http://localhost:4173",   # vite preview
]
# VERCEL_URL 환경변수가 있으면 Vercel 배포 도메인도 허용
_vercel = os.environ.get("VERCEL_URL")
if _vercel:
    _ORIGINS += [f"https://{_vercel}", f"https://{_vercel.replace('.vercel.app', '')}"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 전역 예외 핸들러 ──────────────────────────────────────────────────────────

@app.exception_handler(FileNotFoundError)
async def file_not_found_handler(request: Request, exc: FileNotFoundError):
    """CSV 파일 미존재 → 500."""
    logger.error("FileNotFoundError: %s", exc)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    """예기치 않은 서버 오류 → 500."""
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "서버 내부 오류가 발생했습니다."})


# ── 라우터 등록 ───────────────────────────────────────────────────────────────

app.include_router(lp.router, prefix="/api/lp", tags=["LP"])
app.include_router(artist.router, prefix="/api/artist", tags=["Artist"])


# ── 유틸 엔드포인트 ───────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    """헬스 체크 엔드포인트."""
    return {"status": "ok"}


@app.post("/admin/cache/clear", tags=["System"])
def clear_cache():
    """
    CSV 캐시를 강제 초기화한다.

    csv 파일이 갱신된 후 이 엔드포인트를 호출하면
    다음 요청 시 최신 데이터를 다시 로드한다.
    """
    invalidate_cache()
    logger.info("캐시가 수동으로 초기화됐습니다.")
    return {"status": "cache cleared"}
