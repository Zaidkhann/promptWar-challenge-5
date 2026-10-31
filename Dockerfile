# Stage 1: Build client and server
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install python and build tools for native SQLite addons
RUN apk add --no-cache python3 make g++

# Install dependencies
RUN npm run postinstall

# Copy source files
COPY client/ ./client/
COPY server/ ./server/

# Build client and server
RUN npm run build

# Stage 2: Production runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=./data/celebraplan.sqlite

RUN apk add --no-cache python3 make g++

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/client/package.json ./client/package.json
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

# Ensure data directory exists
RUN mkdir -p /app/server/data

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
