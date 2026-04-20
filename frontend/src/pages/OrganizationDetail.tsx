import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrganization, joinOrganization, getOrgPosts, getOrgStats, type Organization, type OrgStats } from '../services/orgService';
import { getOrgDocuments, deleteDocument, type Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, StatCard } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { orgTypeVariant } from '../styles/design-system';
import { PostCard } from '../components/feed/PostCard';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';
import type { Post, Comment } from '../services/feedService';

type Tab = 'overview' | 'posts' | 'documents';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [orgPosts, setOrgPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getOrganization(id),
      getOrgStats(id).catch(() => null),
    ])
      .then(([orgData, statsData]) => {
        setOrg(orgData);
        setStats(statsData);
      })
      .catch(() => toast.error('Organization not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadDocs = () => {
    if (!id) return;
    setDocsLoading(true);
    getOrgDocuments(id)
      .then(setDocs)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setDocsLoading(false));
  };

  useEffect(() => {
    if (tab === 'documents') loadDocs();
    if (tab === 'posts') loadPosts();
  }, [tab]);

  const loadPosts = () => {
    if (!id) return;
    setPostsLoading(true);
    getOrgPosts(id)
      .then(setOrgPosts)
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setPostsLoading(false));
  };

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await joinOrganization(id);
      toast.success(`Joined ${org?.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Document deleted');
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const isMember = user?.organizationId === id;
  const canManage = isMember && (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN');
  const joinDate = org ? new Date(org.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

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

      {/* Hero Card */}
      <Card padding="none">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Org icon + info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{org.name}</h1>
                  <Badge variant={orgTypeVariant[org.type] ?? 'gray'}>
                    {org.type.charAt(0) + org.type.slice(1).toLowerCase()}
                  </Badge>
                  {isMember && <Badge variant="green">Member</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                  {org.country && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {org.country}
                    </span>
                  )}
                  {stats && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {stats.membersCount} member{stats.membersCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {stats && stats.followersCount > 0 && (
                    <span>{stats.followersCount} follower{stats.followersCount !== 1 ? 's' : ''}</span>
                  )}
                  <span>Est. {joinDate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 sm:mt-1">
              {!isMember && (
                <Button onClick={handleJoin} loading={joining} size="md">
                  Join Organization
                </Button>
              )}
              {canManage && (
                <Link to={`/orgs/${id}/settings`}>
                  <Button size="md" variant="outline">Settings</Button>
                </Link>
              )}
              {isMember && (
                <Link to="/sourcing">
                  <Button size="md" variant="outline">Sourcing</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Description — indented with the text, not the icon */}
          {org.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed sm:pl-[72px]">{org.description}</p>
          )}
        </div>
      </Card>

      {/* KPI Cards — visible for members */}
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

      {/* Tabs — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex border-b border-gray-200 dark:border-neutral-700/80 min-w-max">
          {(['overview', 'posts', 'documents'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Details card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Details</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: org.name },
                  { label: 'Type', value: org.type.charAt(0) + org.type.slice(1).toLowerCase() },
                  { label: 'Country', value: org.country ?? '—' },
                  { label: 'Created', value: joinDate },
                  ...(stats ? [{ label: 'Total Requests', value: String(stats.totalRequests) }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Members card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                  Members{org.members ? ` (${org.members.length})` : ''}
                </p>
                {isMember && (
                  <Link to={`/orgs/${id}/members`} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    View all →
                  </Link>
                )}
              </div>
              {org.members && org.members.length > 0 ? (
                <div className="space-y-3">
                  {org.members.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar name={m.name ?? 'User'} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-none truncate">{m.name ?? 'User'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.role}</p>
                      </div>
                    </div>
                  ))}
                  {org.members.length > 5 && (
                    <p className="text-xs text-slate-400 pt-1">+{org.members.length - 5} more members</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No members yet</p>
              )}
            </Card>
          </div>

          {/* Sourcing summary — visible for members with activity */}
          {isMember && stats && (stats.productsCount > 0 || stats.totalRequests > 0) && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Sourcing Activity</p>
                <Link to="/sourcing" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Go to Sourcing →
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
            </Card>
          )}
        </div>
      )}

      {/* Tab: Posts */}
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

      {/* Tab: Documents */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
            {isMember && (
              <Button size="sm" onClick={() => setShowUpload(!showUpload)} variant={showUpload ? 'outline' : 'primary'}>
                {showUpload ? 'Cancel' : '+ Upload Document'}
              </Button>
            )}
          </div>

          {showUpload && (
            <Card>
              <UploadDocumentForm
                orgId={id!}
                onSuccess={() => { setShowUpload(false); loadDocs(); }}
              />
            </Card>
          )}

          {docsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No documents yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
              {/* Table header — desktop only */}
              <div className="hidden sm:grid grid-cols-[1fr_auto] gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-neutral-700/80">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Document</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Actions</p>
              </div>
              {docs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    idx !== docs.length - 1 ? 'border-b border-gray-50 dark:border-neutral-700/60' : ''
                  } hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.description && <p className="text-xs text-slate-400 truncate">{doc.description}</p>}
                      {doc.description && <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>}
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">View</Button>
                    </a>
                    {(canManage || doc.uploadedBy?.id === user?.id) && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteDoc(doc.id)}>Delete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
