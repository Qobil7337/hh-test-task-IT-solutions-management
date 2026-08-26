# CharityHub API — development/evaluation image.
# Single stage on purpose: dev dependencies (prisma CLI, ts-node, dotenv) stay in
# the image so `prisma migrate deploy` and the TypeScript seed can run at
# container start (see the root docker-compose.yml).
FROM node:24-slim

# OpenSSL is required by the Prisma CLI (it warns and may misbehave without it).
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so this layer is cached across source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main"]
