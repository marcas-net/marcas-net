import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Build PoolConfig with proper SSL for Railway/cloud environments
const poolConfig: Record<string, any> = {
  connectionString,
};

// Enable SSL for production/Railway/cloud unless explicitly disabled
const isCloud = process.env.NODE_ENV === 'production'
  || !!process.env.RAILWAY_ENVIRONMENT
  || !!process.env.RAILWAY_PROJECT_ID
  || connectionString.includes('railway');

if (isCloud && process.env.DATABASE_SSL !== 'false') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const adapter = new PrismaPg(poolConfig as any);

const prisma = new PrismaClient({ adapter });

export default prisma;