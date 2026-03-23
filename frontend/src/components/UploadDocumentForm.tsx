import { useState } from 'react';
import { uploadDocument } from '../services/documentService';
import { Card } from './ui/Card';
import { Input, Textarea } from './ui/Input';
import { Button } from './ui/Button';
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <Card>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Upload Document</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title *"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Quality Certification 2026"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional details about this document"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File *</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-950/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1.5">PDF, Word, Excel, or images — max 10 MB</p>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          Upload Document
        </Button>
      </form>
    </Card>
  );
}
