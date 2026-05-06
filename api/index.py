# api/index.py
"""
Vercel 서버리스 Python 함수 진입점.
Vercel은 이 파일의 `app` 변수를 ASGI 핸들러로 자동 인식한다.
"""
import sys
import os

# backend 패키지 경로를 Python path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: F401 — Vercel이 `app`을 직접 참조
