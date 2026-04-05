import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offer' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnership' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcement' },
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

interface CreatePostCardProps {
  onSubmit: (content: string, category: string, media?: File[]) => Promise<void>;
}

export function CreatePostCard({ onSubmit }: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const newPreviews: { url: string; type: 'image' | 'video' }[] = [];
    const remaining = MAX_FILES - mediaFiles.length;

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const f = files[i];
      if (f.size > MAX_FILE_SIZE) continue;
      newFiles.push(f);
      const isVideo = f.type.startsWith('video/');
      newPreviews.push({ url: URL.createObjectURL(f), type: isVideo ? 'video' : 'image' });
    }

    setMediaFiles((prev) => [...prev, ...newFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    setExpanded(true);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && mediaFiles.length === 0) || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), category, mediaFiles.length > 0 ? mediaFiles : undefined);
      setContent('');
      setCategory('GENERAL');
      setExpanded(false);
      setShowCategories(false);
      mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
      setMediaFiles([]);
      setMediaPreviews([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFocus = () => {
    setExpanded(true);
  };

  const selectedCategoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? 'General';

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-3">
          <Avatar
            name={user?.name ?? user?.email}
            size="md"
            src={user?.avatarUrl ?? undefined}
            className="flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              placeholder="What's happening in the industry?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              rows={expanded ? 3 : 1}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none resize-none transition-all"
            />

            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className={`grid gap-2 mt-3 ${mediaPreviews.length === 1 ? 'grid-cols-1' : mediaPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {mediaPreviews.map((preview, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-700">
                    {preview.type === 'image' ? (
                      <img src={preview.url} alt="" className="w-full h-32 object-cover" />
                    ) : (
                      <video src={preview.url} className="w-full h-32 object-cover" muted />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {preview.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              className="hidden"
            />

            {expanded && (
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Media upload buttons */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={mediaFiles.length >= MAX_FILES}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-40 transition-colors"
                    title={`Add photos or videos (${mediaFiles.length}/${MAX_FILES})`}
                  >
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    Media
                    {mediaFiles.length > 0 && (
                      <span className="text-[10px] text-gray-400">({mediaFiles.length})</span>
                    )}
                  </button>

                  {/* Category picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategories(!showCategories)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {selectedCategoryLabel}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCategories && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-700 rounded-lg border border-gray-200 dark:border-neutral-600 shadow-lg py-1 z-10 min-w-[160px]">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => { setCategory(cat.value); setShowCategories(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                              category === cat.value
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post button */}
                <button
                  type="submit"
                  disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs font-semibold hover:shadow-md hover:shadow-blue-500/20 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Posting...
                    </span>
                  ) : 'Post'}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
