import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrgDocuments, deleteDocument, type Document } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DocumentCard } from '../components/DocumentCard';
import UploadDocumentForm from '../components/UploadDocumentForm';
import toast from 'react-hot-toast';

const FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

export default function OrganizationDocuments() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterUploader, setFilterUploader] = useState('');

  const isMember = user?.organizationId === id;
  const canManage = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  const load = () => {
    if (!id) return;
    setLoading(true);
    getOrgDocuments(id)
      .then(setAllDocs)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocument(docId);
      toast.success('Deleted');
      setAllDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Derive unique uploaders for filter dropdown
  const uploaders = Array.from(
    new Map(allDocs.map((d) => [d.uploadedBy.id, d.uploadedBy])).values()
  );

  const filtered = allDocs.filter((d) => {
    if (filterType && d.fileType !== filterType) return false;
    if (filterUploader && d.uploadedById !== filterUploader) return false;
    return true;
  });

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
            <p className="text-slate-500 text-sm mt-1">{filtered.length} of {allDocs.length} document{allDocs.length !== 1 ? 's' : ''}</p>
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

      {/* Filters */}
      {allDocs.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All file types</option>
            {FILE_TYPES.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={filterUploader}
            onChange={(e) => setFilterUploader(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All uploaders</option>
            {uploaders.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>

          {(filterType || filterUploader) && (
            <button
              onClick={() => { setFilterType(''); setFilterUploader(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-slate-600">
            {allDocs.length === 0 ? 'No documents yet' : 'No documents match your filters'}
          </p>
          {isMember && allDocs.length === 0 && <p className="text-sm mt-1">Upload the first document above</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canDelete={canManage || doc.uploadedBy.id === user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
