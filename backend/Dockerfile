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

# Copy fix SQL
COPY fix-schema.sql ./

# Run migrations with a hard 90s timeout, then ALWAYS start the server
CMD sh -c "timeout 90 sh -c 'npx prisma migrate resolve --applied 20260422000000_organization_system_expansion --schema=./prisma/schema.prisma 2>/dev/null; npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1; npx prisma db execute --file=./fix-schema.sql --schema=./prisma/schema.prisma 2>&1' || echo 'Migrations skipped or timed out'; exec node dist/index.js"
