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

# Start server directly (skip migrate at startup — run manually if needed)
CMD ["node", "dist/index.js"]
