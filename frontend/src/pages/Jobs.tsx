import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, createJob, closeJob, applyToJob, getMyApplications, type Job, type JobApplication } from '../services/jobsService';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Section = 'discover' | 'applications';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [section, setSection] = useState<Section>('discover');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', salary: '', type: 'FULL_TIME' });
  const [submitting, setSubmitting] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const loadJobs = (type?: string) => {
    setLoading(true);
    getJobs(type)
      .then(setJobs)
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  const loadApplications = () => {
    setLoadingApps(true);
    getMyApplications()
      .then(setApplications)
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoadingApps(false));
  };

  useEffect(() => {
    loadJobs(typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    if (section === 'applications') loadApplications();
  }, [section]);

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
        salary: form.salary || undefined,
        type: form.type,
      });
      setJobs((prev) => [job, ...prev]);
      setForm({ title: '', description: '', location: '', salary: '', type: 'FULL_TIME' });
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

  const handleApply = async (jobId: string) => {
    setApplying(true);
    try {
      await applyToJob(jobId, coverLetter || undefined);
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, applied: true, applicationsCount: j.applicationsCount + 1 } : j));
      setApplyingTo(null);
      setCoverLetter('');
      toast.success('Application submitted!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  // Split jobs into sections for discover view
  const recentJobs = jobs.slice(0, 3);
  const moreJobs = jobs.slice(3);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jobs & Opportunities</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Discover career opportunities in food & nutrition
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.organizationId && (
            <Button size="md" onClick={() => setShowForm(!showForm)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Job
            </Button>
          )}
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setSection('discover')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            section === 'discover'
              ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
              : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
          }`}
        >
          Discover Jobs
        </button>
        <button
          onClick={() => setSection('applications')}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            section === 'applications'
              ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
              : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
          }`}
        >
          My Applications ({applications.length})
        </button>
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
              placeholder="Job description, requirements, and benefits..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Location (e.g. Berlin, Remote)"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                placeholder="Salary (e.g. $80,000 - $100,000)"
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
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
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
              <Button size="md" disabled={submitting}>{submitting ? 'Posting...' : 'Post Job'}</Button>
            </div>
          </form>
        </Card>
      )}

      {section === 'discover' ? (
        <>
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
                <p className="text-slate-500 dark:text-slate-400 text-sm">No open positions right now</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Top Picks */}
              {recentJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top picks for you
                  </h2>
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <JobCard key={job.id} job={job} userId={user?.id} userOrgId={user?.organizationId ?? undefined} onClose={handleClose} onApply={(id) => setApplyingTo(id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* More Jobs */}
              {moreJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    More jobs for you
                  </h2>
                  <div className="space-y-3">
                    {moreJobs.map((job) => (
                      <JobCard key={job.id} job={job} userId={user?.id} userOrgId={user?.organizationId ?? undefined} onClose={handleClose} onApply={(id) => setApplyingTo(id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* My Applications */
        <div className="space-y-3">
          {loadingApps ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}><div className="p-5 animate-pulse space-y-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" /><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div></Card>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400">No applications yet</p>
                <p className="text-xs text-slate-400 mt-1">Start applying to jobs you're interested in</p>
              </div>
            </Card>
          ) : (
            applications.map((app) => (
              <Card key={app.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{app.job?.title}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        {app.job?.organization?.name}
                      </p>
                    </div>
                    <Badge variant={app.status === 'PENDING' ? 'yellow' : app.status === 'ACCEPTED' ? 'green' : 'gray'}>
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Applied {timeAgo(app.createdAt)}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {applyingTo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setApplyingTo(null)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Apply to this position</h3>
            <textarea
              placeholder="Cover letter (optional) — tell them why you're a great fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setApplyingTo(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
              <button
                onClick={() => handleApply(applyingTo)}
                disabled={applying}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Job Card Component ──────────────────────────────── */
function JobCard({ job, userId: _userId, userOrgId, onClose, onApply }: { job: Job; userId?: string; userOrgId?: string; onClose: (id: string) => void; onApply: (id: string) => void }) {
  return (
    <Card hover>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{job.title}</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{job.organization.name}</p>
          </div>
          <Badge variant={typeVariant[job.type] || 'blue'}>{typeLabel[job.type] || job.type}</Badge>
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
          {job.salary && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.salary}
            </span>
          )}
          <span>{timeAgo(job.createdAt)}</span>
          {job.applicationsCount > 0 && (
            <span className="text-blue-500">{job.applicationsCount} applicant{job.applicationsCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Posted by */}
        {job.postedBy && (
          <div className="flex items-center gap-2 mb-3">
            <Link to={`/profile/${job.postedBy.id}`} className="flex items-center gap-2 group">
              <Avatar name={job.postedBy.name} size="xs" src={job.postedBy.avatarUrl ?? undefined} />
              <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                Posted by <span className="font-medium">{job.postedBy.name}</span>
              </span>
            </Link>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">{job.description}</p>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          {job.applied ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Applied
            </span>
          ) : (
            <button
              onClick={() => onApply(job.id)}
              className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </button>
          )}
          {userOrgId === job.organizationId && (
            <button
              onClick={() => onClose(job.id)}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Close Position
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
