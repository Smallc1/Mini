#!/usr/bin/env bash
set -Eeuo pipefail

usage() { echo "用法: sudo ./deploy/setup-ecs.sh <域名> <证书邮箱> [--no-tls]"; }
DOMAIN="${1:-}"; EMAIL="${2:-}"; TLS="${3:-}"
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then usage; exit 1; fi
if [[ ! "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]]; then echo "域名格式不正确"; exit 1; fi
if [[ "$TLS" != "" && "$TLS" != "--no-tls" ]]; then usage; exit 1; fi
if [[ $EUID -ne 0 ]]; then echo "请使用 sudo 或 root 执行"; exit 1; fi
if [[ ! -f compose.yaml ]]; then echo "请在项目根目录执行"; exit 1; fi

if [[ "$TLS" == "--no-tls" ]]; then
  APP_ORIGIN="http://$DOMAIN"
else
  APP_ORIGIN="https://$DOMAIN"
fi

echo "[1/6] 安装 Docker、Nginx 和 Certbot"
if command -v apt-get >/dev/null; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx openssl curl
elif command -v dnf >/dev/null; then
  dnf install -y docker nginx certbot python3-certbot-nginx openssl curl || dnf install -y docker nginx certbot openssl curl
else
  echo "仅支持 Ubuntu/Debian、Alibaba Cloud Linux/RHEL 系列"; exit 1
fi
systemctl enable --now docker nginx
docker compose version >/dev/null || { echo "未检测到 Docker Compose v2，请先安装 docker-compose-plugin"; exit 1; }

echo "[2/6] 生成生产环境配置"
if [[ ! -f .env.production ]]; then
  SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  umask 077
  cat > .env.production <<EOF
DATABASE_URL="file:../data/production.db"
AUTH_SECRET="$SECRET"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="$APP_ORIGIN"
QQ_SMTP_USER=""
QQ_SMTP_AUTH_CODE=""
EOF
else
  echo ".env.production 已存在，保留原配置"
fi

echo "[3/6] 构建并启动商城"
docker compose up -d --build

echo "[4/6] 等待健康检查"
for _ in {1..40}; do
  if curl -fsS http://127.0.0.1:3001/api/health >/dev/null; then break; fi
  sleep 3
done
curl -fsS http://127.0.0.1:3001/api/health >/dev/null || { docker compose logs --tail=100 web; exit 1; }

echo "[5/6] 配置 Nginx"
sed "s/__DOMAIN__/$DOMAIN/g" deploy/nginx.conf.template > /etc/nginx/conf.d/mini-mall.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl reload nginx

echo "[6/6] 配置 HTTPS"
if [[ "$TLS" != "--no-tls" ]]; then
  certbot --nginx --non-interactive --agree-tos --redirect -m "$EMAIL" -d "$DOMAIN"
else
  echo "已跳过 HTTPS；DNS 生效后运行: certbot --nginx -d $DOMAIN"
fi

echo "部署完成。创建首个管理员：sudo ./deploy/create-admin.sh"
echo "访问：$APP_ORIGIN"
