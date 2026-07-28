# Vuka Uzenzele — single-service image.
# Builds the React front-end, then runs the API which also serves the SPA.
# Node 22 gives us the built-in SQLite (no native compilation).

# ---- Stage 1: build the front-end ----
FROM node:22-slim AS web
WORKDIR /web
COPY vuka-app/package*.json ./
RUN npm ci
COPY vuka-app/ ./
RUN npm run build

# ---- Stage 2: install backend production deps ----
FROM node:22-slim AS deps
WORKDIR /api
COPY vuka-server/package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV VUKA_STATIC=/app/public
COPY vuka-server/package*.json ./
COPY --from=deps /api/node_modules ./node_modules
COPY vuka-server/ ./
COPY --from=web /web/dist ./public
EXPOSE 3001
CMD ["node", "--experimental-sqlite", "src/server.mjs"]
