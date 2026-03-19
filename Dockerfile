FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for building)
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

# Copy source code for building frontend
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY src/ ./src/

# Set env var needed at build time by vite.config.ts
ARG GEMINI_API_KEY=""
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Build the frontend
RUN npx vite build

# --- Production stage ---
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
RUN npm install tsx

# Copy server  
COPY server.ts ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
