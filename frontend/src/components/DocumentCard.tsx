import type { Document } from '../services/documentService';
import { getDownloadUrl } from '../services/documentService';
import { Badge } from './ui/Badge';

interface Props {
  document: Document;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
};

const FILE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 border-red-100',
  doc: 'bg-blue-50 border-blue-100',
  docx: 'bg-blue-50 border-blue-100',
  xls: 'bg-green-50 border-green-100',
  xlsx: 'bg-green-50 border-green-100',
};

export function DocumentCard({ document: doc, onDelete, canDelete }: Props) {
  const icon = FILE_ICONS[doc.fileType ?? ''] ?? '📎';
  const colorClass = FILE_COLORS[doc.fileType ?? ''] ?? 'bg-gray-50 border-gray-100';
  const downloadUrl = getDownloadUrl(doc.id);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-shadow flex gap-4">
      {/* File icon */}
      <div className={`w-11 h-11 rounded-lg border flex items-center justify-center text-2xl flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{doc.title}</h3>
          {doc.fileType && (
            <Badge variant="gray" className="text-xs uppercase flex-shrink-0">
              {doc.fileType}
            </Badge>
          )}
        </div>
        {doc.description && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 line-clamp-1">{doc.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span>{formatBytes(doc.fileSize)}</span>
          <span>·</span>
          <span>{formatDate(doc.createdAt)}</span>
          <span>·</span>
          <span>by {doc.uploadedBy.name ?? doc.uploadedBy.email}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={downloadUrl}
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(doc.id)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
