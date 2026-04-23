import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

import { validateEnv } from './config/env';
import { initSocketServer } from './utils/socket';
import { initRedis } from './config/redis';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import orgRoutes from './routes/organizations';
import docRoutes from './routes/documents';
import activityRoutes from './routes/activity';
import notificationRoutes from './routes/notifications';
import invitationRoutes from './routes/invitations';
import adminRoutes from './routes/admin';
import searchRoutes from './routes/search';
import marketplaceRoutes from './routes/marketplace';
import feedRoutes from './routes/feed';
import jobRoutes from './routes/jobs';
import oauthRoutes from './routes/oauth';
import messagingRoutes from './routes/messaging';
import formRoutes from './routes/forms';
import prisma from './config/database';

validateEnv();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initSocketServer(httpServer);

// Initialize Redis (optional, for feed caching)
initRedis();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(__dirname, '../uploads/documents');
const mediaDir = path.join(__dirname, '../uploads/media');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

// Serve uploads BEFORE Helmet so security headers (nosniff, COEP) don't trigger ORB
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  next();
}, express.static(uploadsDir, {
  dotfiles: 'ignore',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}), (_req, res) => {
  res.status(404).end();
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MarcasNet API',
      version: '2.0.0',
      description: 'API documentation for the MarcasNet food & nutrition collaboration platform',
    },
    servers: [
      { url: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`, description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, './routes/*.js'), path.join(__dirname, './routes/*.ts')],
});
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/forms', formRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB query timeout (5s)')), 5000));
    await Promise.race([prisma.$queryRawUnsafe('SELECT 1'), timeout]);
    dbStatus = 'connected';
  } catch (e: any) {
    dbStatus = `error: ${e?.message || 'unknown'}`;
  }
  res.json({ status: 'OK', message: 'MarcasNet API is running', db: dbStatus, timestamp: new Date().toISOString() });
});

// ─── Serve frontend in production ────────────────────────
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback: any non-API route serves index.html
  app.get(/^(?!\/api\/)(?!\/uploads\/)(?!\/socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ status: 'OK', name: 'MarcasNet API', version: '2.0.0' });
  });
}

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

async function runStartupMigrations() {
  try {
    // Add any columns the schema requires that may be missing in production.
    // All statements are idempotent – safe to run on every startup.
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "headline" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "post_media" ADD COLUMN IF NOT EXISTS "publicId" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT`);

    // Skills array column needs special handling (NOT NULL DEFAULT)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'skills'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT '{}';
        END IF;
      END
      $$
    `);

    // Backfill usernames for users that don't have one
    await prisma.$executeRawUnsafe(`
      UPDATE "users"
      SET "username" = LOWER(REGEXP_REPLACE(
        COALESCE(NULLIF(TRIM("name"), ''), SPLIT_PART("email", '@', 1)),
        '[^a-zA-Z0-9]', '_', 'g'
      )) || '_' || SUBSTRING("id", 1, 6)
      WHERE "username" IS NULL
    `);

    // Unique index on username (idempotent)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_username_key'
        ) THEN
          CREATE UNIQUE INDEX users_username_key ON "users"("username");
        END IF;
      END
      $$
    `);

    logger.info('[startup] DB migrations applied');
  } catch (err: any) {
    logger.error('[startup] Migration error (non-fatal):', err?.message ?? err);
  }
}

async function start() {
  await runStartupMigrations();
  httpServer.listen(PORT, () => {
    logger.info(`MarcasNet server running on port ${PORT}`);
  });
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});