import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Parse SSL requirements: Railway DATABASE_URL may include ?sslmode=...
// We need to set ssl on the Pool config for the pg driver to work
const url = new URL(connectionString);
const sslMode = url.searchParams.get('sslmode');

// Remove sslmode from connection string since we handle it via Pool config
url.searchParams.delete('sslmode');
const cleanConnectionString = url.toString();

// Determine SSL config
let ssl: any = false;
if (sslMode === 'require' || sslMode === 'no-verify' || sslMode === 'prefer') {
  ssl = { rejectUnauthorized: false };
} else if (sslMode === 'verify-full' || sslMode === 'verify-ca') {
  ssl = true;
} else if (!sslMode) {
  // No explicit sslmode — enable SSL for cloud environments
  const isCloud = process.env.NODE_ENV === 'production'
    || !!process.env.RAILWAY_ENVIRONMENT
    || !!process.env.RAILWAY_PROJECT_ID
    || connectionString.includes('railway');
  if (isCloud) {
    ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

// Use 'as any' to bypass @types/pg version mismatch between project and adapter
const adapter = new PrismaPg(pool as any);

const prisma = new PrismaClient({ adapter });

export default prisma;