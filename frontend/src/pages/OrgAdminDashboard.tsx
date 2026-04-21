import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOrgAdminDashboard, getOrgLots, createLot, updateLotStatus,
  getOrgLoads, createLoad, updateLoadStatus,
  reviewSourcingRequest,
  type OrgAdminStats, type Lot, type Load,
} from '../services/orgService';
import { getOrgSourcingRequests, type SourcingRequest } from '../services/marketplaceService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── Status ──────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  IN_FULFILMENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  DELIVERED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  WITHDRAWN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  LOADING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  PLANNING: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  READY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  RECALLED: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ─── Tabs ─────────────────────────────────────────────────

type Tab = 'overview' | 'requests' | 'lots' | 'loads';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'requests', label: 'Requests', icon: '📋' },
  { key: 'lots', label: 'Lots', icon: '🏷️' },
  { key: 'loads', label: 'Loads & Shipments', icon: '🚚' },
];

// ─── Main Component ───────────────────────────────────────

export default function OrgAdminDashboard() {
  const { id: orgId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [dashData, setDashData] = useState<OrgAdminStats | null>(null);
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [reviewModal, setReviewModal] = useState<SourcingRequest | null>(null);
  const [createLotModal, setCreateLotModal] = useState<SourcingRequest | null>(null);
  const [createLoadModal, setCreateLoadModal] = useState<Lot | null>(null);

  const isOrgAdmin = user?.organizationId === orgId && (user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN');

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [dash, reqs] = await Promise.all([
        getOrgAdminDashboard(orgId),
        getOrgSourcingRequests(orgId),
      ]);
      setDashData(dash);
      setRequests(reqs);
    } catch {
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  }, [orgId]);

  const loadLots = useCallback(async () => {
    if (!orgId) return;
    try { setLots(await getOrgLots(orgId)); } catch { toast.error('Failed to load lots'); }
  }, [orgId]);

  const loadLoads = useCallback(async () => {
    if (!orgId) return;
    try { setLoads(await getOrgLoads(orgId)); } catch { toast.error('Failed to load loads'); }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab === 'lots') loadLots();
    if (tab === 'loads') loadLoads();
  }, [tab, loadLots, loadLoads]);

  if (!isOrgAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-500">You must be an Organization Admin to access this panel.</p>
        <Link to={`/orgs/${orgId}`} className="mt-4 inline-block text-blue-600 hover:underline">← Back to Organization</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const stats = dashData?.stats;
  const q = search.toLowerCase();
  const filteredRequests = requests.filter(r =>
    r.product.name.toLowerCase().includes(q) ||
    r.requester.name.toLowerCase().includes(q) ||
    r.status.toLowerCase().includes(q)
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link to={`/orgs/${orgId}`} className="text-xs text-blue-600 hover:underline">← Organization</Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Operations Center</h1>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">ADMIN</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sourcing · Lots · Loads · Traceability</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/orgs/${orgId}/sourcing`} className="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            Sourcing →
          </Link>
          <Link to={`/orgs/${orgId}/catalog`} className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Products →
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Pending Requests', value: stats.pendingRequests, icon: '📥', warn: stats.pendingRequests > 0 },
            { label: 'Active Requests', value: stats.activeRequests, icon: '🔄', warn: false },
            { label: 'Confirmed', value: stats.confirmedRequests, icon: '✅', warn: false },
            { label: 'Active Batches', value: stats.activeBatches, icon: '🏷️', warn: false },
            { label: 'Open Lots', value: stats.pendingLots, icon: '📦', warn: false },
            { label: 'In Transit', value: stats.transitLoads, icon: '🚚', warn: stats.transitLoads > 0 },
          ].map(c => (
            <div key={c.label} className={`bg-white dark:bg-gray-800 rounded-xl border ${c.warn ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'} p-4`}>
              <div className="text-lg mb-1">{c.icon}</div>
              <div className={`text-2xl font-bold ${c.warn ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Banner */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available Stock</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.availableStock.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Stock</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStock.toLocaleString()} units</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Batches</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalBatches}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Lots</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalLots}</p>
          </div>
        </div>
      )}

      {/* Tab Rail */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Requests</h3>
              <button onClick={() => setTab('requests')} className="text-xs text-blue-600 hover:underline">View all →</button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {(dashData?.recentRequests ?? []).length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">No requests yet</p>
              ) : dashData?.recentRequests.map(r => (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <Avatar src={r.requester.avatarUrl ?? undefined} name={r.requester.name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.product.name}</p>
                    <p className="text-xs text-gray-500">{r.requester.name} · {r.quantity} {r.unit ?? 'units'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-gray-400">{timeAgo(r.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Activity</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-80 overflow-y-auto">
              {(dashData?.recentActivity ?? []).length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">No recent activity</p>
              ) : dashData?.recentActivity.map(a => (
                <div key={a.id} className="px-4 py-2.5 flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">⚡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300">{a.user?.name ?? 'System'} <span className="text-gray-400">{a.action.replace(/_/g, ' ')}</span></p>
                    <p className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Requests Tab ─────────────────────────── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-xs text-gray-500 self-center">{filteredRequests.length} requests</span>
          </div>
          <RequestsTable
            requests={filteredRequests}
            onReview={r => setReviewModal(r)}
            onCreateLot={r => setCreateLotModal(r)}
          />
        </div>
      )}

      {/* ── Lots Tab ──────────────────────────────── */}
      {tab === 'lots' && (
        <LotsPanel
          lots={lots}
          onCreateLoad={lot => setCreateLoadModal(lot)}
          onStatusChange={async (lotId, status) => {
            await updateLotStatus(orgId!, lotId, status);
            toast.success('Status updated');
            loadLots();
          }}
        />
      )}

      {/* ── Loads Tab ─────────────────────────────── */}
      {tab === 'loads' && (
        <LoadsPanel
          loads={loads}
          onStatusChange={async (loadId, status) => {
            await updateLoadStatus(orgId!, loadId, status);
            toast.success('Status updated');
            loadLoads();
          }}
        />
      )}

      {/* ── Modals ───────────────────────────────── */}
      {reviewModal && (
        <ReviewModal
          request={reviewModal}
          orgId={orgId!}
          onClose={() => setReviewModal(null)}
          onDone={() => { setReviewModal(null); load(); }}
        />
      )}
      {createLotModal && (
        <CreateLotModal
          request={createLotModal}
          orgId={orgId!}
          onClose={() => setCreateLotModal(null)}
          onDone={() => { setCreateLotModal(null); load(); loadLots(); }}
        />
      )}
      {createLoadModal && (
        <CreateLoadModal
          lot={createLoadModal}
          orgId={orgId!}
          onClose={() => setCreateLoadModal(null)}
          onDone={() => { setCreateLoadModal(null); loadLoads(); setTab('loads'); }}
        />
      )}
    </div>
  );
}

// ─── Requests Table ───────────────────────────────────────

function RequestsTable({ requests, onReview, onCreateLot }: {
  requests: SourcingRequest[];
  onReview: (r: SourcingRequest) => void;
  onCreateLot: (r: SourcingRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3">📋</span>
        <p className="text-sm">No requests found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Buyer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Quantity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={r.requester.avatarUrl ?? undefined} name={r.requester.name} size="sm" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{r.requester.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{r.product.name}</p>
                  {r.product.category && <p className="text-[10px] text-gray-400">{r.product.category}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{r.quantity} {r.unit ?? ''}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(r.status) && (
                      <button onClick={() => onReview(r)} className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700">
                        Review
                      </button>
                    )}
                    {r.status === 'CONFIRMED' && (
                      <button onClick={() => onCreateLot(r)} className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        + Lot
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Lots Panel ───────────────────────────────────────────

function LotsPanel({ lots, onCreateLoad, onStatusChange }: {
  lots: Lot[];
  onCreateLoad: (lot: Lot) => void;
  onStatusChange: (lotId: string, status: string) => void;
}) {
  if (lots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3">📦</span>
        <p className="text-sm">No lots yet — confirm requests to create lots</p>
      </div>
    );
  }

  const statusOptions = ['OPEN', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'WITHDRAWN'];

  return (
    <div className="space-y-3">
      {lots.map(lot => (
        <div key={lot.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{lot.lotCode}</span>
                <StatusBadge status={lot.status} />
              </div>
              {lot.request && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {lot.request.product.name} · {lot.totalQuantity} units · {lot.request.requester.name ?? 'Unknown'}
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">{new Date(lot.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={lot.status}
                onChange={e => onStatusChange(lot.id, e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {['OPEN', 'LOADING'].includes(lot.status) && (
                <button onClick={() => onCreateLoad(lot)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Load
                </button>
              )}
            </div>
          </div>
          {lot.loads && lot.loads.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <p className="text-[10px] font-medium text-gray-400 mb-2">LOADS ({lot.loads.length})</p>
              <div className="flex flex-wrap gap-2">
                {lot.loads.map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700/40 rounded text-xs">
                    <span className="font-mono text-gray-700 dark:text-gray-300">{l.loadCode}</span>
                    <span className="text-gray-500">→ {l.destination}</span>
                    <StatusBadge status={l.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Loads Panel ──────────────────────────────────────────

function LoadsPanel({ loads, onStatusChange }: {
  loads: Load[];
  onStatusChange: (loadId: string, status: string) => void;
}) {
  if (loads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3">🚚</span>
        <p className="text-sm">No loads yet</p>
      </div>
    );
  }

  const statusOptions = ['PLANNING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'RECALLED'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Load Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Destination</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">ETA</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {loads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">{l.loadCode}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.lot?.request?.product.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.destination}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.quantity}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{l.eta ? new Date(l.eta).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={l.status}
                    onChange={e => onStatusChange(l.id, e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────

function ReviewModal({ request, orgId, onClose, onDone }: { request: SourcingRequest; orgId: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (action: string) => {
    setSaving(true);
    try {
      await reviewSourcingRequest(orgId, request.id, action, notes || undefined);
      toast.success(`Request ${action}d`);
      onDone();
    } catch { toast.error('Failed to update request'); }
    setSaving(false);
  };

  return (
    <ModalShell title="Review Request" onClose={onClose}>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg space-y-1 text-sm">
          <p><span className="text-gray-500">Product:</span> <span className="font-medium text-gray-900 dark:text-white">{request.product.name}</span></p>
          <p><span className="text-gray-500">Buyer:</span> <span className="font-medium text-gray-900 dark:text-white">{request.requester.name}</span></p>
          <p><span className="text-gray-500">Quantity:</span> <span className="font-medium text-gray-900 dark:text-white">{request.quantity} {request.unit ?? ''}</span></p>
          {request.message && <p><span className="text-gray-500">Message:</span> {request.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Supplier Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button disabled={saving} onClick={() => handle('reject')} className="px-4 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium">Reject</button>
          <button disabled={saving} onClick={() => handle('approve')} className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium">Approve</button>
          <button disabled={saving} onClick={() => handle('confirm')} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium">Confirm</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Create Lot Modal ─────────────────────────────────────

function CreateLotModal({ request, orgId, onClose, onDone }: { request: SourcingRequest; orgId: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLot(orgId, { requestId: request.id, notes: notes || undefined });
      toast.success('Lot created');
      onDone();
    } catch { toast.error('Failed to create lot'); }
    setSaving(false);
  };

  return (
    <ModalShell title="Create Lot" onClose={onClose}>
      <form onSubmit={handle} className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-sm space-y-1">
          <p><span className="text-gray-500">Product:</span> <span className="font-medium">{request.product.name}</span></p>
          <p><span className="text-gray-500">Quantity:</span> <span className="font-medium">{request.quantity} {request.unit ?? ''}</span></p>
          <p><span className="text-gray-500">Buyer:</span> <span className="font-medium">{request.requester.name}</span></p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Lot'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Create Load Modal ────────────────────────────────────

function CreateLoadModal({ lot, orgId, onClose, onDone }: { lot: Lot; orgId: string; onClose: () => void; onDone: () => void }) {
  const [destination, setDestination] = useState('');
  const [quantity, setQuantity] = useState('');
  const [eta, setEta] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !quantity) { toast.error('Destination and quantity required'); return; }
    setSaving(true);
    try {
      await createLoad(orgId, { lotId: lot.id, destination, quantity: parseFloat(quantity), eta: eta || undefined, notes: notes || undefined });
      toast.success('Load created');
      onDone();
    } catch { toast.error('Failed to create load'); }
    setSaving(false);
  };

  return (
    <ModalShell title={`Create Load for ${lot.lotCode}`} onClose={onClose}>
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Destination *</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Paris, FR" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantity *</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Units" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ETA</label>
          <input type="date" value={eta} onChange={e => setEta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Load'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Shared Modal Shell ───────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
