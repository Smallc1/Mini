#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
[[ -f .env.production ]] || { echo "缺少 .env.production"; exit 1; }
docker compose build --pull web
docker compose up -d --remove-orphans
curl --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:3001/api/health
docker image prune -f
echo "商城更新完成"
