import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganization, getOrgMembers, updateOrganization, deleteOrganization, removeMember, type Organization, type OrgMember } from '../services/orgService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { PageLoader } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ORG_TYPES = ['COMPANY', 'LABORATORY', 'UNIVERSITY', 'REGULATOR', 'PROFESSIONAL'];

export default function OrgSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN';

  useEffect(() => {
    if (!id) return;
    Promise.all([getOrganization(id), getOrgMembers(id)])
      .then(([o, m]) => {
        setOrg(o);
        setMembers(m);
        setName(o.name);
        setType(o.type);
        setCountry(o.country || '');
        setDescription(o.description || '');
      })
      .catch(() => toast.error('Failed to load organization'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateOrganization(id, { name, type, country, description });
      setOrg(updated);
      toast.success('Organization updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !org) return;
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action is irreversible.`)) return;
    setDeleting(true);
    try {
      await deleteOrganization(id);
      toast.success('Organization deleted');
      navigate('/orgs');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!id) return;
    if (!confirm(`Remove ${memberName} from the organization?`)) return;
    try {
      await removeMember(id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) return <PageLoader />;
  if (!org) return <div className="text-center py-20 text-slate-400">Organization not found.</div>;

  const inputClass = 'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage {org.name}</p>
      </div>

      {/* Details */}
      <Card>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Organization Details</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} disabled={!isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass} disabled={!isAdmin}>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} disabled={!isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} disabled={!isAdmin} />
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" loading={saving} size="sm">Save Changes</Button>
            </div>
          )}
        </form>
      </Card>

      {/* Members */}
      <Card>
        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-4">Members ({members.length})</p>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-neutral-700/80 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar name={m.name ?? 'User'} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{m.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{m.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="gray">{m.role}</Badge>
                {isAdmin && m.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.id, m.name || 'User')}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No members</p>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      {isAdmin && (
        <Card>
          <p className="text-xs text-red-400 uppercase tracking-wide font-medium mb-4">Danger Zone</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Delete Organization</p>
              <p className="text-xs text-gray-400">Permanently delete this organization and all its data</p>
            </div>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
