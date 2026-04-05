import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createOrganization } from '../services/orgService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { CountrySelect } from '../components/ui/CountrySelect';
import toast from 'react-hot-toast';

const ORG_TYPES = [
  { value: 'COMPANY', label: 'Company' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'REGULATOR', label: 'Regulatory Body' },
  { value: 'PROFESSIONAL', label: 'Professional Association' },
];

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', type: 'COMPANY', country: '', description: '' });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const org = await createOrganization(form);
      toast.success('Organization created!');
      navigate(`/orgs/${org.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/orgs" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Organizations
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Organization</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set up a new organization on the MarcasNet platform</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Organization Name"
            placeholder="e.g. FoodSafe Labs"
            value={form.name}
            onChange={set('name')}
            required
          />
          <Select
            label="Organization Type"
            value={form.type}
            onChange={set('type')}
            options={ORG_TYPES}
          />
          <CountrySelect
            label="Country"
            value={form.country}
            onChange={(val) => setForm((f) => ({ ...f, country: val }))}
            placeholder="Select a country..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              placeholder="Briefly describe your organization…"
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} fullWidth>
              Create Organization
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/orgs')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
