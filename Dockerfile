FROM node:22-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy prisma files and generate client
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npx prisma generate

# Copy backend source and compile TypeScript
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

# Expose port
EXPOSE 3000

# Run migrations then start server
CMD npx prisma migrate deploy && node dist/index.js
