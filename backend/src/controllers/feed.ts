import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const postInclude = (userId?: string) => ({
  author: { select: { id: true, name: true, role: true, avatarUrl: true } },
  organization: { select: { id: true, name: true, type: true } },
  comments: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { comments: true, likes: true } },
  likes: userId ? { where: { userId } } : false,
});

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const userId = req.user?.id as string | undefined;
    const where = category && category !== 'ALL' ? { category: category as any } : {};

    const posts = await prisma.post.findMany({
      where,
      include: postInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = posts.map((p: any) => ({
      ...p,
      likedByMe: userId ? p.likes?.length > 0 : false,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      likes: undefined,
      _count: undefined,
    }));

    res.json({ posts: mapped });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const post = await prisma.post.findUnique({
      where: { id: req.params.id as string },
      include: postInclude(userId),
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const mapped = {
      ...post,
      likedByMe: userId ? (post as any).likes?.length > 0 : false,
      likesCount: (post as any)._count.likes,
      commentsCount: (post as any)._count.comments,
      likes: undefined,
      _count: undefined,
    };

    res.json({ post: mapped });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, category } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id as string } });

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        category: category || 'GENERAL',
        authorId: req.user.id as string,
        organizationId: user?.organizationId ?? undefined,
      },
      include: postInclude(req.user.id as string),
    });

    res.status(201).json({
      post: {
        ...post,
        likedByMe: false,
        likesCount: 0,
        commentsCount: 0,
        likes: undefined,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
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
      data: {
        content: content.trim(),
        postId,
        userId: req.user.id as string,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

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

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId } });
      return res.json({ liked: false, likesCount: count });
    }

    await prisma.like.create({ data: { userId, postId } });
    const count = await prisma.like.count({ where: { postId } });
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
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingUserId: { followerId: req.user.id as string, followingUserId: targetId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    await prisma.follow.create({
      data: { followerId: req.user.id as string, followingUserId: targetId },
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

    await prisma.follow.create({
      data: { followerId: req.user.id as string, followingOrgId: orgId },
    });
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
