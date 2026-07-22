# Mini Mall（Web + 移动端 PWA）

可正式部署的轻量商城：网页版与可安装的移动端 PWA 共用账户、商品、购物车、订单和后台。

## 生产上线

1. 复制 `.env.example` 为 `.env.production`，设置正式域名，并用 `openssl rand -base64 32` 生成新的 `AUTH_SECRET`。
2. 执行 `docker compose up -d --build`；容器启动时会安全同步数据库结构，不会清空已有数据。
3. 仅在全新数据库首次启动后执行 `docker compose exec web npm run db:seed` 创建初始数据。不要在生产环境执行 `db:reset`。
4. 由 Nginx/Caddy 将 HTTPS 域名反向代理到 `127.0.0.1:3001`。
5. 用 `/api/health` 接入负载均衡或监控。数据库保存在 Docker 的 `mall-data` 卷中，必须纳入每日备份。

移动端无需单独发布代码包：在 HTTPS 域名中打开商城，Android/Chrome 选择“安装应用”；iPhone/Safari 选择“分享 → 添加到主屏幕”。PWA 使用同一正式域名，订单、登录和管理功能不会产生双端数据同步问题。

> 当前收款仍是个人二维码 + 管理员人工审核，不是持牌支付接口。公开经营前请接入合规支付服务商，并补充隐私政策、用户协议、备案/许可证、售后与发票信息。

### 阿里云 ECS 一键部署

先在阿里云安全组开放 `22、80、443`（不要开放 `3001`），将已备案域名的 A 记录解析到 ECS 公网 IP。把项目上传到服务器后，在项目根目录运行：

```bash
chmod +x deploy/*.sh
sudo ./deploy/setup-ecs.sh shop.example.com admin@example.com
sudo ./deploy/create-admin.sh
```

脚本支持 Ubuntu/Debian 和 Alibaba Cloud Linux/RHEL 系列，会安装 Docker、Nginx、Certbot，生成密钥、构建容器、检查健康状态并申请 HTTPS。DNS 尚未生效时可增加 `--no-tls`，之后手动运行 `certbot --nginx -d shop.example.com`。

暂时没有域名时，也可以先用 ECS 公网 IP 部署 HTTP 版本（阿里云安全组只需开放 `80`，不要开放 `3001`）：

```bash
sudo ./deploy/setup-ecs.sh 120.26.116.92 admin@example.com --no-tls
```

此时访问 `http://120.26.116.92`。获得已备案域名后，应将域名解析到该 IP、更新 `.env.production` 中的 `NEXT_PUBLIC_APP_URL`，并配置 HTTPS；生产经营不建议长期使用纯 HTTP。

更新和备份：

```bash
sudo ./deploy/update.sh
sudo ./deploy/backup.sh
```

备份默认保存在 `/var/backups/mini-mall` 并保留 14 天；生产环境还应同步到阿里云 OSS。

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Prisma 5** + **SQLite**
- **Auth.js v5** (NextAuth, credentials provider, JWT sessions)
- **Tailwind CSS 4**
- **bcryptjs** for password hashing, **zod** for validation

> Built with the webpack bundler (`next build --webpack`) rather than Turbopack, because Turbopack currently panics on non-ASCII characters in the project path (this repo lives under `桌面/`).

## Getting started

```bash
npm install          # installs deps and runs `prisma generate`
npm run db:reset     # creates the SQLite DB and seeds demo data
npm run dev          # start the dev server at http://localhost:3001
```

`npm install` writes the SQLite schema via `prisma generate`; `db:reset` (or `db:push` + `db:seed`) creates and populates `prisma/dev.db`.

### 局域网内其他电脑访问

开发服务器已监听 `0.0.0.0:3001`。让两台电脑连接同一个路由器/Wi-Fi，在运行本项目的电脑上执行：

```bash
npm run dev
hostname -I
```

从 `hostname -I` 的结果中找到局域网 IPv4 地址（通常以 `192.168.`、`10.` 或 `172.16`–`172.31` 开头），然后在其他电脑浏览器访问：

```text
http://<局域网IP>:3001
```

例如本机地址是 `192.168.1.108`，访问 `http://192.168.1.108:3001`。不要在其他电脑上访问 `localhost:3001`，因为 `localhost` 始终指向当前那台电脑。

若仍无法访问，请确认系统防火墙允许 TCP `3001` 端口，并关闭路由器的“AP/客户端隔离”。Ubuntu 使用 UFW 时可执行 `sudo ufw allow 3001/tcp`。这里只适合可信局域网内开发预览；需要互联网访问时应按“生产上线”章节使用 HTTPS 与反向代理，不要直接暴露开发服务器。

### Environment

本地开发使用 `.env`（不会提交到版本库）；生产环境从 `.env.example` 创建 `.env.production`：

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="..."
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

## Demo accounts

| Role     | Email                | Password   |
| -------- | -------------------- | ---------- |
| Admin    | admin@minimall.com   | admin123   |
| Customer | user@minimall.com    | user123    |

## Features

- **Shop** — product grid, detail pages, keyword search, category filter (`/products`)
- **Auth** — register + login, session-aware navbar, route protection via middleware
- **Cart** — per-user, DB-backed, quantity updates capped to stock
- **Checkout** — shipping form + simulated payment; creates a `PAID` order in a transaction that decrements stock and clears the cart
- **Orders** — customer order history and detail (`/orders`)
- **Admin** (`/admin`, ADMIN role only) — dashboard stats, product CRUD, category CRUD, order status management

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server (webpack, `0.0.0.0:3001`)         |
| `npm run build`     | Production build (webpack)                   |
| `npm run start`     | Serve the production build on `0.0.0.0:3001` |
| `npm run db:push`   | Push schema to SQLite                        |
| `npm run db:seed`   | Seed demo data                               |
| `npm run db:reset`  | Reset DB and reseed                          |

## Notes

- Prices are stored as integer **cents** to avoid floating-point issues.
- Payment is **simulated** — no gateway is called; orders are created directly as `PAID`.
- Admin routes are protected in two layers: `middleware.ts` (role check on request) and the `/admin` layout (server-side session check).
