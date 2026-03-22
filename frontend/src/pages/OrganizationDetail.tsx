import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganization, joinOrganization, Organization } from '../services/orgService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_COLORS: Record<string, string> = {
  COMPANY: 'bg-blue-100 text-blue-800',
  LABORATORY: 'bg-green-100 text-green-800',
  UNIVERSITY: 'bg-purple-100 text-purple-800',
  REGULATOR: 'bg-red-100 text-red-800',
  PROFESSIONAL: 'bg-yellow-100 text-yellow-800',
};

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrganization(id)
      .then(setOrg)
      .catch(() => toast.error('Organization not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await joinOrganization(id);
      toast.success(`Joined ${org?.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to join organization');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!org) return <div className="min-h-screen flex items-center justify-center text-gray-400">Organization not found.</div>;

  const isAlreadyMember = user?.organizationId === org.id;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/orgs')} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1">
          ← Back to Organizations
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              {org.country && <p className="text-gray-500 mt-1">{org.country}</p>}
            </div>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${TYPE_COLORS[org.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {org.type}
            </span>
          </div>

          {org.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{org.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <span>{org._count?.members ?? 0} member{(org._count?.members ?? 0) !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Joined {new Date(org.createdAt).toLocaleDateString()}</span>
          </div>

          {isAlreadyMember ? (
            <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm font-medium text-center">
              You are a member of this organization
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Organization'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
