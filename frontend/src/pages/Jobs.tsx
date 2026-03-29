import { useEffect, useState } from 'react';
import { getJobs, createJob, closeJob, type Job } from '../services/jobsService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const JOB_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'FULL_TIME', label: 'Full-Time' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'COLLABORATION', label: 'Collaboration' },
] as const;

const typeLabel: Record<string, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  COLLABORATION: 'Collaboration',
};

const typeVariant: Record<string, 'blue' | 'green' | 'yellow' | 'purple' | 'orange'> = {
  FULL_TIME: 'blue',
  PART_TIME: 'green',
  CONTRACT: 'orange',
  INTERNSHIP: 'purple',
  COLLABORATION: 'yellow',
};

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', type: 'FULL_TIME' });
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = (type?: string) => {
    setLoading(true);
    getJobs(type)
      .then(setJobs)
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs(typeFilter);
  }, [typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and description are required');
    }
    setSubmitting(true);
    try {
      const job = await createJob({
        title: form.title,
        description: form.description,
        location: form.location || undefined,
        type: form.type,
      });
      setJobs((prev) => [job, ...prev]);
      setForm({ title: '', description: '', location: '', type: 'FULL_TIME' });
      setShowForm(false);
      toast.success('Job posted');
    } catch {
      toast.error('Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success('Job closed');
    } catch {
      toast.error('Failed to close job');
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jobs & Opportunities</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Discover career opportunities and collaborations in food & nutrition
          </p>
        </div>
        {user?.organizationId && (
          <Button size="md" onClick={() => setShowForm(!showForm)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post Job
          </Button>
        )}
      </div>

      {/* Create Job Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Post a Job</h3>
            <Input
              placeholder="Job title (e.g. Food Safety Analyst)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              placeholder="Job description, requirements, and benefits…"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Location (e.g. Berlin, Remote)"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="COLLABORATION">Collaboration</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <Button size="md" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Job'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Type Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {JOB_TYPES.map((jt) => (
          <button
            key={jt.value}
            onClick={() => setTypeFilter(jt.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === jt.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {jt.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-sm">No open positions right now. Check back later!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {job.organization.name}
                    </p>
                  </div>
                  <Badge variant={typeVariant[job.type] || 'blue'}>
                    {typeLabel[job.type] || job.type}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  <span>{timeAgo(job.createdAt)}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                  {job.description}
                </p>

                {/* Actions */}
                {user?.organizationId === job.organizationId && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() => handleClose(job.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Close Position
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
