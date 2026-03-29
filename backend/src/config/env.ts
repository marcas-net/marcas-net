import logger from '../utils/logger';

const required = ['DATABASE_URL', 'JWT_SECRET'];
const optional = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'BACKEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'SIGNED_URL_SECRET',
  'LOG_LEVEL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
];

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const unset = optional.filter((key) => !process.env[key]);
  if (unset.length > 0) {
    logger.warn(`Optional environment variables not set: ${unset.join(', ')}`);
  }

  logger.info(`Environment validated (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
}
