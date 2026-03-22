import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrgDocuments, deleteDocument, Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export default function OrganizationDocuments() {
  const { id: orgId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const isMember = user?.organizationId === orgId;
  const canDelete = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  const load = () => {
    if (!orgId) return;
    setLoading(true);
    getOrgDocuments(orgId)
      .then(setDocs)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [orgId]);

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Document deleted');
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-800">
              ← Back to Organization
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Documents</h1>
          </div>
          {isMember && (
            <button
              onClick={() => setShowUpload((v) => !v)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              {showUpload ? 'Cancel' : '+ Upload Document'}
            </button>
          )}
        </div>

        {showUpload && orgId && (
          <div className="mb-6">
            <UploadDocumentForm
              orgId={orgId}
              onSuccess={() => {
                setShowUpload(false);
                load();
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileIcon />
            <p className="mt-3 text-lg">No documents yet.</p>
            {isMember && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-3 text-indigo-600 hover:underline text-sm"
              >
                Upload the first document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
              >
                <div className="mt-0.5 shrink-0">
                  <FileIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-indigo-700 hover:underline truncate block"
                  >
                    {doc.title}
                  </a>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>By {doc.uploadedBy.name ?? doc.uploadedBy.email}</span>
                    <span>·</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    View
                  </a>
                  {(canDelete || doc.uploadedById === user?.id) && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
