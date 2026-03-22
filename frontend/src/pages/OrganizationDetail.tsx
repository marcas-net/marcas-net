import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrganization, joinOrganization } from '../services/orgService';
import type { Organization } from '../services/orgService';
import { getOrgDocuments, deleteDocument } from '../services/documentService';
import type { Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
  COMPANY: 'bg-blue-100 text-blue-800',
  LABORATORY: 'bg-green-100 text-green-800',
  UNIVERSITY: 'bg-purple-100 text-purple-800',
  REGULATOR: 'bg-red-100 text-red-800',
  PROFESSIONAL: 'bg-yellow-100 text-yellow-800',
};

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
      toast.error(error.response?.data?.error ?? 'Failed to join organization');
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!org) return <div className="min-h-screen flex items-center justify-center text-gray-400">Organization not found.</div>;

  const isAlreadyMember = user?.organizationId === org.id;
  const canDelete = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/orgs')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Organizations
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-0">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                {org.country && <p className="text-gray-500 mt-1">{org.country}</p>}
              </div>
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${TYPE_COLORS[org.type] ?? 'bg-gray-100 text-gray-600'}`}>
                {org.type}
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100">
              {(['overview', 'documents'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                    tab === t
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Overview */}
          {tab === 'overview' && (
            <div className="p-8">
              {org.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{org.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <span>{org._count?.members ?? 0} member{(org._count?.members ?? 0) !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
              </div>

              {isAlreadyMember ? (
                <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium text-center">
                  You are a member of this organization
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Organization'}
                </button>
              )}
            </div>
          )}

          {/* Tab: Documents */}
          {tab === 'documents' && (
            <div className="p-8">
              {isAlreadyMember && (
                <div className="mb-5 flex justify-end">
                  <button
                    onClick={() => setShowUpload((v) => !v)}
                    className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    {showUpload ? 'Cancel' : '+ Upload Document'}
                  </button>
                </div>
              )}

              {showUpload && id && (
                <div className="mb-6">
                  <UploadDocumentForm
                    orgId={id}
                    onSuccess={() => {
                      setShowUpload(false);
                      loadDocs();
                    }}
                  />
                </div>
              )}

              {docsLoading ? (
                <div className="text-center py-10 text-gray-400">Loading documents...</div>
              ) : docs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>No documents uploaded yet.</p>
                  {isAlreadyMember && (
                    <button onClick={() => setShowUpload(true)} className="text-indigo-600 text-sm hover:underline mt-2 block mx-auto">
                      Upload the first document
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-indigo-700 hover:underline truncate block"
                        >
                          {doc.title}
                        </a>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          <span>By {doc.uploadedBy.name ?? doc.uploadedBy.email}</span>
                          <span>·</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 items-center">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline font-medium">View</a>
                        {(canDelete || doc.uploadedById === user?.id) && (
                          <button onClick={() => handleDeleteDoc(doc.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 text-right">
                    <Link to={`/orgs/${id}/documents`} className="text-xs text-indigo-500 hover:underline">
                      View all documents →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
