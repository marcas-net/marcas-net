import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getOrganization, joinOrganization, getOrgPosts, getOrgStats, getOrgFollowers, getOrgMembers, uploadOrgCoverImage, uploadOrgLogoImage, updateOrganization, type Organization, type OrgStats, type OrgMember } from '../services/orgService';
import { getOrgProducts, type Product } from '../services/marketplaceService';
import { followOrg, getFollowStatus } from '../services/feedService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { orgTypeVariant } from '../styles/design-system';
import { PostCard } from '../components/feed/PostCard';
import toast from 'react-hot-toast';
import type { Post, Comment } from '../services/feedService';
import api from '../services/api';

type Tab = 'overview' | 'posts' | 'sourcing' | 'manage';

const MEMBER_ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
  ORG_ADMIN: 'Admin',
  USER: 'Member',
};

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [orgPosts, setOrgPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [orgProducts, setOrgProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState<{ id: string; name: string | null; avatarUrl: string | null }[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [savingField, setSavingField] = useState(false);

  const manageMode = searchParams.get('mode') === 'manage';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getOrganization(id),
      getOrgStats(id).catch(() => null),
      user ? getFollowStatus({ orgId: id }).catch(() => ({ following: false, isConnected: false })) : Promise.resolve({ following: false, isConnected: false }),
    ])
      .then(([orgData, statsData, followData]) => {
        setOrg(orgData);
        setStats(statsData);
        setIsFollowing(followData.following);
        setFollowerCount(statsData?.followersCount ?? 0);
      })
      .catch(() => toast.error('Organization not found'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const loadPosts = useCallback(() => {
    if (!id) return;
    setPostsLoading(true);
    getOrgPosts(id)
      .then(setOrgPosts)
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setPostsLoading(false));
  }, [id]);

  const loadProducts = useCallback(() => {
    if (!id) return;
    setProductsLoading(true);
    getOrgProducts(id)
      .then(setOrgProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setProductsLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'posts') loadPosts();
    if (tab === 'sourcing') loadProducts();
    if (tab === 'manage' && id) {
      setPendingLoading(true);
      api.get(`/orgs/${id}/requests?status=PENDING`).then(r => setPendingRequests(r.data.requests ?? [])).catch(() => {}).finally(() => setPendingLoading(false));
    }
  }, [tab, loadPosts, loadProducts]);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await joinOrganization(id);
      await refreshUser();
      toast.success(`Joined ${org?.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleFollow = async () => {
    if (!id || followLoading) return;
    setFollowLoading(true);
    try {
      const { following } = await followOrg(id);
      setIsFollowing(following);
      setFollowerCount(prev => following ? prev + 1 : prev - 1);
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    e.target.value = '';
    setUploadingCover(true);
    try {
      const { coverImageUrl } = await uploadOrgCoverImage(id, file);
      setOrg(prev => prev ? { ...prev, coverImageUrl } : prev);
      toast.success('Cover updated successfully');
    } catch {
      toast.error('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    e.target.value = '';
    setUploadingLogo(true);
    try {
      const { logoUrl } = await uploadOrgLogoImage(id, file);
      setOrg(prev => prev ? { ...prev, logoUrl } : prev);
      toast.success('Logo updated successfully');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveField = async (field: 'name' | 'description', value: string) => {
    if (!id) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    setSavingField(true);
    try {
      const updated = await updateOrganization(id, { [field]: trimmed });
      setOrg(prev => prev ? { ...prev, ...updated } : prev);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingField(false);
      if (field === 'name') setEditingName(false);
      if (field === 'description') setEditingDesc(false);
    }
  };

  const isMember = user?.organizationId === id;
  const canManage = isMember && (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN');
  const isManaging = canManage && manageMode;
  const joinDate = org ? new Date(org.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';
  const industryLabel = org ? org.type.charAt(0) + org.type.slice(1).toLowerCase() : '';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!org) return (
    <div className="text-center py-20 text-slate-400">Organization not found.</div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <Link to="/orgs" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1.5 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Organizations
      </Link>

      {/* ─── Public Identity Card ─── */}
      <Card padding="none">
        {/* Cover Image */}
        <div
          className={`relative rounded-t-2xl overflow-hidden h-28 group ${canManage ? 'cursor-pointer' : ''}`}
          onClick={canManage ? () => coverInputRef.current?.click() : undefined}
        >
          {org.coverImageUrl ? (
            <img src={org.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500" />
          )}
          {canManage && (
            <>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Change Cover
                </span>
              </div>
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </>
          )}
        </div>

        <div className="px-6 pb-6 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* 1. Logo / Avatar */}
            <div className="flex-shrink-0 relative group">
              <div
                className={canManage ? 'cursor-pointer' : ''}
                onClick={canManage ? () => logoInputRef.current?.click() : undefined}
                title={canManage ? 'Change logo' : undefined}
              >
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={`${org.name} logo`}
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white dark:border-neutral-800 shadow"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border-4 border-white dark:border-neutral-800 shadow">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {canManage && (
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    {uploadingLogo ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {canManage && (
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              )}
            </div>

            {/* Identity info */}
            <div className="flex-1 min-w-0">
              {/* 2. Name + 5. Verification badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="text-xl font-bold bg-transparent border-b-2 border-blue-500 outline-none text-slate-900 dark:text-white w-64"
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveField('name', nameValue); if (e.key === 'Escape') setEditingName(false); }}
                      onBlur={() => saveField('name', nameValue)}
                      disabled={savingField}
                    />
                    {savingField && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                  </div>
                ) : (
                  <h1
                    className={`text-xl font-bold text-slate-900 dark:text-white truncate ${canManage ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group' : ''}`}
                    onClick={canManage ? () => { setNameValue(org.name); setEditingName(true); } : undefined}
                    title={canManage ? 'Click to edit name' : undefined}
                  >
                    {org.name}
                    {canManage && (
                      <svg className="w-3.5 h-3.5 inline ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </h1>
                )}
                {org.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
                {isMember && <Badge variant="green">Member</Badge>}
              </div>

              {/* 3. Industry + 4. Location + meta */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                {/* Industry (org type) */}
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <Badge variant={orgTypeVariant[org.type] ?? 'gray'} >
                    {industryLabel}
                  </Badge>
                </span>

                {/* Location */}
                {org.country && (
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {org.country}
                  </span>
                )}

                {/* Member count — clickable */}
                {stats && (
                  <button
                    onClick={() => {
                      setShowMembers(true);
                      if (members.length === 0 && id) {
                        setMembersLoading(true);
                        getOrgMembers(id).then(setMembers).catch(() => {}).finally(() => setMembersLoading(false));
                      }
                    }}
                    className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {stats.membersCount} member{stats.membersCount !== 1 ? 's' : ''}
                  </button>
                )}

                <button
                    onClick={async () => {
                      setShowFollowers(true);
                      if (followers.length === 0 && id) {
                        setFollowersLoading(true);
                        try { setFollowers(await getOrgFollowers(id)); } catch { /* ignore */ }
                        setFollowersLoading(false);
                      }
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {followerCount} follower{followerCount !== 1 ? 's' : ''}
                  </button>

                <span className="text-slate-300 dark:text-neutral-600">·</span>
                <span>Est. {joinDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0 mt-8">
              {/* View / Manage toggle — only for admins */}
              {canManage && (
                <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 text-sm font-medium">
                  <button
                    onClick={() => setSearchParams({})}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${!manageMode ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >View</button>
                  <button
                    onClick={() => setSearchParams({ mode: 'manage' })}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${manageMode ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >Manage</button>
                </div>
              )}
              {/* Follow / Unfollow — only for non-members */}
              {!isMember && user && (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                    isFollowing
                      ? 'border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {!isMember && (
                <Button type="button" onClick={handleJoin} loading={joining} size="md" variant="primary">
                  Join
                </Button>
              )}
              {canManage && !manageMode && (
                <Link to={`/orgs/${id}/settings`}>
                  <Button size="md" variant="outline">Settings</Button>
                </Link>
              )}
              {isMember && !canManage && (
                <Link to="/sourcing">
                  <Button size="md" variant="outline">Sourcing</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Description — click-to-edit for admins */}
          <div className="mt-4 sm:pl-20">
            {editingDesc ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  rows={3}
                  className="w-full text-sm bg-transparent border border-blue-400 rounded-lg px-3 py-2 outline-none text-slate-700 dark:text-slate-300 resize-none"
                  value={descValue}
                  onChange={e => setDescValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setEditingDesc(false); }}
                  disabled={savingField}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveField('description', descValue)}
                    disabled={savingField}
                    className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingField ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingDesc(false)} className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            ) : org.description ? (
              <p
                className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${canManage ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 group inline-block' : ''}`}
                onClick={canManage ? () => { setDescValue(org.description ?? ''); setEditingDesc(true); } : undefined}
                title={canManage ? 'Click to edit description' : undefined}
              >
                {org.description}
                {canManage && (
                  <svg className="w-3 h-3 inline ml-1.5 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </p>
            ) : canManage ? (
              <button
                onClick={() => { setDescValue(''); setEditingDesc(true); }}
                className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 italic transition-colors"
              >
                + Add a description
              </button>
            ) : null}
          </div>

          {/* Manage Mode badge */}
          {isManaging && (
            <div className="mt-3 flex items-center gap-2 sm:pl-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                Manage Mode Active
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ─── KPI Cards — visible for members ─── */}
      {isMember && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Products"
            value={stats.productsCount}
            color="blue"
            change={stats.recentProducts > 0 ? `+${stats.recentProducts} this week` : undefined}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          />
          <StatCard
            label="Active Batches"
            value={stats.activeBatches}
            color="green"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
          <StatCard
            label="Pending Requests"
            value={stats.pendingRequests}
            color="orange"
            change={stats.recentRequests > 0 ? `+${stats.recentRequests} this week` : undefined}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Documents"
            value={stats.documentsCount}
            color="purple"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pt-1">
        <div className="flex border-b border-gray-200 dark:border-neutral-700/80 min-w-max">
          {([
            { key: 'overview' as Tab, label: 'Overview' },
            { key: 'posts' as Tab, label: 'Posts' },
            { key: 'sourcing' as Tab, label: 'Sourcing' },
            ...(canManage ? [{ key: 'manage' as Tab, label: '⚙ Manage' }] : []),
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === 'manage') setSearchParams({ mode: 'manage' });
                else setSearchParams({});
              }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Tab: Overview ═══ */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Sourcing summary — visible for members with activity */}
          {isMember && stats && (stats.productsCount > 0 || stats.totalRequests > 0) && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Sourcing Activity</p>
                <Link to={`/orgs/${id}/sourcing`} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Manage Sourcing →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Products Listed', value: stats.productsCount },
                  { label: 'Active Batches', value: stats.activeBatches },
                  { label: 'Pending Requests', value: stats.pendingRequests },
                  { label: 'Total Requests', value: stats.totalRequests },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link to={`/orgs/${id}/catalog`} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  View Public Catalog →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══ Tab: Posts ═══ */}
      {tab === 'posts' && (
        <div className="space-y-4">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orgPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm">No posts from this organization yet</p>
            </div>
          ) : (
            orgPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                userId={user?.id}
                onDelete={() => setOrgPosts((prev) => prev.filter((x) => x.id !== p.id))}
                onLikeToggle={(postId, liked, count) => {
                  setOrgPosts((prev) => prev.map((x) => x.id === postId ? { ...x, likedByMe: liked, likesCount: count } : x));
                }}
                onCommentAdded={(postId, comment) => {
                  setOrgPosts((prev) => prev.map((x) => x.id === postId ? { ...x, comments: [...x.comments, comment], commentsCount: x.commentsCount + 1 } : x));
                }}
                onCommentDeleted={(postId, commentId) => {
                  setOrgPosts((prev) => prev.map((x) => x.id === postId ? { ...x, comments: x.comments.filter((c: Comment) => c.id !== commentId), commentsCount: x.commentsCount - 1 } : x));
                }}
                onPostEdited={(postId, updated) => {
                  setOrgPosts((prev) => prev.map((x) => x.id === postId ? updated : x));
                }}
              />
            ))
          )}
        </div>
      )}

      {/* ═══ Tab: Sourcing ═══ */}
      {tab === 'sourcing' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{orgProducts.length} product{orgProducts.length !== 1 ? 's' : ''} listed</p>
            {isMember && (
              <Link to="/sourcing">
                <Button size="sm" variant="primary">Go to Sourcing Dashboard</Button>
              </Link>
            )}
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orgProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm">No products listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 hover:shadow-md dark:hover:shadow-black/30 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex-1 min-w-0">
                      {product.name}
                    </h3>
                    {product.isCertified && (
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  </div>
                  {product.category && (
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md mb-2 inline-block self-start">
                      {product.category}
                    </span>
                  )}
                  {product.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-auto">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-50 dark:border-neutral-700/60">
                    <span>{product._count.requests} request{product._count.requests !== 1 ? 's' : ''}</span>
                    {product.price != null && (
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {product.currency ?? '€'}{Number(product.price).toFixed(2)}/{product.unit ?? 'unit'}
                      </span>
                    )}
                  </div>
                  {product.batches && product.batches.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.batches.slice(0, 3).map((b) => (
                        <span
                          key={b.id}
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            b.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {b.batchCode}
                        </span>
                      ))}
                      {product.batches.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{product.batches.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Manage ═══ */}
      {tab === 'manage' && canManage && (
        <div className="space-y-5">
          {/* Quick nav links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Settings', to: `/orgs/${id}/settings` },
              { label: 'Operations', to: `/orgs/${id}/admin` },
              { label: 'Sourcing', to: '/sourcing' },
              { label: 'Documents', to: `/orgs/${id}/documents` },
            ].map(item => (
              <Link key={item.label} to={item.to} className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Pending sourcing requests */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Pending Requests</h3>
              {stats && stats.pendingRequests > 0 && (
                <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">{stats.pendingRequests} pending</span>
              )}
            </div>
            {pendingLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{req.product?.name ?? 'Product'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{req.quantity} {req.unit} · {req.requester?.name ?? 'Unknown'}</p>
                    </div>
                    <Link to={`/sourcing`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Members management */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Members</h3>
              <button
                onClick={() => {
                  setShowMembers(true);
                  if (members.length === 0 && id) {
                    setMembersLoading(true);
                    getOrgMembers(id).then(setMembers).catch(() => {}).finally(() => setMembersLoading(false));
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </button>
            </div>
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.membersCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Members</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.recentMembers}</p>
                  <p className="text-xs text-slate-500 mt-0.5">New This Week</p>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
              <Link to={`/orgs/${id}/settings`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Manage Members in Settings →
              </Link>
            </div>
          </Card>

          {/* Stock overview */}
          {stats && (
            <Card>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Stock Overview</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Products', value: stats.productsCount, color: 'text-blue-600' },
                  { label: 'Active Batches', value: stats.activeBatches, color: 'text-green-600' },
                  { label: 'Total Stock', value: `${stats.totalStockQty ?? 0}`, color: 'text-emerald-600' },
                  { label: 'On Hold', value: stats.onHoldBatches ?? 0, color: 'text-amber-600' },
                  { label: 'Confirmed Orders', value: stats.confirmedOrders ?? 0, color: 'text-purple-600' },
                  { label: 'Documents', value: stats.documentsCount, color: 'text-slate-600' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── Followers Modal ─── */}
      {showFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowFollowers(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Followers</h2>
              <button onClick={() => setShowFollowers(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
            </div>
            {followersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : followers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No followers yet</p>
            ) : (
              <div className="space-y-3">
                {followers.map(f => (
                  <div key={f.id} className="flex items-center gap-3">
                    <Avatar src={f.avatarUrl ?? undefined} name={f.name ?? '?'} size="sm" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{f.name ?? 'Unknown'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Members Modal ─── */}
      {showMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowMembers(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Members {stats ? `(${stats.membersCount})` : ''}
              </h2>
              <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
            </div>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No members yet</p>
            ) : (
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar src={m.avatarUrl ?? undefined} name={m.name ?? '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name ?? 'Unknown'}</p>
                      {m.headline && <p className="text-xs text-gray-400 truncate">{m.headline}</p>}
                      {canManage && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{MEMBER_ROLE_LABELS[m.role] ?? m.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
