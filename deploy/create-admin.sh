#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
read -r -p "管理员邮箱: " ADMIN_EMAIL
read -r -s -p "管理员密码（至少12位）: " ADMIN_PASSWORD
echo
if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then echo "密码不能少于12位"; exit 1; fi
export ADMIN_EMAIL ADMIN_PASSWORD
docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD web npm run prod:admin
unset ADMIN_PASSWORD
