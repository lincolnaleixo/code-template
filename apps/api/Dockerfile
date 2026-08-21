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

FROM dependencies AS source
COPY . .

FROM source AS migration
CMD ["sh", "-c", "bun run db:generate && bun run db:migrate"]

FROM source AS build
RUN bun run build:api

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist

USER bun
EXPOSE 3001

CMD ["bun", "apps/api/dist/index.js"]
