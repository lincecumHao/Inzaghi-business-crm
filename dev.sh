#!/bin/bash

# ── 等待 Docker Desktop 啟動 ──────────────────────────────────
echo "⏳ 等待 Docker Desktop 啟動..."
open -a Docker

until docker info > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Docker 已就緒"

# ── 啟動 Supabase ─────────────────────────────────────────────
echo "⏳ 啟動 Supabase..."
supabase start

# ── 啟動 Next.js dev server ───────────────────────────────────
echo "🚀 啟動開發伺服器..."
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20.19.0

npm run dev
