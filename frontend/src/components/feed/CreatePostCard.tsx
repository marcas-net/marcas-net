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
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type PostMode = 'post' | 'poll' | 'event';

interface CreatePostCardProps {
  onSubmit: (data: {
    content: string;
    category: string;
    type?: 'POST' | 'POLL' | 'EVENT';
    media?: File[];
    pollQuestion?: string;
    pollOptions?: string[];
    pollDuration?: number;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
    eventLink?: string;
  }) => Promise<void>;
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
  const [mode, setMode] = useState<PostMode>('post');
  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(7);
  // Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventLink, setEventLink] = useState('');
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

  const resetForm = () => {
    setContent('');
    setCategory('GENERAL');
    setExpanded(false);
    setShowCategories(false);
    setMode('post');
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration(7);
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
    setEventLink('');
    mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (mode === 'post' && !content.trim() && mediaFiles.length === 0) return;
    if (mode === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) return;
    if (mode === 'event' && !eventTitle.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        category,
        type: mode === 'poll' ? 'POLL' : mode === 'event' ? 'EVENT' : 'POST',
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
        ...(mode === 'poll' && {
          pollQuestion: pollQuestion.trim(),
          pollOptions: pollOptions.filter(o => o.trim()),
          pollDuration,
        }),
        ...(mode === 'event' && {
          eventTitle: eventTitle.trim(),
          eventDate: eventDate || undefined,
          eventLocation: eventLocation.trim() || undefined,
          eventLink: eventLink.trim() || undefined,
        }),
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
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
              placeholder={mode === 'poll' ? 'Add context to your poll...' : mode === 'event' ? 'Tell people about this event...' : "What's happening in the industry?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              rows={expanded ? 3 : 1}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 outline-none resize-none transition-all"
            />

            {/* Poll fields */}
            {expanded && mode === 'poll' && (
              <div className="mt-3 space-y-2 p-3 rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700/30">
                <input
                  type="text"
                  placeholder="Your question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-500 px-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    + Add option
                  </button>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500">Duration:</span>
                  <select value={pollDuration} onChange={(e) => setPollDuration(Number(e.target.value))} className="px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-xs text-gray-700 dark:text-gray-200 outline-none">
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                  </select>
                </div>
              </div>
            )}

            {/* Event fields */}
            {expanded && mode === 'event' && (
              <div className="mt-3 space-y-2 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                <input
                  type="text"
                  placeholder="Event name *"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <input
                  type="url"
                  placeholder="Event link (optional)"
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className={`grid gap-2 mt-3 ${mediaPreviews.length === 1 ? 'grid-cols-1' : mediaPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {mediaPreviews.map((preview, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-700">
                    {preview.type === 'image' ? (
                      <img src={preview.url} alt="" className="w-full h-32 object-cover" />
                    ) : (
                      <div className="relative w-full h-32">
                        <video src={preview.url} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/*"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              className="hidden"
            />

            {expanded && (
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Mode tabs */}
                  <button
                    type="button"
                    onClick={() => setMode('post')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'post' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('poll'); setExpanded(true); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'poll' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('event'); setExpanded(true); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'event' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Event
                  </button>

                  <div className="w-px h-5 bg-gray-200 dark:bg-neutral-600 mx-1" />

                  {/* Media upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={mediaFiles.length >= MAX_FILES}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-40 transition-colors"
                  >
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    Media
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
                  disabled={submitting || (mode === 'post' && !content.trim() && mediaFiles.length === 0) || (mode === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) || (mode === 'event' && !eventTitle.trim())}
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
                  ) : mode === 'poll' ? 'Create Poll' : mode === 'event' ? 'Create Event' : 'Post'}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
