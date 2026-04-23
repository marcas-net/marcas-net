import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyNetwork } from '../../services/feedService';
import { Avatar } from '../ui/Avatar';

interface Circle {
  id: string;
  name: string;
  avatarUrl: string | null;
  href: string;
}

interface Props {
  newPostAuthors: { id: string; name: string; avatarUrl?: string }[];
  onRefresh: () => void;
}

export function StoryCircles({ newPostAuthors, onRefresh }: Props) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMyNetwork()
      .then(({ following }) => {
        setCircles(
          following.slice(0, 20).map((p) => ({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl,
            href: `/profile/${p.id}`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  // Merge new-post authors into front of list (highlight ring)
  const newIds = new Set(newPostAuthors.map((a) => a.id));

  if (circles.length === 0 && newPostAuthors.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-3">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide"
      >
        {/* New-posts refresh pill */}
        {newPostAuthors.length > 0 && (
          <button
            onClick={onRefresh}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
          >
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-neutral-800">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {newPostAuthors.length}
              </span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">New posts</span>
          </button>
        )}

        {/* Followed-user circles */}
        {circles.map((circle) => (
          <Link
            key={circle.id}
            to={circle.href}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
          >
            <div className={`w-12 h-12 rounded-full ${newIds.has(circle.id) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-800' : ''}`}>
              <Avatar
                name={circle.name}
                src={circle.avatarUrl ?? undefined}
                size="md"
                className="w-12 h-12 rounded-full"
              />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 whitespace-nowrap max-w-[52px] truncate">
              {circle.name.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
