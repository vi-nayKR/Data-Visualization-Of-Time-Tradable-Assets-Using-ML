#!/usr/bin/env bash
set -e

SERVER="vinay@192.168.1.12"
REMOTE_DIR="/home/vinay/stock-market-dashboard"

echo "📦 Deploying FastAPI Backend to sre-control ($SERVER)..."

# Sync backend code
rsync -avz --delete \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='.pytest_cache' \
  ../backend/ ${SERVER}:${REMOTE_DIR}/backend/

# Remote environment setup & restart service
ssh ${SERVER} << 'REMOTE'
  cd /home/vinay/stock-market-dashboard/backend
  if [ ! -d ".venv" ]; then
    python -m venv .venv
  fi
  source .venv/bin/activate
  pip install -r requirements.txt --quiet
  sudo systemctl restart stock-api
  echo "✅ stock-api restarted successfully"
  sudo systemctl status stock-api --no-pager
REMOTE

echo ""
echo "🚀 Deploying Angular Frontend to Cloudflare Pages..."
cd ../frontend
npm run build
npx wrangler pages deploy dist/stock-dashboard/browser
echo "🎉 Frontend deployed to Cloudflare Pages successfully!"
