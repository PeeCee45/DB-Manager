# =========================
# Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


# =========================
# Runtime
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3309

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Needed because db:init is outside the standalone bundle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package*.json ./

EXPOSE 3309

CMD ["sh", "-c", "npm run db:init && node server.js"]