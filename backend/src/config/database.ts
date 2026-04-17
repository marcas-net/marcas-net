import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Railway and other cloud providers require SSL
const adapterOptions: Record<string, any> = { connectionString };

// If the connection string doesn't explicitly disable SSL, enable it for cloud environments
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  adapterOptions.ssl = process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false };
}

const adapter = new PrismaPg(adapterOptions);

const prisma = new PrismaClient({ adapter });

export default prisma;