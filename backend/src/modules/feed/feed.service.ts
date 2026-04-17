import prisma from '../../config/database';
import { getCache, setCache, delPattern } from '../../config/redis';
import { FEED_CONFIG, type UserSignals, type CandidatePost, type ScoredPost } from './feed.types';
import { computePostScore, rerankFeed } from './feed.utils';

// ─── Post include shape (matches existing controller) ───

function postInclude(userId?: string) {
  const base: Record<string, any> = {
    author: {
      select: {
        id: true, name: true, role: true, avatarUrl: true, country: true,
        _count: { select: { followsReceived: true } },
      },
    },
    organization: { select: { id: true, name: true, type: true } },
    comments: {
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' as const },
    },
    _count: { select: { comments: true, likes: true, reposts: true } },
    repostOf: {
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { likes: true, comments: true, reposts: true } },
        media: { select: { id: true, url: true, type: true, filename: true, size: true } },
      },
    },
    pollOptions: {
      include: {
        _count: { select: { votes: true } },
        ...(userId ? { votes: { where: { userId }, select: { userId: true } } } : {}),
      },
    },
    media: { select: { id: true, url: true, type: true, filename: true, size: true } },
  };
  if (userId) {
    base.likes = { where: { userId } };
  }
  return base;
}

// ─── Map post to API shape ──────────────────────────────

function mapPost(p: any, userId?: string, baseUrl?: string) {
  const toAbsoluteUrl = (url: string) => {
    if (!url || url.startsWith('http')) return url;
    return baseUrl ? `${baseUrl}${url}` : url;
  };
  const media = (p.media ?? []).map((m: any) => ({ ...m, url: toAbsoluteUrl(m.url) }));
  return {
    ...p,
    media,
    editedAt: p.editedAt ?? null,
    likedByMe: userId ? (p.likes?.length > 0) : false,
    likesCount: p._count?.likes ?? 0,
    commentsCount: p._count?.comments ?? 0,
    repostsCount: p._count?.reposts ?? 0,
    pollOptions: (p.pollOptions ?? []).map((o: any) => ({
      id: o.id,
      text: o.text,
      votesCount: o._count?.votes ?? 0,
      votedByMe: userId ? (o.votes ?? []).some((v: any) => v.userId === userId) : false,
    })),
    repostOf: p.repostOf ? {
      ...p.repostOf,
      media: (p.repostOf.media ?? []).map((m: any) => ({ ...m, url: toAbsoluteUrl(m.url) })),
      likesCount: p.repostOf._count?.likes ?? 0,
      commentsCount: p.repostOf._count?.comments ?? 0,
      repostsCount: p.repostOf._count?.reposts ?? 0,
    } : null,
    likes: undefined,
    _count: undefined,
  };
}

// ─── Build User Signals ─────────────────────────────────

async function getUserSignals(userId: string): Promise<UserSignals> {
  const cacheKey = `user:signals:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached as UserSignals;

  const [user, follows, feedEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true, country: true, organization: { select: { type: true } } },
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingUserId: true, followingOrgId: true },
    }),
    // Get recent feed events if table exists
    safeQuery<{ postId: string; action: string; createdAt: Date; post: { authorId: string } }[]>(
      () => (prisma as any).feedEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { postId: true, action: true, createdAt: true, post: { select: { authorId: true } } },
      }),
      []
    ),
  ]);

  const signals: UserSignals = {
    followedUserIds: follows.filter(f => f.followingUserId).map(f => f.followingUserId!),
    followedOrgIds: follows.filter(f => f.followingOrgId).map(f => f.followingOrgId!),
    role: user?.role ?? 'USER',
    organizationId: user?.organizationId ?? null,
    orgType: user?.organization?.type ?? null,
    country: user?.country ?? null,
    recentInteractions: feedEvents.map(e => ({
      postId: e.postId,
      authorId: e.post?.authorId ?? '',
      action: e.action,
      createdAt: e.createdAt,
    })),
    recentSearches: [],
  };

  await setCache(cacheKey, signals, FEED_CONFIG.CANDIDATE_CACHE_TTL_SECONDS);
  return signals;
}

// ─── Build Candidate Pool ───────────────────────────────

async function buildCandidatePool(userId: string, signals: UserSignals): Promise<CandidatePost[]> {
  const cacheKey = `feed:candidates:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached as CandidatePost[];

  const maxPool = FEED_CONFIG.CANDIDATE_POOL_SIZE;
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Parallelize candidate queries
  const [networkPosts, rolePosts, trendingPosts, discoveryPosts] = await Promise.all([
    // 1. Posts from followed users/orgs + same org
    prisma.post.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        OR: [
          { authorId: { in: signals.followedUserIds.length > 0 ? signals.followedUserIds : ['__none__'] } },
          { organizationId: { in: signals.followedOrgIds.length > 0 ? signals.followedOrgIds : ['__none__'] } },
          ...(signals.organizationId ? [{ organizationId: signals.organizationId }] : []),
        ],
      },
      include: postInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(maxPool * 0.4),
    }),

    // 2. Same role / geo match
    prisma.post.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        authorId: { not: userId },
        author: {
          OR: [
            { role: signals.role as any },
            ...(signals.country ? [{ country: signals.country }] : []),
          ],
        },
      },
      include: postInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(maxPool * 0.2),
    }),

    // 3. Trending posts (high engagement)
    prisma.post.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        authorId: { not: userId },
      },
      include: postInclude(userId),
      orderBy: [{ likes: { _count: 'desc' } }, { comments: { _count: 'desc' } }],
      take: Math.ceil(maxPool * 0.2),
    }),

    // 4. Discovery posts (newest, random exploration)
    prisma.post.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        authorId: { not: userId },
      },
      include: postInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(maxPool * 0.2),
    }),
  ]);

  // Deduplicate
  const seen = new Set<string>();
  const pool: CandidatePost[] = [];

  for (const batch of [networkPosts, rolePosts, trendingPosts, discoveryPosts]) {
    for (const post of batch) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        pool.push(post as any);
      }
    }
  }

  await setCache(cacheKey, pool, FEED_CONFIG.CANDIDATE_CACHE_TTL_SECONDS);
  return pool.slice(0, maxPool);
}

// ─── Main: Personalized Feed ────────────────────────────

export async function getPersonalizedFeed(
  userId: string,
  page: number,
  limit: number,
  baseUrl: string,
  sessionSignals?: { recentSearches?: string[] }
) {
  const cacheKey = `feed:user:${userId}:page:${page}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const signals = await getUserSignals(userId);

  // Merge session signals
  if (sessionSignals?.recentSearches) {
    signals.recentSearches = sessionSignals.recentSearches;
  }

  // Build candidate pool
  const candidates = await buildCandidatePool(userId, signals);

  // Collect recent categories for fatigue tracking
  const recentCategories = candidates.slice(0, 20).map(p => p.category);

  // Score all candidates
  const scored = candidates.map(post => computePostScore(post, signals, recentCategories));

  // Rerank with diversity controls
  const totalSize = Math.min(scored.length, limit * 5); // enough for pagination
  const reranked = rerankFeed(scored, totalSize);

  // Paginate
  const startIdx = (page - 1) * limit;
  const pageItems = reranked.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < reranked.length;

  const posts = pageItems.map(item => mapPost(item.post, userId, baseUrl));

  const result = {
    posts,
    page,
    hasMore,
    total: reranked.length,
  };

  await setCache(cacheKey, result, FEED_CONFIG.CACHE_TTL_SECONDS);

  // Preload next page asynchronously
  if (hasMore) {
    const nextKey = `feed:user:${userId}:page:${page + 1}`;
    const nextItems = reranked.slice(startIdx + limit, startIdx + 2 * limit);
    const nextPosts = nextItems.map(item => mapPost(item.post, userId, baseUrl));
    setCache(nextKey, {
      posts: nextPosts,
      page: page + 1,
      hasMore: startIdx + 2 * limit < reranked.length,
      total: reranked.length,
    }, FEED_CONFIG.CACHE_TTL_SECONDS).catch(() => {});
  }

  return result;
}

// ─── Log Feed Event ─────────────────────────────────────

export async function logFeedEvent(userId: string, postId: string, action: string) {
  try {
    await (prisma as any).feedEvent.create({
      data: { userId, postId, action },
    });
    // Invalidate user signals cache
    await delPattern(`user:signals:${userId}`);
  } catch {
    // FeedEvent table may not exist yet - ignore silently
  }
}

// ─── Cache Invalidation ─────────────────────────────────

export async function invalidateFeedCache(userId: string) {
  await Promise.all([
    delPattern(`feed:user:${userId}:*`),
    delPattern(`feed:candidates:${userId}`),
    delPattern(`user:signals:${userId}`),
  ]);
}

// ─── Safe Query Helper ──────────────────────────────────

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
