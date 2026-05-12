# BookMatch API — Node + Prisma + Python (scripts de analytics)
# Supabase: define DATABASE_URL, DIRECT_URL y el resto en runtime (env / compose).

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- Runtime ---
FROM node:22-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    python3-venv \
    python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY scripts ./scripts
COPY requirements.txt ./

RUN python3 -m venv venv \
  && ./venv/bin/pip install --no-cache-dir --upgrade pip \
  && ./venv/bin/pip install --no-cache-dir -r requirements.txt

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
