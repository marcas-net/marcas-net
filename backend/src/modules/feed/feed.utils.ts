import { FEED_CONFIG, SCORE_WEIGHTS, type UserSignals, type CandidatePost, type ScoredPost } from './feed.types';

// ─── Helpers ────────────────────────────────────────────

function decayWeight(date: Date, lambda: number): number {
  const ageHours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
  return Math.exp(-lambda * ageHours);
}

// ─── 1. Relevance Score (0.25) ──────────────────────────
// Role match, org-type match, geo match, topic/category match, keyword similarity

export function relevanceScore(post: CandidatePost, signals: UserSignals): number {
  let score = 0;

  // Role match
  if (post.author.role === signals.role) score += 0.25;

  // Org type match
  if (signals.orgType && post.organization?.type === signals.orgType) score += 0.20;

  // Geo / country match
  if (signals.country && post.author.country === signals.country) score += 0.15;

  // Category relevance by role (food & nutrition ecosystem)
  const roleCategories: Record<string, string[]> = {
    LAB: ['INDUSTRY_ANNOUNCEMENT', 'SUPPLY_OFFER'],
    REGULATOR: ['INDUSTRY_ANNOUNCEMENT'],
    UNIVERSITY: ['INDUSTRY_ANNOUNCEMENT', 'PARTNERSHIP_REQUEST'],
    PROFESSIONAL: ['PARTNERSHIP_REQUEST', 'SUPPLY_OFFER'],
    USER: ['GENERAL', 'SUPPLY_OFFER'],
  };
  const preferred = roleCategories[signals.role] || [];
  if (preferred.includes(post.category)) score += 0.20;

  // Keyword matching from recent searches
  const contentLower = post.content.toLowerCase();
  for (const search of signals.recentSearches.slice(0, 5)) {
    if (search && contentLower.includes(search.toLowerCase())) {
      score += 0.15;
      break;
    }
  }

  // Keyword overlap with recent interaction topics (session-aware boost)
  const recentAuthors = new Set(signals.recentInteractions.slice(0, 10).map(i => i.authorId));
  if (recentAuthors.has(post.authorId)) score += 0.05;

  return Math.min(score, 1);
}

// ─── 2. Relationship Score (0.15) ───────────────────────
// Followed author, same org, past interactions with decay

export function relationshipScore(post: CandidatePost, signals: UserSignals): number {
  let score = 0;

  // Following the author directly
  if (signals.followedUserIds.includes(post.authorId)) score += 0.35;

  // Following the org the post belongs to
  if (post.organizationId && signals.followedOrgIds.includes(post.organizationId)) score += 0.20;

  // Same organization as user
  if (signals.organizationId && post.organizationId === signals.organizationId) score += 0.20;

  // Past interactions with this specific author (with time decay)
  const lambda = FEED_CONFIG.DECAY_LAMBDA;
  const authorInteractions = signals.recentInteractions.filter(i => i.authorId === post.authorId);
  let interactionBonus = 0;
  for (const interaction of authorInteractions.slice(0, 10)) {
    interactionBonus += decayWeight(interaction.createdAt, lambda) * 0.05;
  }
  score += Math.min(interactionBonus, 0.25);

  return Math.min(score, 1);
}

// ─── 3. Quality Score (0.20) ────────────────────────────
// Engagement depth, virality momentum, content richness

export function qualityScore(post: CandidatePost): number {
  const likes = post._count.likes;
  const comments = post._count.comments;
  const reposts = post._count.reposts;

  // Weighted engagement (comments = deeper engagement, reposts = amplification)
  const totalEngagement = likes + comments * 2 + reposts * 3;

  // Logarithmic scale to prevent mega-posts from dominating
  const engagementRaw = Math.log2(totalEngagement + 1) / 10;

  // Comment-to-like ratio (comments signal deeper discourse)
  const commentRatio = likes > 0 ? comments / likes : 0;
  const depthBonus = Math.min(commentRatio * 0.2, 0.15);

  // Viral momentum: engagement velocity (growth rate per hour)
  const ageHours = Math.max((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60), 0.5);
  const windowHours = FEED_CONFIG.VIRAL_WINDOW_HOURS;
  const velocity = totalEngagement / Math.min(ageHours, windowHours);
  const viralBonus = Math.min(velocity / 10, 0.25); // 10+ engagements/hr = max bonus

  // Content richness: posts with media or longer content tend to be higher quality
  let richnessBonus = 0;
  if (post.media && post.media.length > 0) richnessBonus += 0.08;
  if (post.content.length > 100) richnessBonus += 0.05;
  if (post.content.length > 300) richnessBonus += 0.05;

  return Math.min(engagementRaw + depthBonus + viralBonus + richnessBonus, 1);
}

// ─── 4. Freshness Score (0.10) ──────────────────────────
// Time decay: newer posts score higher with exponential decay

export function freshnessScore(post: CandidatePost): number {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const halfLife = FEED_CONFIG.FRESHNESS_HALF_LIFE_HOURS;

  // Exponential decay with configurable half-life
  return Math.exp(-0.693 * ageHours / halfLife);
}

// ─── 5. Trust Score (0.15) ──────────────────────────────
// Author role trust, org backing, author authority (followers, track record)

export function trustScore(post: CandidatePost): number {
  let score = 0.20; // baseline trust

  // High-trust institutional roles (regulators, labs, universities)
  const highTrustRoles = ['REGULATOR', 'LAB', 'UNIVERSITY', 'ADMIN'];
  if (highTrustRoles.includes(post.author.role)) score += 0.30;
  else if (post.author.role === 'PROFESSIONAL') score += 0.15;

  // Org-backed posts are more trustworthy
  if (post.organization) score += 0.15;

  // Author authority: follower count (log scale)
  const followers = post.author._count?.followsReceived ?? 0;
  score += Math.min(Math.log2(followers + 1) / 12, 0.20);

  // Org affiliation adds credibility
  if (post.organization && post.author.role !== 'USER') score += 0.05;

  return Math.min(score, 1);
}

// ─── 6. Intent Match Score (0.10) ───────────────────────
// Historical interactions + session signals (searches, recent clicks)

export function intentMatchScore(post: CandidatePost, signals: UserSignals): number {
  const { recentInteractions, recentSearches } = signals;

  // Cold start: give a neutral score for new users
  if (recentInteractions.length === 0 && recentSearches.length === 0) return 0.3;

  let score = 0;
  const lambda = FEED_CONFIG.DECAY_LAMBDA;

  // Historical interaction matching (with time decay memory: weight = e^(-λ * t))
  for (const interaction of recentInteractions) {
    const weight = decayWeight(interaction.createdAt, lambda);

    if (interaction.authorId === post.authorId) score += weight * 0.30;
    if (interaction.action === 'LIKE') score += weight * 0.08;
    if (interaction.action === 'COMMENT') score += weight * 0.12;
    if (interaction.action === 'SHARE') score += weight * 0.15;
    if (interaction.action === 'CLICK') score += weight * 0.10;
  }

  // Normalize by interaction count
  score = score / Math.max(recentInteractions.length, 1);

  // Session intent signals: recent searches boost matching content
  const contentLower = post.content.toLowerCase();
  for (const search of recentSearches.slice(0, 5)) {
    if (search && contentLower.includes(search.toLowerCase())) {
      score += 0.25;
      break;
    }
  }

  // Boost from very recent interactions (last 5) — live session signals
  const recentFive = recentInteractions.slice(0, 5);
  for (const interaction of recentFive) {
    if (interaction.authorId === post.authorId) {
      score += 0.15;
      break;
    }
  }

  return Math.min(score, 1);
}

// ─── 7. Opportunity Value Score (0.05) ──────────────────
// Sourcing, jobs, partnerships, certifications — core product feature

export function opportunityValueScore(post: CandidatePost): number {
  const opportunityCategories = ['SUPPLY_OFFER', 'PARTNERSHIP_REQUEST'];

  // Direct opportunity categories get high score
  if (opportunityCategories.includes(post.category)) return 0.85;

  // Event posts have moderate opportunity value
  if (post.type === 'EVENT') return 0.5;

  // Content keyword detection for implicit opportunities
  const keywords = [
    'opportunity', 'hiring', 'sourcing', 'certification', 'partner',
    'collaborate', 'job', 'tender', 'rfp', 'looking for', 'seeking',
    'available', 'compliance', 'regulation', 'audit', 'recall',
  ];
  const contentLower = post.content.toLowerCase();
  for (const kw of keywords) {
    if (contentLower.includes(kw)) return 0.5;
  }

  return 0.1;
}

// ─── Penalties ──────────────────────────────────────────
// Spam, duplicate content, no engagement, content fatigue, negative signals

export function computePenalty(post: CandidatePost, signals: UserSignals, recentPostCategories: string[]): number {
  let penalty = 1.0; // 1.0 = no penalty

  // Content fatigue: reduce score for repeated content types
  const sameCategory = recentPostCategories.filter(c => c === post.category).length;
  if (sameCategory > 3) penalty *= 0.85;
  if (sameCategory > 6) penalty *= 0.70;
  if (sameCategory > 10) penalty *= 0.55;

  // Low engagement penalty for older posts (stale content)
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const totalEngagement = post._count.likes + post._count.comments + post._count.reposts;
  if (ageHours > 12 && totalEngagement === 0) penalty *= 0.55;
  if (ageHours > 24 && totalEngagement === 0) penalty *= 0.40;

  // Very short / low-effort content
  if (post.content.length < 15) penalty *= 0.75;

  // Spam heuristic: very recent post from same author seen many times
  const authorPosts = recentPostCategories.filter((_, i) => {
    // This is a proxy — we count how many recent posts might be from the same bucket
    return i < recentPostCategories.length;
  });
  // If more than 5 posts of the same category in a window, apply spam-like penalty
  if (sameCategory > 5) penalty *= 0.80;

  // Negative feedback signals: if user previously hid posts from this author
  const hiddenFromAuthor = signals.recentInteractions.filter(
    i => i.authorId === post.authorId && i.action === 'HIDE'
  );
  if (hiddenFromAuthor.length > 0) penalty *= 0.30;

  return penalty;
}

// ─── Compute Total Score ────────────────────────────────
// score = Σ(weight_i * score_i) * penalty * opportunity_boost

export function computePostScore(post: CandidatePost, signals: UserSignals, recentPostCategories: string[]): ScoredPost {
  const scores = {
    relevance: relevanceScore(post, signals),
    relationship: relationshipScore(post, signals),
    quality: qualityScore(post),
    freshness: freshnessScore(post),
    trust: trustScore(post),
    intentMatch: intentMatchScore(post, signals),
    opportunityValue: opportunityValueScore(post),
  };

  const penalty = computePenalty(post, signals, recentPostCategories);

  // Weighted sum: 0.25 + 0.15 + 0.20 + 0.10 + 0.15 + 0.10 + 0.05 = 1.00
  let score =
    SCORE_WEIGHTS.relevance * scores.relevance +
    SCORE_WEIGHTS.relationship * scores.relationship +
    SCORE_WEIGHTS.quality * scores.quality +
    SCORE_WEIGHTS.freshness * scores.freshness +
    SCORE_WEIGHTS.trust * scores.trust +
    SCORE_WEIGHTS.intentMatch * scores.intentMatch +
    SCORE_WEIGHTS.opportunityValue * scores.opportunityValue;

  // Apply penalties
  score *= penalty;

  // Opportunity boost (+30% for opportunity posts — core product feature)
  const opportunityCategories = ['SUPPLY_OFFER', 'PARTNERSHIP_REQUEST'];
  if (opportunityCategories.includes(post.category)) {
    score *= FEED_CONFIG.OPPORTUNITY_BOOST;
  }

  const isNetwork = signals.followedUserIds.includes(post.authorId) ||
    (post.organizationId != null && signals.followedOrgIds.includes(post.organizationId)) ||
    (signals.organizationId != null && post.organizationId === signals.organizationId);

  return {
    post,
    score,
    isNetwork,
    isDiscovery: !isNetwork,
    scores,
    penalty,
  };
}

// ─── Reranking ──────────────────────────────────────────
// 1. Author diversity  2. Content type diversity  3. Network/discovery balance  4. Critical alerts

export function rerankFeed(scored: ScoredPost[], limit: number): ScoredPost[] {
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Author diversity: max N posts per author
  const authorCounts = new Map<string, number>();
  const maxPerAuthor = FEED_CONFIG.MAX_POSTS_PER_AUTHOR;

  const diversified: ScoredPost[] = [];
  const overflow: ScoredPost[] = [];

  for (const item of scored) {
    const authorId = item.post.authorId;
    const count = authorCounts.get(authorId) ?? 0;
    if (count < maxPerAuthor) {
      diversified.push(item);
      authorCounts.set(authorId, count + 1);
    } else {
      overflow.push(item);
    }
  }

  // Content type diversity: track types and mix them
  const typeGroups = new Map<string, ScoredPost[]>();
  for (const item of diversified) {
    const type = item.post.type || 'TEXT';
    if (!typeGroups.has(type)) typeGroups.set(type, []);
    typeGroups.get(type)!.push(item);
  }

  // Network vs discovery balance (70/30)
  const targetSize = Math.min(limit, diversified.length + overflow.length);
  const networkItems = diversified.filter(i => i.isNetwork);
  const discoveryItems = diversified.filter(i => i.isDiscovery);

  const discoveryTarget = Math.max(
    Math.ceil(targetSize * FEED_CONFIG.DISCOVERY_MIN_PERCENT),
    Math.ceil(targetSize * FEED_CONFIG.DISCOVERY_RATIO)
  );
  const networkTarget = targetSize - discoveryTarget;

  const result: ScoredPost[] = [];

  // Critical alerts: inject high-trust institutional announcements into top positions
  const criticalAlerts = diversified.filter(i =>
    i.post.category === 'INDUSTRY_ANNOUNCEMENT' &&
    ['REGULATOR', 'LAB', 'ADMIN'].includes(i.post.author.role)
  );
  const topCritical = criticalAlerts.slice(0, 3);
  const criticalIds = new Set(topCritical.map(i => i.post.id));
  result.push(...topCritical);

  // Fill network slots (skip already-added critical)
  const remainingNetwork = networkItems.filter(i => !criticalIds.has(i.post.id));
  const networkSlots = Math.max(0, networkTarget - result.length);
  result.push(...remainingNetwork.slice(0, networkSlots));

  // Fill discovery slots
  const remainingDiscovery = discoveryItems.filter(i => !criticalIds.has(i.post.id));
  result.push(...remainingDiscovery.slice(0, discoveryTarget));

  // Fill any remaining with overflow
  const filled = result.length;
  const remaining = targetSize - filled;
  if (remaining > 0) {
    const usedIds = new Set(result.map(i => i.post.id));
    const extras = [...remainingNetwork.slice(networkSlots), ...remainingDiscovery.slice(discoveryTarget), ...overflow]
      .filter(i => !usedIds.has(i.post.id));
    result.push(...extras.slice(0, remaining));
  }

  // Final sort by score (critical alerts stay near top due to their natural high score)
  result.sort((a, b) => b.score - a.score);

  return result.slice(0, limit);
}
