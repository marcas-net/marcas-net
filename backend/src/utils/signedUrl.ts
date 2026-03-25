import crypto from 'crypto';

const SECRET = process.env.SIGNED_URL_SECRET || process.env.JWT_SECRET || 'marcas-signed-url-secret';

export const generateSignedUrl = (documentId: string, expiresInMinutes = 30): string => {
  const expires = Date.now() + expiresInMinutes * 60 * 1000;
  const data = `${documentId}:${expires}`;
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return `${documentId}?expires=${expires}&signature=${signature}`;
};

export const verifySignedUrl = (documentId: string, expires: string, signature: string): boolean => {
  const expiresNum = parseInt(expires, 10);
  if (isNaN(expiresNum) || Date.now() > expiresNum) return false;
  const data = `${documentId}:${expiresNum}`;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
