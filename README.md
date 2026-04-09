# Dance Studio — Landing + Admin MVP

## Stack
- Monorepo: pnpm workspaces + turbo
- Backend: NestJS + Prisma + Postgres (Docker)
- Frontend: Next.js (apps/web) landing
- Admin: Next.js (apps/admin)
- OpenAPI client: packages/openapi-client
- Block templates: packages/block-library

## Prerequisites
- Node.js LTS
- pnpm
- Docker

## Quickstart

### 1) Install
pnpm install

### 2) DB
docker compose up -d

### 3) Backend
cd apps/api
cp .env.example .env
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm start:dev

API: http://localhost:3000  
Swagger: http://localhost:3000/docs

### 4) Generate OpenAPI types
pnpm -C packages/openapi-client gen

### 5) Web (landing)
cd apps/web
cp .env.example .env.local
pnpm dev
# usually http://localhost:3002

### 6) Admin
cd apps/admin
cp .env.example .env.local
pnpm dev
# usually http://localhost:3001

## Admin flows
- Login → httpOnly cookie
- Pages list
- Page details: blocks JSON edit
- Add/Delete blocks
- Reorder blocks
- Publish/Unpublish
- Duplicate page
- Preview draft via preview-token

## Useful commands
- DB down: docker compose down
- Prisma studio: pnpm -C apps/api exec prisma studio


З адмінки можеш в будь-якому блоці в data прописати _layout.order.md/lg і реально отримати інший порядок на планшеті/десктопі — без жодних міграцій.
## Seeding notes

### Theme-only seed (don’t overwrite blocks)
Set `SEED_THEME_ONLY=1` when running the seed to only upsert the published theme.

### Windows (PowerShell)
```powershell
cd apps\api
pnpm exec prisma db seed
```
