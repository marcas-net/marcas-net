import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  ORG_ADMIN: 'bg-orange-100 text-orange-800',
  USER: 'bg-blue-100 text-blue-800',
  REGULATOR: 'bg-purple-100 text-purple-800',
  LAB: 'bg-green-100 text-green-800',
};

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  createdAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getProfile()
      .then((data) => setProfile(data.user))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const display = profile ?? user;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
              {(display?.name ?? display?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{display?.name ?? 'No name set'}</h2>
              <p className="text-gray-500 text-sm">{display?.email}</p>
            </div>
          </div>

          {/* Role */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Role</p>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${ROLE_COLORS[display?.role ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
              {display?.role ?? 'Unknown'}
            </span>
          </div>

          {/* Organization */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Organization</p>
            {profile?.organization ? (
              <Link
                to={`/orgs/${profile.organization.id}`}
                className="inline-flex items-center gap-2 text-indigo-600 hover:underline font-medium"
              >
                {profile.organization.name}
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {profile.organization.type}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">Not affiliated</span>
                <Link to="/orgs" className="text-sm text-indigo-600 hover:underline">
                  Browse organizations →
                </Link>
              </div>
            )}
          </div>

          {/* Member since */}
          {profile?.createdAt && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Member since</p>
              <p className="text-sm text-gray-600">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          )}

          {/* Logout */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
