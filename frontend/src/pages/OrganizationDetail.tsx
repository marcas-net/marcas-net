import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrganization, joinOrganization, type Organization } from '../services/orgService';
import { getOrgDocuments, deleteDocument, type Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { orgTypeVariant } from '../styles/design-system';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'documents';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrganization(id)
      .then(setOrg)
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
  }, [tab]);

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!org) return (
    <div className="text-center py-20 text-slate-400">Organization not found.</div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/orgs" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Organizations
      </Link>

      {/* Hero card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{org.name}</h1>
                <Badge variant={orgTypeVariant[org.type] ?? 'gray'}>
                  {org.type.charAt(0) + org.type.slice(1).toLowerCase()}
                </Badge>
                {isMember && <Badge variant="green">Member</Badge>}
              </div>
              {org.country && (
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {org.country}
                </p>
              )}
            </div>
          </div>
          {!isMember && (
            <Button onClick={handleJoin} loading={joining} size="md">
              Join Organization
            </Button>
          )}
        </div>
        {org.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">{org.description}</p>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['overview', 'documents'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Details</p>
            <div className="space-y-3">
              {[
                { label: 'Name', value: org.name },
                { label: 'Type', value: org.type.charAt(0) + org.type.slice(1).toLowerCase() },
                { label: 'Country', value: org.country ?? '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">Members</p>
            {org.members && org.members.length > 0 ? (
              <div className="space-y-2">
                {org.members.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name ?? m.email} size="xs" />
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-none">{m.name ?? m.email}</p>
                      <p className="text-xs text-slate-400">{m.role}</p>
                    </div>
                  </div>
                ))}
                {org.members.length > 5 && (
                  <p className="text-xs text-slate-400">+{org.members.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No members yet</p>
            )}
            {isMember && (
              <Link
                to={`/orgs/${id}/members`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View all members &amp; invite →
              </Link>
            )}
          </Card>
        </div>
      )}

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
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {docs.map((doc, idx) => (
                <div key={doc.id} className={`flex items-center gap-4 px-5 py-4 ${idx !== docs.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                    {doc.description && <p className="text-xs text-slate-400 truncate">{doc.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
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
