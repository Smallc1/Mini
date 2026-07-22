FROM node:22-alpine AS base
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/' /etc/apk/repositories \
    && apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm ci --registry="$NPM_REGISTRY"

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && mkdir -p /app/data && chown nextjs:nodejs /app/data
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
USER nextjs
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma db push && node server.js"]
