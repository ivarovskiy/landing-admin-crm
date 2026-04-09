FROM node:22-alpine
RUN npm install -g pnpm@9
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -C apps/api exec prisma generate
RUN pnpm -C apps/api build
EXPOSE 3000
CMD ["node", "apps/api/dist/main"]
