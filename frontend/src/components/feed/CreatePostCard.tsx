import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SUPPLY_OFFER', label: 'Supply Offer' },
  { value: 'PARTNERSHIP_REQUEST', label: 'Partnership' },
  { value: 'INDUSTRY_ANNOUNCEMENT', label: 'Announcement' },
];

interface CreatePostCardProps {
  onSubmit: (content: string, category: string) => Promise<void>;
}

export function CreatePostCard({ onSubmit }: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), category);
      setContent('');
      setCategory('GENERAL');
      setExpanded(false);
      setShowCategories(false);
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

            {expanded && content.trim() && (
              <div className="flex items-center justify-between mt-3">
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

                {/* Post button */}
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
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
