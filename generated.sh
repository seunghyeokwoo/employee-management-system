#!/bin/bash
set -e

# Start PostgreSQL
start-pg.sh

# Backend
cd /workspace
pip install -r requirements.txt 2>&1
WATCHFILES_FORCE_POLLING=1 nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir /workspace/app > /tmp/backend.log 2>&1 &

# Frontend (use pre-cached node_modules if available)
cd /workspace
if [ -d /home/sandbox/node_cache/node_modules ] && [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  mkdir -p node_modules
  find /home/sandbox/node_cache/node_modules/ -mindepth 1 -maxdepth 1 -exec cp -a {} node_modules/ ';'
fi
npm install --legacy-peer-deps 2>&1
nohup npx vite --host 0.0.0.0 --port 5173 --strictPort > /tmp/frontend.log 2>&1 &

echo "All services started"