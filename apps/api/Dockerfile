# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN --mount=type=cache,target=/root/.bun/install/cache bun ci

FROM dependencies AS source
COPY --chown=bun:bun . .

FROM source AS migration
ENV NODE_ENV=production
USER bun
CMD ["bun", "run", "db:migrate"]

FROM source AS build
RUN bun run build:api

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

RUN apk upgrade --no-cache

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY --from=build --chown=bun:bun /app/apps/api/dist ./apps/api/dist

USER bun
EXPOSE 3001

CMD ["bun", "apps/api/dist/index.js"]
