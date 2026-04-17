import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let connectionString = process.env.DATABASE_URL!;

// Railway PostgreSQL uses ?sslmode=require in DATABASE_URL.
// The pg driver needs ssl set as a Pool config option, not a URL param.
// Strip sslmode from URL and handle it programmatically.
let sslConfig: boolean | { rejectUnauthorized: boolean } | undefined;

try {
  const parsed = new URL(connectionString);
  const sslMode = parsed.searchParams.get('sslmode');
  if (sslMode) {
    parsed.searchParams.delete('sslmode');
    connectionString = parsed.toString();
    // Any sslmode other than 'disable' means we need SSL
    if (sslMode !== 'disable') {
      sslConfig = { rejectUnauthorized: false };
    }
  }
} catch {
  // If URL parsing fails, just use the string as-is
}

// If no sslmode was in the URL, check environment hints
if (sslConfig === undefined) {
  const isCloud = process.env.NODE_ENV === 'production'
    || !!process.env.RAILWAY_ENVIRONMENT
    || !!process.env.RAILWAY_PROJECT_ID
    || !!process.env.RAILWAY_STATIC_URL;
  if (isCloud) {
    sslConfig = { rejectUnauthorized: false };
  }
}

console.log(`[DB] Connecting... SSL: ${sslConfig ? 'enabled' : 'disabled'}`);

const pool = new Pool({
  connectionString,
  ...(sslConfig ? { ssl: sslConfig } : {}),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

pool.on('connect', () => {
  console.log('[DB] Pool connected successfully');
});

// Cast to any to work around @types/pg version mismatch
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

export default prisma;