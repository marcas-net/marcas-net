import { Response, Request } from 'express';
import { findUserById, updateUser, updateUserPassword, findPublicUserById, findAllUsers } from '../models/user';
import { hashPassword, comparePassword } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await findPublicUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const users = await findAllUsers();
    res.json({ users: limit ? users.slice(0, limit) : users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, bio } = req.body;
    if (!name && !email && bio === undefined) {
      return res.status(400).json({ error: 'At least name, email, or bio is required' });
    }

    const user = await updateUser(req.user.id, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(bio !== undefined ? { bio } : {}),
    });

    res.json({
      message: 'Profile updated',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses social login and has no password to change' });
    }

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await hashPassword(newPassword);
    await updateUserPassword(req.user.id, hashed);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserPosts = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = req.params.id;
    const tab = (req.query.tab as string) || 'posts';

    let mediaTableExists = true;
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "post_media" LIMIT 0`);
    } catch {
      mediaTableExists = false;
    }

    const where: any = { authorId: userId };
    if (tab === 'media') {
      if (mediaTableExists) {
        where.media = { some: {} };
      }
    }

    const include: any = {
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
      pollOptions: { include: { _count: { select: { votes: true } } } },
    };
    if (mediaTableExists) {
      include.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
      if (include.repostOf?.include) {
        include.repostOf.include.media = { select: { id: true, url: true, type: true, filename: true, size: true } };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = posts.map((p: any) => ({
      ...p,
      media: p.media ?? [],
      editedAt: p.editedAt ?? null,
      likedByMe: false,
      likesCount: p._count?.likes ?? 0,
      commentsCount: p._count?.comments ?? 0,
      repostsCount: p._count?.reposts ?? 0,
      pollOptions: (p.pollOptions ?? []).map((o: any) => ({
        id: o.id,
        text: o.text,
        votesCount: o._count?.votes ?? 0,
        votedByMe: false,
      })),
      likes: undefined,
      _count: undefined,
    }));

    res.json({ posts: mapped });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};