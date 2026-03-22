import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrganizations } from '../services/orgService';
import type { Organization } from '../services/orgService';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
  COMPANY: 'bg-blue-100 text-blue-800',
  LABORATORY: 'bg-green-100 text-green-800',
  UNIVERSITY: 'bg-purple-100 text-purple-800',
  REGULATOR: 'bg-red-100 text-red-800',
  PROFESSIONAL: 'bg-yellow-100 text-yellow-800',
};

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrganizations()
      .then(setOrgs)
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-500 mt-1">Find and connect with organizations on MARCAS</p>
          </div>
          <Link
            to="/orgs/create"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            + New Organization
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No organizations yet.</p>
            <Link to="/orgs/create" className="text-indigo-600 mt-2 inline-block hover:underline">
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                to={`/orgs/${org.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">{org.name}</h2>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-2 shrink-0 ${TYPE_COLORS[org.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {org.type}
                  </span>
                </div>
                {org.country && (
                  <p className="text-sm text-gray-500 mb-2">{org.country}</p>
                )}
                {org.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {org._count?.members ?? 0} member{(org._count?.members ?? 0) !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
