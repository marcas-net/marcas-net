import { useState } from 'react';

interface FilePreviewProps {
  fileUrl: string;
  fileType?: string | null;
  title: string;
  onClose: () => void;
}

export function FilePreview({ fileUrl, fileType, title, onClose }: FilePreviewProps) {
  const [error, setError] = useState(false);
  const type = fileType?.toLowerCase() || '';

  const isPdf = type === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type);
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 min-h-[300px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Unable to preview this file</p>
              <p className="text-xs mt-1">Try downloading it instead</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${fullUrl}#toolbar=1`}
              className="w-full h-full min-h-[70vh] rounded-lg"
              title={title}
              onError={() => setError(true)}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={fullUrl}
                alt={title}
                className="max-w-full max-h-[70vh] rounded-lg object-contain"
                onError={() => setError(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Preview not available for .{type || 'unknown'} files</p>
              <p className="text-xs mt-1">Download the file to view its contents</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <a
            href={fullUrl}
            download
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Download
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
