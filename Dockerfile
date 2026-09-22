FROM node:20-alpine AS frontend

WORKDIR /build

COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@9 && pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY --from=frontend /build/dist ./static

# Frontend dist 를 / 에 마운트하는 thin wrapper. agent 가 생성한 app/main.py
# 를 그대로 import 한 뒤 StaticFiles 만 얹어줘서, preview (vite + uvicorn 두
# 프로세스) 와 동일하게 운영 컨테이너 한 개로 frontend+API 둘 다 서빙.
RUN cat > serve.py <<'PY'
from fastapi.staticfiles import StaticFiles
from app.main import app
import os

_static = "/app/static"
if os.path.isdir(_static):
    app.mount("/", StaticFiles(directory=_static, html=True), name="static")
PY

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn serve:app --host 0.0.0.0 --port ${PORT:-8000}"]
