import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

const postInclude = (userId?: string, includeMedia = false) => {
  const base: Record<string, any> = {
    author: { select: { id: true, name: true, role: true, avatarUrl: true } },
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
      },
    },
    pollOptions: {
      include: {
        _count: { select: { votes: true } },
        ...(userId ? { votes: { where: { userId }, select: { userId: true } } } : {}),
      },
    },
  };
  if (includeMedia) {
    base.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
    if (base.repostOf?.include) {
      base.repostOf.include.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
    }
  }
  if (userId) {
    base.likes = { where: { userId } };
  }
  return base;
};

let mediaTableExists: boolean | null = null;

async function checkMediaTable(): Promise<boolean> {
  if (mediaTableExists !== null) return mediaTableExists;
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "post_media" LIMIT 0`);
    mediaTableExists = true;
  } catch {
    mediaTableExists = false;
  }
  return mediaTableExists;
}

function mapPost(p: any, userId?: string) {
  return {
    ...p,
    media: p.media ?? [],
    likedByMe: userId ? p.likes?.length > 0 : false,
    likesCount: p._count?.likes ?? 0,
    commentsCount: p._count?.comments ?? 0,
    repostsCount: p._count?.reposts ?? 0,
    pollOptions: (p.pollOptions ?? []).map((o: any) => ({
      id: o.id,
      text: o.text,
      votesCount: o._count?.votes ?? 0,
      votedByMe: userId ? (o.votes ?? []).some((v: any) => v.userId === userId) : false,
    })),
    likes: undefined,
    _count: undefined,
  };
}

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const userId = req.user?.id as string | undefined;
    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    const hasMedia = await checkMediaTable();

    const posts = await prisma.post.findMany({
      where,
      include: postInclude(userId, hasMedia),
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ posts: posts.map((p: any) => mapPost(p, userId)) });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const hasMedia = await checkMediaTable();
    const post = await prisma.post.findUnique({
      where: { id: req.params.id as string },
      include: postInclude(userId, hasMedia),
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: mapPost(post, userId) });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, category, type, pollQuestion, pollOptions, pollDuration, eventTitle, eventDate, eventLocation, eventLink } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    const hasMedia = await checkMediaTable();

    const files = (req.files as Express.Multer.File[]) || [];
    const imageExts = /\.(jpg|jpeg|png|gif|webp)$/i;

    let mediaData: any = undefined;
    if (hasMedia && files.length > 0) {
      mediaData = {
        create: files.map((f) => ({
          url: `/uploads/media/${f.filename}`,
          type: imageExts.test(f.originalname) ? 'image' : 'video',
          filename: f.originalname,
          size: f.size,
        })),
      };
    }

    let pollData: any = {};
    const postType = type || 'POST';
    if (postType === 'POLL' && pollQuestion && pollOptions) {
      const options = typeof pollOptions === 'string' ? JSON.parse(pollOptions) : pollOptions;
      pollData = {
        pollQuestion,
        pollEndsAt: pollDuration ? new Date(Date.now() + Number(pollDuration) * 3600000) : null,
        pollOptions: { create: (options as string[]).map((text: string) => ({ text })) },
      };
    }

    let eventData: any = {};
    if (postType === 'EVENT') {
      eventData = {
        eventTitle: eventTitle || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventLocation: eventLocation || null,
        eventLink: eventLink || null,
      };
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        category: category || 'GENERAL',
        type: postType,
        authorId: req.user.id as string,
        organizationId: user?.organizationId ?? undefined,
        ...(mediaData ? { media: mediaData } : {}),
        ...pollData,
        ...eventData,
      },
      include: postInclude(req.user.id as string, hasMedia),
    });

    res.status(201).json({ post: mapPost(post, req.user.id as string) });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const repostPost = async (req: AuthRequest, res: Response) => {
  try {
    const originalId = req.params.id as string;
    const { content } = req.body;

    const original = await prisma.post.findUnique({ where: { id: originalId } });
    if (!original) return res.status(404).json({ error: 'Post not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    const hasMedia = await checkMediaTable();

    const post = await prisma.post.create({
      data: {
        content: content?.trim() || '',
        category: original.category,
        authorId: req.user.id as string,
        organizationId: user?.organizationId ?? undefined,
        repostOfId: originalId,
      },
      include: postInclude(req.user.id as string, hasMedia),
    });

    if (original.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: original.authorId,
          type: 'REPOST',
          title: 'Repost',
          message: `${user?.name || 'Someone'} reposted your post`,
          link: `/feed`,
        },
      });
    }

    res.status(201).json({ post: mapPost(post, req.user.id as string) });
  } catch (error) {
    console.error('Repost error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const votePoll = async (req: AuthRequest, res: Response) => {
  try {
    const optionId = req.params.optionId as string;
    const userId = req.user.id as string;

    const option = await prisma.pollOption.findUnique({ where: { id: optionId }, include: { post: true } });
    if (!option) return res.status(404).json({ error: 'Poll option not found' });

    const allOptions = await prisma.pollOption.findMany({ where: { postId: option.postId }, select: { id: true } });
    const existingVote = await prisma.pollVote.findFirst({
      where: { userId, optionId: { in: allOptions.map((o) => o.id) } },
    });
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted on this poll' });
    }

    await prisma.pollVote.create({ data: { optionId, userId } });

    const options = await prisma.pollOption.findMany({
      where: { postId: option.postId },
      include: { _count: { select: { votes: true } } },
    });

    res.json({ pollOptions: options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })) });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const hasMedia = await checkMediaTable();
    const post = await prisma.post.findUnique({
      where: { id },
      ...(hasMedia ? { include: { media: true } } : {}),
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    for (const m of ((post as any).media ?? [])) {
      const filePath = path.join(__dirname, '../..', m.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.post.delete({ where: { id } });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Comments ───────────────────────────────────────────

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const postId = req.params.id as string;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), postId, userId: req.user.id as string },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (post.authorId !== req.user.id) {
      const commenter = await prisma.user.findUnique({ where: { id: req.user.id as string } });
      await prisma.notification.create({
        data: {
          userId: post.authorId, type: 'COMMENT', title: 'New Comment',
          message: `${commenter?.name || 'Someone'} commented on your post`, link: `/feed`,
        },
      });
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Likes ──────────────────────────────────────────────

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userId = req.user.id as string;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId } });
      return res.json({ liked: false, likesCount: count });
    }

    await prisma.like.create({ data: { userId, postId } });
    const count = await prisma.like.count({ where: { postId } });

    if (post.authorId !== userId) {
      const liker = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.notification.create({
        data: { userId: post.authorId, type: 'LIKE', title: 'New Like',
          message: `${liker?.name || 'Someone'} liked your post`, link: `/feed` },
      });
    }

    res.json({ liked: true, likesCount: count });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Follows ────────────────────────────────────────────

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.userId as string;
    if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingUserId: { followerId: req.user.id as string, followingUserId: targetId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    await prisma.follow.create({ data: { followerId: req.user.id as string, followingUserId: targetId } });

    const follower = await prisma.user.findUnique({ where: { id: req.user.id as string } });
    await prisma.notification.create({
      data: { userId: targetId, type: 'FOLLOW', title: 'New Follower',
        message: `${follower?.name || 'Someone'} started following you`, link: `/profile` },
    });

    res.json({ following: true });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const followOrg = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params.orgId as string;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingOrgId: { followerId: req.user.id as string, followingOrgId: orgId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    await prisma.follow.create({ data: { followerId: req.user.id as string, followingOrgId: orgId } });
    res.json({ following: true });
  } catch (error) {
    console.error('Follow org error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const orgId = req.query.orgId as string | undefined;

    if (userId) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingUserId: { followerId: req.user.id as string, followingUserId: userId } },
      });
      return res.json({ following: !!follow });
    }
    if (orgId) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingOrgId: { followerId: req.user.id as string, followingOrgId: orgId } },
      });
      return res.json({ following: !!follow });
    }
    res.status(400).json({ error: 'userId or orgId is required' });
  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowCounts = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const orgId = req.query.orgId as string | undefined;

    if (userId) {
      const [followers, following] = await Promise.all([
        prisma.follow.count({ where: { followingUserId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);
      return res.json({ followers, following });
    }
    if (orgId) {
      const followers = await prisma.follow.count({ where: { followingOrgId: orgId } });
      return res.json({ followers, following: 0 });
    }
    res.status(400).json({ error: 'userId or orgId is required' });
  } catch (error) {
    console.error('Get follow counts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── My Network ─────────────────────────────────────────

export const getMyNetwork = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id as string;

    const [following, followers, suggestions] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId, followingUserId: { not: null } },
        include: { followingUser: { select: { id: true, name: true, role: true, avatarUrl: true, bio: true } } },
        take: 50,
      }),
      prisma.follow.findMany({
        where: { followingUserId: userId },
        include: { follower: { select: { id: true, name: true, role: true, avatarUrl: true, bio: true } } },
        take: 50,
      }),
      prisma.user.findMany({
        where: { id: { not: userId }, followsReceived: { none: { followerId: userId } } },
        select: { id: true, name: true, role: true, avatarUrl: true, bio: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      following: following.map((f) => f.followingUser),
      followers: followers.map((f) => f.follower),
      suggestions,
    });
  } catch (error) {
    console.error('Get my network error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
