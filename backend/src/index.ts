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
import prisma from './config/database';

validateEnv();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initSocketServer(httpServer);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(__dirname, '../uploads/documents');
const mediaDir = path.join(__dirname, '../uploads/media');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'MarcasNet API is running', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({ status: 'OK', name: 'MarcasNet API', version: '2.0.0' });
});

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

httpServer.listen(PORT, () => {
  logger.info(`MarcasNet server running on port ${PORT}`);
});

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