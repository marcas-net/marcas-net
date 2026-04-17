// ─── Feed Ranking Types ─────────────────────────────────

export interface FeedConfig {
  CANDIDATE_POOL_SIZE: number;
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;
  CACHE_TTL_SECONDS: number;
  CANDIDATE_CACHE_TTL_SECONDS: number;
  MAX_POSTS_PER_AUTHOR: number;
  NETWORK_RATIO: number;
  DISCOVERY_RATIO: number;
  DISCOVERY_MIN_PERCENT: number;
  OPPORTUNITY_BOOST: number;
  FRESHNESS_HALF_LIFE_HOURS: number;
  DECAY_LAMBDA: number;
  VIRAL_WINDOW_HOURS: number;
}

export const FEED_CONFIG: FeedConfig = {
  CANDIDATE_POOL_SIZE: 500,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  CACHE_TTL_SECONDS: 60,
  CANDIDATE_CACHE_TTL_SECONDS: 180,
  MAX_POSTS_PER_AUTHOR: 2,
  NETWORK_RATIO: 0.70,
  DISCOVERY_RATIO: 0.30,
  DISCOVERY_MIN_PERCENT: 0.10,
  OPPORTUNITY_BOOST: 1.30,
  FRESHNESS_HALF_LIFE_HOURS: 24,
  DECAY_LAMBDA: 0.05,
  VIRAL_WINDOW_HOURS: 6,
};

export const SCORE_WEIGHTS = {
  relevance: 0.25,
  relationship: 0.15,
  quality: 0.20,
  freshness: 0.10,
  trust: 0.15,
  intentMatch: 0.10,
  opportunityValue: 0.05,
} as const;

export type FeedAction = 'VIEW' | 'CLICK' | 'LIKE' | 'COMMENT' | 'HIDE' | 'SHARE';

export interface ScoredPost {
  post: any;
  score: number;
  isNetwork: boolean;
  isDiscovery: boolean;
  scores: {
    relevance: number;
    relationship: number;
    quality: number;
    freshness: number;
    trust: number;
    intentMatch: number;
    opportunityValue: number;
  };
  penalty: number;
}

export interface UserSignals {
  followedUserIds: string[];
  followedOrgIds: string[];
  role: string;
  organizationId: string | null;
  orgType: string | null;
  country: string | null;
  recentInteractions: { postId: string; authorId: string; action: string; createdAt: Date }[];
  recentSearches: string[];
}

export interface CandidatePost {
  id: string;
  content: string;
  category: string;
  type: string;
  authorId: string;
  organizationId: string | null;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    role: string;
    avatarUrl: string | null;
    country: string | null;
    _count?: { followsReceived: number };
  };
  organization: { id: string; name: string; type: string } | null;
  _count: { comments: number; likes: number; reposts: number };
  media?: any[];
  comments?: any[];
  likes?: any[];
  pollOptions?: any[];
  repostOf?: any;
  pollQuestion?: string | null;
  pollEndsAt?: Date | null;
  eventTitle?: string | null;
  eventDate?: Date | null;
  eventLocation?: string | null;
  eventLink?: string | null;
  editedAt?: Date | null;
}
