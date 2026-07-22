#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mini-mall}"
mkdir -p "$BACKUP_DIR"
CONTAINER="$(docker compose ps -q web)"
[[ -n "$CONTAINER" ]] || { echo "商城容器未运行"; exit 1; }
NAME="production-$(date +%F-%H%M%S).db"
docker compose exec -T web cp /app/data/production.db "/tmp/$NAME"
docker cp "$CONTAINER:/tmp/$NAME" "$BACKUP_DIR/$NAME"
docker compose exec -T web rm -f "/tmp/$NAME"
find "$BACKUP_DIR" -type f -name 'production-*.db' -mtime +14 -delete
echo "备份完成：$BACKUP_DIR/$NAME"
