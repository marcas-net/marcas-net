import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const where = category && category !== 'ALL' ? { category: category as any } : {};

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, role: true } },
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, role: true } },
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const post = await prisma.post.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        authorId: req.user.id,
        organizationId: user?.organizationId ?? undefined,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        organization: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201).json({ post });
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
