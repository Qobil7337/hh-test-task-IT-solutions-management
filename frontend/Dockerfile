# CharityHub frontend — production build served by `next start`.
FROM node:24-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

# GRAPHQL_URL is provided at runtime (see the root docker-compose.yml).
CMD ["npm", "run", "start"]
