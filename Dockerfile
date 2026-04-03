# ─── Stage 1: Build frontend ──────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ARG VITE_API_URL=/api
ENV VITE_API_URL=/api
RUN npm run build

# ─── Stage 2: Build backend ──────────────────────────────
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npx prisma generate
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

# ─── Stage 3: Production ─────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Copy backend build + deps
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/prisma.config.ts ./

# Copy frontend build into a folder the backend will serve
COPY --from=frontend-build /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads/documents uploads/media

EXPOSE 5000

# Run migrations then start the server
CMD npx prisma migrate deploy && node dist/index.js
