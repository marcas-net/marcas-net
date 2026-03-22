import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrgDocuments, deleteDocument, type Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';

export default function OrganizationDocuments() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const isMember = user?.organizationId === id;
  const canManage = isMember && (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN');

  const load = () => {
    if (!id) return;
    setLoading(true);
    getOrgDocuments(id)
      .then(setDocs)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Deleted');
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link to={`/orgs/${id}`} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Organization
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="text-slate-500 text-sm mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
          </div>
          {isMember && (
            <Button size="md" onClick={() => setShowUpload(!showUpload)} variant={showUpload ? 'outline' : 'primary'}>
              {showUpload ? 'Cancel' : '+ Upload'}
            </Button>
          )}
        </div>
      </div>

      {showUpload && (
        <Card>
          <UploadDocumentForm orgId={id!} onSuccess={() => { setShowUpload(false); load(); }} />
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-600">No documents yet</p>
          {isMember && <p className="text-sm mt-1">Upload the first document above</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {docs.map((doc, idx) => (
            <div key={doc.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors ${idx !== docs.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
                {doc.description && <p className="text-xs text-slate-400 truncate mt-0.5">{doc.description}</p>}
                <p className="text-xs text-slate-300 mt-0.5">by {doc.uploadedBy?.name ?? doc.uploadedBy?.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">View</Button>
                </a>
                {(canManage || doc.uploadedBy?.id === user?.id) && (
                  <Button size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>Delete</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
