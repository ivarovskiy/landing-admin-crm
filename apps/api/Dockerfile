FROM node:22-alpine
RUN npm install -g pnpm@9
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build
RUN ls -la dist/ || echo "DIST NOT FOUND"
EXPOSE 3000
CMD ["node", "dist/main"]
