import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { generateToken } from '../utils/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ──────────────── Google OAuth ────────────────

export const googleRedirect = (_req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: 'Google OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = (await userInfoRes.json()) as { email?: string; name?: string; picture?: string; id?: string };

    if (!profile.email) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    // Find or create user
    const user = await findOrCreateOAuthUser({
      email: profile.email,
      name: profile.name || null,
      avatarUrl: profile.picture || null,
      provider: 'google',
      providerId: profile.id || profile.email,
    });

    const jwt = generateToken({ id: user.id, email: user.email, role: user.role });
    const userData = encodeURIComponent(
      JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl })
    );

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${jwt}&user=${userData}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ──────────────── GitHub OAuth ────────────────

export const githubRedirect = (_req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(501).json({ error: 'GitHub OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/github/callback`,
    scope: 'user:email',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID!,
        client_secret: GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: `${BACKEND_URL}/api/auth/github/callback`,
      }),
    });

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    // Get user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });
    const profile = (await userRes.json()) as { email?: string; name?: string; login?: string; avatar_url?: string; id?: number };

    // Get primary email (may be private)
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/json',
        },
      });
      const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    const user = await findOrCreateOAuthUser({
      email,
      name: profile.name || profile.login || null,
      avatarUrl: profile.avatar_url || null,
      provider: 'github',
      providerId: String(profile.id),
    });

    const jwt = generateToken({ id: user.id, email: user.email, role: user.role });
    const userData = encodeURIComponent(
      JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl })
    );

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${jwt}&user=${userData}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ──────────────── Helpers ────────────────

export const getOAuthProviders = (_req: Request, res: Response) => {
  res.json({
    providers: {
      google: !!GOOGLE_CLIENT_ID,
      github: !!GITHUB_CLIENT_ID,
    },
  });
};

async function findOrCreateOAuthUser(data: {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string;
}) {
  // First check if user exists with this provider ID
  const existingByProvider = await prisma.user.findFirst({
    where: { provider: data.provider, providerId: data.providerId },
  });
  if (existingByProvider) {
    // Update name/avatar if changed
    return prisma.user.update({
      where: { id: existingByProvider.id },
      data: { name: data.name || existingByProvider.name, avatarUrl: data.avatarUrl },
    });
  }

  // Check if user exists with same email (link accounts)
  const existingByEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingByEmail) {
    // Link this OAuth provider to the existing account
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        provider: data.provider,
        providerId: data.providerId,
        avatarUrl: data.avatarUrl || existingByEmail.avatarUrl,
        name: existingByEmail.name || data.name,
      },
    });
  }

  // Create new user
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
      provider: data.provider,
      providerId: data.providerId,
    },
  });
}
