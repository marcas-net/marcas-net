import { useState } from 'react';
import type { FormEvent } from 'react';
import { uploadDocument } from '../services/documentService';
import toast from 'react-hot-toast';

interface Props {
  orgId: string;
  onSuccess: () => void;
}

export default function UploadDocumentForm({ orgId, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('organizationId', orgId);
    formData.append('file', file);
    if (description.trim()) formData.append('description', description.trim());

    setLoading(true);
    try {
      await uploadDocument(formData);
      toast.success('Document uploaded!');
      setTitle('');
      setDescription('');
      setFile(null);
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Document</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quality Certification 2026"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details about this document"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, or images — max 10 MB</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
