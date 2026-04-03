import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrganizations, type Organization } from '../services/orgService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { orgTypeVariant } from '../styles/design-system';
import toast from 'react-hot-toast';

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getOrganizations()
      .then(setOrgs)
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.type.toLowerCase().includes(search.toLowerCase()) ||
      (o.country ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organizations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Find and connect with organizations on MarcasNet</p>
        </div>
        <Link to="/orgs/create">
          <Button size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Organization
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name, type, or country…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-400">{filtered.length} organization{filtered.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-700/80 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 dark:bg-neutral-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-semibold">No organizations found</h3>
          <p className="text-slate-400 text-sm mt-1">Try a different search or create a new one</p>
          <Link to="/orgs/create" className="inline-block mt-4">
            <Button variant="outline" size="sm">Create Organization</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((org) => (
            <Link key={org.id} to={`/orgs/${org.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <Badge variant={orgTypeVariant[org.type] ?? 'gray'}>
                    {org.type.charAt(0) + org.type.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px] leading-snug mb-1">{org.name}</h3>
                {org.country && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {org.country}
                  </p>
                )}
                {org.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{org.description}</p>
                )}
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-neutral-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {(org as any)._count?.members ?? 0} member{((org as any)._count?.members ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">View details →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
