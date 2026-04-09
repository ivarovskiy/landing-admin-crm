FROM node:22-alpine
RUN npm install -g pnpm@9
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN rm -rf dist && pnpm exec tsc -p tsconfig.build.json --incremental false
RUN ls -la dist/ || echo "DIST NOT FOUND"
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/src/main"]
