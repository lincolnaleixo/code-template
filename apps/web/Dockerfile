FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/desktop/package.json apps/desktop/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install

FROM dependencies AS build
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN bun run build:web

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.output ./apps/web/.output

USER bun
EXPOSE 3000

CMD ["bun", "apps/web/.output/server/index.mjs"]
