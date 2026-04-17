import Redis from 'ioredis';

let redis: Redis | null = null;

export function initRedis() {
  const redisUrl = process.env.REDIS_URL;

  try {
    redis = redisUrl
      ? new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

    redis.on('error', (err: Error) => {
      console.warn('Redis connection error (feed caching disabled):', err.message);
      redis = null;
    });

    redis.on('connect', () => {
      console.log('Redis connected - feed caching enabled');
    });

    redis.connect().catch(() => {
      console.warn('Redis unavailable - feed caching disabled, using DB fallback');
      redis = null;
    });
  } catch {
    console.warn('Redis init failed - feed caching disabled');
    redis = null;
  }
}

export async function getCache(key: string): Promise<any | null> {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttl: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Ignore cache write failures
  }
}

export async function delPattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    // If pattern has *, use scan; otherwise delete directly
    if (pattern.includes('*')) {
      const stream = redis.scanStream({ match: pattern, count: 100 });
      const pipeline = redis.pipeline();
      let count = 0;
      for await (const keys of stream) {
        for (const key of keys as string[]) {
          pipeline.del(key);
          count++;
        }
      }
      if (count > 0) await pipeline.exec();
    } else {
      await redis.del(pattern);
    }
  } catch {
    // Ignore cache delete failures
  }
}

export function getRedis(): Redis | null {
  return redis;
}
