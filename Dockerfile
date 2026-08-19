# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run db:init
RUN npm run build

# Runtime
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Make sure the app listens on the correct port
ENV PORT=3309

EXPOSE 3309
CMD ["node", "server.js"]