import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  ORG_ADMIN: 'bg-orange-100 text-orange-800',
  USER: 'bg-blue-100 text-blue-800',
  REGULATOR: 'bg-purple-100 text-purple-800',
  LAB: 'bg-green-100 text-green-800',
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600">MARCAS</span>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/orgs" className="text-gray-600 hover:text-gray-900">Organizations</Link>
          <Link to="/profile" className="text-gray-600 hover:text-gray-900">Profile</Link>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition">Sign out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.name ?? user?.email}
        </h1>
        <p className="text-gray-500 mb-8">Here's your MARCAS overview</p>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Role</p>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${ROLE_COLORS[user?.role ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
              {user?.role}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Email</p>
            <p className="text-sm text-gray-700 font-medium truncate">{user?.email}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Organization</p>
            {user?.organization ? (
              <Link to={`/orgs/${user.organization.id}`} className="text-sm text-indigo-600 hover:underline font-medium">
                {user.organization.name}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">Not affiliated</p>
            )}
          </div>
        </div>

        {!user?.organizationId && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-indigo-900">Join or create an organization</h2>
              <p className="text-sm text-indigo-600 mt-1">Connect with companies, labs, regulators and more.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/orgs" className="text-sm bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition font-medium">
                Browse
              </Link>
              <Link to="/orgs/create" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                Create
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;