import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { roleVariant } from '../styles/design-system';
import {
  getOrgAdminDashboard, getOrgLots, getOrgLoads,
  reviewSourcingRequest, createLot, createLoad, updateLotStatus, updateLoadStatus,
  type OrgAdminStats, type Lot, type Load,
} from '../services/orgService';
import {
  getOrgSourcingRequests, getOrgProducts,
  type SourcingRequest, type Product,
} from '../services/marketplaceService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────

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
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  PLANNING: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  READY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  ON_HOLD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
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

// ─── No-Org State ─────────────────────────────────────────

function NoOrgState() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>

      {/* Text */}
      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Operations Center Awaits
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Join or create an organization to access sourcing management, batch tracking, logistics, and your team workspace.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/orgs"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse Organizations
        </Link>
        <Link
          to="/orgs/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-semibold rounded-xl text-sm border border-gray-200 dark:border-neutral-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Organization
        </Link>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl text-xs text-gray-500 dark:text-gray-400">
        {['Sourcing Requests', 'Batch Tracking', 'Loads & Shipments', 'Team Management'].map(f => (
          <div key={f} className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Org Operations Dashboard ─────────────────────────────

type Tab = 'overview' | 'requests' | 'offers' | 'lots' | 'loads';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'requests', label: 'Requests' },
  { key: 'offers', label: 'My Offers' },
  { key: 'lots', label: 'Lots & Allocations' },
  { key: 'loads', label: 'Loads & Shipments' },
];

function OrgDashboard({ orgId }: { orgId: string }) {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<OrgAdminStats['stats'] | null>(null);
  const [dashData, setDashData] = useState<OrgAdminStats | null>(null);
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [reviewModal, setReviewModal] = useState<SourcingRequest | null>(null);
  const [createLotModal, setCreateLotModal] = useState<SourcingRequest | null>(null);
  const [createLoadModal, setCreateLoadModal] = useState<Lot | null>(null);

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, reqs] = await Promise.all([
        getOrgAdminDashboard(orgId),
        getOrgSourcingRequests(orgId),
      ]);
      setDashData(dash);
      setStats(dash.stats);
      setRequests(reqs);
    } catch {
      // stats stay null — UI shows dashes
    }
    setLoading(false);
  }, [orgId]);

  const loadProducts = useCallback(async () => {
    try { setProducts(await getOrgProducts(orgId)); } catch {}
  }, [orgId]);

  const loadLots = useCallback(async () => {
    try { setLots(await getOrgLots(orgId)); } catch {}
  }, [orgId]);

  const loadLoads = useCallback(async () => {
    try { setLoads(await getOrgLoads(orgId)); } catch {}
  }, [orgId]);

  useEffect(() => { loadCore(); }, [loadCore]);

  useEffect(() => {
    if (tab === 'offers') loadProducts();
    if (tab === 'lots') loadLots();
    if (tab === 'loads') loadLoads();
  }, [tab, loadProducts, loadLots, loadLoads]);

  const filteredRequests = requests.filter(r => {
    const q = search.toLowerCase();
    return !q || r.product.name.toLowerCase().includes(q) || r.requester.name.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.organization?.name ?? 'Organization Dashboard'}
            </h1>
            <Badge variant={roleVariant[role] ?? 'blue'}>{role.replace('_', ' ')}</Badge>
            {user?.organization && (
              <span className="text-xs bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {user.organization.type}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Sourcing Management — supply, requests, allocations, and logistics
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            to={`/orgs/${orgId}`}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Public Profile →
          </Link>
          <Link
            to={`/orgs/${orgId}/admin`}
            className="px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Admin Panel →
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Offers',
            value: stats?.activeRequests ?? (loading ? '—' : 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
            color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Pending Requests',
            value: stats?.pendingRequests ?? (loading ? '—' : 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            color: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400',
            warn: (stats?.pendingRequests ?? 0) > 0,
          },
          {
            label: 'Confirmed Orders',
            value: stats?.confirmedRequests ?? (loading ? '—' : 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Stock on Hold',
            value: stats?.totalBatches ?? (loading ? '—' : 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ),
            color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
          },
        ].map(card => (
          <div
            key={card.label}
            className={`bg-white dark:bg-neutral-800 rounded-xl border ${(card as any).warn ? 'border-yellow-200 dark:border-yellow-800' : 'border-gray-100 dark:border-neutral-700/80'} shadow-sm p-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${(card as any).warn && (card.value as number) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Rail */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stock Banner */}
          {stats && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Stock Overview</p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-[11px] text-gray-400">Available Stock</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.availableStock.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Total Stock</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalStock.toLocaleString()} units</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Total Batches</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalBatches}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Open Lots</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pendingLots}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">In Transit</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.transitLoads}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Requests */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Requests</h3>
                <button onClick={() => setTab('requests')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  View all →
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-700/50">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                ) : (dashData?.recentRequests ?? []).length === 0 ? (
                  <p className="px-4 py-8 text-sm text-gray-400 text-center">No requests yet</p>
                ) : dashData?.recentRequests.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                    <Avatar src={r.requester.avatarUrl ?? undefined} name={r.requester.name ?? '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.product.name}</p>
                      <p className="text-xs text-gray-500">{r.requester.name} · {r.quantity} {r.unit ?? 'units'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={r.status} />
                      <span className="text-[10px] text-gray-400">{timeAgo(r.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-700/50 max-h-72 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                  </div>
                ) : (dashData?.recentActivity ?? []).length === 0 ? (
                  <p className="px-4 py-8 text-sm text-gray-400 text-center">No activity yet</p>
                ) : dashData?.recentActivity.map(a => (
                  <div key={a.id} className="px-4 py-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{a.user?.name ?? 'System'}</span>{' '}
                        <span className="text-gray-400">{a.action.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Team & Permissions', desc: 'Members & roles', to: `/orgs/${orgId}/members`, color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
              { label: 'Products & Catalog', desc: 'Manage offerings', to: `/orgs/${orgId}/catalog`, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
              { label: 'Sourcing', desc: 'Market requests', to: `/orgs/${orgId}/sourcing`, color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' },
              { label: 'Documents', desc: 'Certs & reports', to: `/orgs/${orgId}/documents`, color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Requests Tab ─────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              placeholder="Search by product, buyer, or status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </span>
          </div>
          <RequestsTable
            requests={filteredRequests}
            loading={loading}
            onReview={r => setReviewModal(r)}
            onCreateLot={r => setCreateLotModal(r)}
          />
        </div>
      )}

      {/* ── My Offers Tab ─────────────────────────────────── */}
      {tab === 'offers' && (
        <OffersPanel products={products} orgId={orgId} />
      )}

      {/* ── Lots Tab ─────────────────────────────────────── */}
      {tab === 'lots' && (
        <LotsPanel
          lots={lots}
          onCreateLoad={lot => setCreateLoadModal(lot)}
          onStatusChange={async (lotId, status) => {
            await updateLotStatus(orgId, lotId, status);
            toast.success('Status updated');
            loadLots();
          }}
        />
      )}

      {/* ── Loads Tab ─────────────────────────────────────── */}
      {tab === 'loads' && (
        <LoadsPanel
          loads={loads}
          onStatusChange={async (loadId, status) => {
            await updateLoadStatus(orgId, loadId, status);
            toast.success('Status updated');
            loadLoads();
          }}
        />
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {reviewModal && (
        <ReviewModal
          request={reviewModal}
          orgId={orgId}
          onClose={() => setReviewModal(null)}
          onDone={() => { setReviewModal(null); loadCore(); }}
        />
      )}
      {createLotModal && (
        <CreateLotModal
          request={createLotModal}
          orgId={orgId}
          onClose={() => setCreateLotModal(null)}
          onDone={() => { setCreateLotModal(null); loadCore(); loadLots(); setTab('lots'); }}
        />
      )}
      {createLoadModal && (
        <CreateLoadModal
          lot={createLoadModal}
          orgId={orgId}
          onClose={() => setCreateLoadModal(null)}
          onDone={() => { setCreateLoadModal(null); loadLoads(); setTab('loads'); }}
        />
      )}
    </div>
  );
}

// ─── Requests Table ───────────────────────────────────────

function RequestsTable({ requests, loading, onReview, onCreateLot }: {
  requests: SourcingRequest[];
  loading: boolean;
  onReview: (r: SourcingRequest) => void;
  onCreateLot: (r: SourcingRequest) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No requests found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Request ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Buyer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/40">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] text-gray-400">{r.id.slice(0, 8).toUpperCase()}</span>
                </td>
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
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                  {r.quantity} {r.unit ?? ''}
                </td>
                <td className="px-4 py-3 text-[10px] text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(r.status) && (
                      <button
                        onClick={() => onReview(r)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    )}
                    {r.status === 'CONFIRMED' && (
                      <button
                        onClick={() => onCreateLot(r)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                      >
                        + Lot
                      </button>
                    )}
                    {!['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'CONFIRMED'].includes(r.status) && (
                      <span className="text-[10px] text-gray-400">—</span>
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

// ─── Offers Panel ─────────────────────────────────────────

function OffersPanel({ products, orgId }: { products: Product[]; orgId: string }) {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-sm mb-3">No products listed yet</p>
        <Link
          to={`/orgs/${orgId}/catalog`}
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{products.length} Products Listed</h3>
        <Link to={`/orgs/${orgId}/catalog`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Manage Catalog →
        </Link>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-neutral-700/40">
        {products.map(p => (
          <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category ?? 'Uncategorized'} · {p.unit ?? 'unit'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {p.isPublished ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">LIVE</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400">DRAFT</span>
              )}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {p.price ? `$${Number(p.price).toFixed(2)}` : '—'}
              </span>
            </div>
          </div>
        ))}
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
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <p className="text-sm">No lots yet — confirm requests to create lots</p>
      </div>
    );
  }

  const statusOptions = ['OPEN', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'WITHDRAWN'];

  return (
    <div className="space-y-3">
      {lots.map(lot => (
        <div key={lot.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm p-4">
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
                className="px-2 py-1 text-xs border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {['OPEN', 'LOADING'].includes(lot.status) && (
                <button
                  onClick={() => onCreateLoad(lot)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Load
                </button>
              )}
            </div>
          </div>
          {lot.loads && lot.loads.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700/50">
              <p className="text-[10px] font-medium text-gray-400 mb-2">LOADS ({lot.loads.length})</p>
              <div className="flex flex-wrap gap-2">
                {lot.loads.map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-neutral-700/40 rounded text-xs">
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
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <p className="text-sm">No loads yet</p>
      </div>
    );
  }

  const statusOptions = ['PLANNING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'RECALLED'];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Load Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Destination</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">ETA</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/40">
            {loads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">{l.loadCode}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.lot?.request?.product.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.destination}</td>
                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.quantity}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{l.eta ? new Date(l.eta).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={l.status}
                    onChange={e => onStatusChange(l.id, e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
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

// ─── Modals ───────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReviewModal({ request, orgId, onClose, onDone }: { request: SourcingRequest; orgId: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handle = async (action: string) => {
    setSaving(true);
    try {
      await reviewSourcingRequest(orgId, request.id, action, notes || undefined);
      toast.success(`Request ${action}d`);
      onDone();
    } catch {
      toast.error('Failed to update request');
    }
    setSaving(false);
  };

  return (
    <ModalShell title="Review Request" onClose={onClose}>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-neutral-900/40 rounded-xl space-y-1.5 text-sm">
          <p><span className="text-gray-400 text-xs">Product</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.product.name}</span></p>
          <p><span className="text-gray-400 text-xs">Buyer</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.requester.name}</span></p>
          <p><span className="text-gray-400 text-xs">Quantity</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.quantity} {request.unit ?? ''}</span></p>
          {request.message && <p><span className="text-gray-400 text-xs">Message</span><br /><span className="text-gray-700 dark:text-gray-300">{request.message}</span></p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Supplier Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
          <button disabled={saving} onClick={() => handle('reject')} className="px-4 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-xl font-medium transition-colors disabled:opacity-50">Reject</button>
          <button disabled={saving} onClick={() => handle('approve')} className="px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 rounded-xl font-medium transition-colors disabled:opacity-50">Approve</button>
          <button disabled={saving} onClick={() => handle('confirm')} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

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
    } catch {
      toast.error('Failed to create lot');
    }
    setSaving(false);
  };

  return (
    <ModalShell title="Create Lot" onClose={onClose}>
      <form onSubmit={handle} className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-neutral-900/40 rounded-xl text-sm space-y-1.5">
          <p><span className="text-gray-400 text-xs">Product</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.product.name}</span></p>
          <p><span className="text-gray-400 text-xs">Quantity</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.quantity} {request.unit ?? ''}</span></p>
          <p><span className="text-gray-400 text-xs">Buyer</span><br /><span className="font-medium text-gray-900 dark:text-white">{request.requester.name}</span></p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Lot'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

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
    } catch {
      toast.error('Failed to create load');
    }
    setSaving(false);
  };

  return (
    <ModalShell title={`Create Load for ${lot.lotCode}`} onClose={onClose}>
      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Destination *</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Paris, FR" className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantity *</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Units" className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ETA</label>
          <input type="date" value={eta} onChange={e => setEta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl text-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Load'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Root Export ──────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const orgId = user?.organizationId;
  if (!orgId) return <NoOrgState />;
  return <OrgDashboard orgId={orgId} />;
}
