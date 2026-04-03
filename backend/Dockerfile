FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma files and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Create uploads directories
RUN mkdir -p uploads/documents uploads/media

# Expose port (Railway sets PORT dynamically)
EXPOSE 5000

# Start server — migrate first but don't block startup on failure
CMD sh -c 'npx prisma migrate deploy || echo "Migration warning: continuing anyway" && node dist/index.js'
