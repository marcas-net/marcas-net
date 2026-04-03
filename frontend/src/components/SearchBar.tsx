import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { search, type SearchResults } from '../services/searchService';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await search(query);
        setResults(data);
        setOpen(true);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = results && (results.organizations.length > 0 || results.documents.length > 0 || results.users.length > 0);

  return (
    <div ref={ref} className="relative hidden md:block">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organizations, documents, users..."
          className="w-64 lg:w-80 pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-96 bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-lg z-50 overflow-hidden">
          {!hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results!.organizations.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-neutral-800/50">Organizations</div>
                  {results!.organizations.map((org) => (
                    <button key={org.id} onClick={() => go(`/orgs/${org.id}`)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{org.name}</p>
                        <p className="text-xs text-gray-400">{org.type} · {org._count.members} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results!.documents.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-neutral-800/50">Documents</div>
                  {results!.documents.map((doc) => (
                    <button key={doc.id} onClick={() => go(`/orgs/${doc.organizationId}/documents`)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{doc.title}</p>
                        <p className="text-xs text-gray-400">{doc.fileType?.toUpperCase()} · {doc.organization.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results!.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-neutral-800/50">Users</div>
                  {results!.users.map((u) => (
                    <div key={u.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{u.name || u.email}</p>
                        <p className="text-xs text-gray-400">{u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
