import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOrgProducts, getOrgSourcingRequests, getOrgRecalls,
  getProductBatches, updateSourcingStatus, createProduct, createBatch, createRecall,
  type Product, type SourcingRequest, type Recall, type Batch, type BatchAllocation,
} from '../services/marketplaceService';
import { getOrgStats, getOrgLots, createLot, updateLotStatus, getOrgLoads, updateLoadStatus, type OrgStats, type Lot, type Load } from '../services/orgService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── Status Styles ──────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  IN_FULFILMENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  DELIVERED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  WITHDRAWN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  DEPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  RECALLED: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Tabs ───────────────────────────────────────────────

type Tab = 'requests' | 'products' | 'batches' | 'allocations' | 'recalls' | 'lots' | 'loads';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'requests', label: 'Requests', icon: '📋' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'batches', label: 'Batches', icon: '🏷️' },
  { key: 'lots', label: 'Lots', icon: '📦' },
  { key: 'loads', label: 'Loads', icon: '🚚' },
  { key: 'allocations', label: 'Allocations', icon: '📊' },
  { key: 'recalls', label: 'Recalls', icon: '⚠️' },
];

// ─── Main Component ─────────────────────────────────────

export default function OrgSourcingDashboard() {
  const { id: orgId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('requests');
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [batches, setBatches] = useState<(Batch & { productName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lots, setLots] = useState<Lot[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [loadsLoading, setLoadsLoading] = useState(false);
  const [createLotTarget, setCreateLotTarget] = useState<SourcingRequest | null>(null);

  // Modal states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddRecall, setShowAddRecall] = useState(false);
  const [batchProduct, setBatchProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [s, p, r, rc] = await Promise.all([
        getOrgStats(orgId),
        getOrgProducts(orgId),
        getOrgSourcingRequests(orgId),
        getOrgRecalls(orgId),
      ]);
      setStats(s);
      setProducts(p);
      setRequests(r);
      setRecalls(rc);

      // Load all batches for all products
      const allBatches: (Batch & { productName: string })[] = [];
      await Promise.all(p.map(async (prod) => {
        try {
          const b = await getProductBatches(prod.id);
          b.forEach(batch => allBatches.push({ ...batch, productName: prod.name }));
        } catch { /* skip */ }
      }));
      setBatches(allBatches);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'lots' && lots.length === 0 && orgId) {
      setLotsLoading(true);
      getOrgLots(orgId).then(setLots).catch(() => toast.error('Failed to load lots')).finally(() => setLotsLoading(false));
    }
    if (tab === 'loads' && loads.length === 0 && orgId) {
      setLoadsLoading(true);
      getOrgLoads(orgId).then(setLoads).catch(() => toast.error('Failed to load loads')).finally(() => setLoadsLoading(false));
    }
  }, [tab, orgId, lots.length, loads.length]);

  // Check if user is a member of this org
  const isMember = user?.organizationId === orgId;
  const isAdmin = isMember && (user?.role === 'ADMIN' || user?.role === 'OWNER');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-500">You must be a member of this organization to access the sourcing dashboard.</p>
        <Link to={`/orgs/${orgId}`} className="mt-4 inline-block text-blue-600 hover:underline">← Back to Organization</Link>
      </div>
    );
  }

  const allocations = batches.flatMap(b =>
    (b.allocations ?? []).map(a => ({ ...a, batchCode: b.batchCode, productName: b.productName }))
  );

  // Filter helper
  const q = search.toLowerCase();
  const filteredRequests = requests.filter(r =>
    r.requester.name.toLowerCase().includes(q) || r.product.name.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
  );
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q));
  const filteredBatches = batches.filter(b => b.batchCode.toLowerCase().includes(q) || b.productName.toLowerCase().includes(q));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={`/orgs/${orgId}`} className="text-sm text-blue-600 hover:underline">← Back to Organization</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Sourcing Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your products, batches, requests and recalls</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddProduct(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Add Product
          </button>
          {products.length > 0 && (
            <button onClick={() => { setBatchProduct(products[0]); setShowAddBatch(true); }} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200">
              + Add Batch
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {stats && <KPICards stats={stats} />}

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>{t.icon}</span> {t.label}
              {t.key === 'requests' && <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">{requests.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {tab === 'requests' && <RequestsTable requests={filteredRequests} onUpdate={load} isAdmin={isAdmin} onCreateLot={r => setCreateLotTarget(r)} />}
        {tab === 'products' && <ProductsGrid products={filteredProducts} />}
        {tab === 'batches' && <BatchesTable batches={filteredBatches} />}
        {tab === 'allocations' && <AllocationsTable allocations={allocations} />}
        {tab === 'recalls' && <RecallsTable recalls={recalls} products={products} onRecall={() => setShowAddRecall(true)} />}
        {tab === 'lots' && (
          lotsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>
          ) : (
            <LotsTable lots={lots} onStatusChange={async (lotId, status) => {
              if (!orgId) return;
              await updateLotStatus(orgId, lotId, status);
              toast.success('Status updated');
              const updated = await getOrgLots(orgId);
              setLots(updated);
            }} />
          )
        )}
        {tab === 'loads' && (
          loadsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>
          ) : (
            <LoadsTable loads={loads} onStatusChange={async (loadId, status) => {
              if (!orgId) return;
              await updateLoadStatus(orgId, loadId, status);
              toast.success('Status updated');
              const updated = await getOrgLoads(orgId);
              setLoads(updated);
            }} />
          )
        )}
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StockOverview products={products} batches={batches} />
        <BatchStatusChart batches={batches} />
        <RecentActivity requests={requests} />
      </div>

      {/* Modals */}
      {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onCreated={load} />}
      {showAddBatch && batchProduct && <AddBatchModal product={batchProduct} products={products} onSelectProduct={setBatchProduct} onClose={() => setShowAddBatch(false)} onCreated={load} />}
      {showAddRecall && <AddRecallModal batches={batches} onClose={() => setShowAddRecall(false)} onCreated={load} />}
      {createLotTarget && orgId && (
        <QuickCreateLotModal
          request={createLotTarget}
          orgId={orgId}
          onClose={() => setCreateLotTarget(null)}
          onDone={() => {
            setCreateLotTarget(null);
            setLotsLoading(true);
            getOrgLots(orgId).then(setLots).finally(() => setLotsLoading(false));
            setTab('lots');
          }}
        />
      )}
    </div>
  );
}

// ─── KPI Cards ──────────────────────────────────────────

function KPICards({ stats }: { stats: OrgStats }) {
  const cards = [
    { label: 'Products', value: stats.productsCount, icon: '📦', color: 'blue' },
    { label: 'Active Batches', value: stats.activeBatches, icon: '🏷️', color: 'green' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: '📋', color: 'yellow' },
    { label: 'Confirmed Orders', value: stats.confirmedOrders, icon: '✅', color: 'emerald' },
    { label: 'On-Hold Batches', value: stats.onHoldBatches, icon: '⏸️', color: 'orange' },
    { label: 'Total Stock', value: stats.totalStockQty, icon: '📊', color: 'purple', suffix: ' units' },
  ];
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-4 ${colorMap[c.color]}`}>
          <div className="text-lg mb-1">{c.icon}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}{c.suffix ?? ''}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Requests Table ─────────────────────────────────────

function RequestsTable({ requests, onUpdate, isAdmin, onCreateLot }: { requests: SourcingRequest[]; onUpdate: () => void; isAdmin: boolean; onCreateLot?: (r: SourcingRequest) => void }) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await updateSourcingStatus(id, status);
      toast.success(`Request ${status.toLowerCase()}`);
      onUpdate();
    } catch { toast.error('Failed to update'); }
    setUpdating(null);
  };

  if (requests.length === 0) return <EmptyState message="No sourcing requests yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Requester</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
            {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {requests.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={r.requester.name} src={r.requester.avatarUrl ?? undefined} size="xs" />
                  <span className="font-medium text-gray-900 dark:text-white">{r.requester.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.product.name}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.quantity} {r.unit ?? r.product.unit ?? ''}</td>
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
              {isAdmin && (
                <td className="px-4 py-3">
                  {r.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStatus(r.id, 'APPROVED')}
                        disabled={updating === r.id}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                      >Approve</button>
                      <button
                        onClick={() => handleStatus(r.id, 'REJECTED')}
                        disabled={updating === r.id}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                      >Reject</button>
                    </div>
                  )}
                  {r.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatus(r.id, 'CONFIRMED')}
                      disabled={updating === r.id}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
                    >Confirm & Allocate</button>
                  )}
                  {r.status === 'CONFIRMED' && onCreateLot && (
                    <button
                      onClick={() => onCreateLot(r)}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200"
                    >+ Lot</button>
                  )}
                  {(r.status === 'CONFIRMED' || r.status === 'IN_FULFILMENT') && (
                    <button
                      onClick={() => handleStatus(r.id, r.status === 'CONFIRMED' ? 'IN_FULFILMENT' : 'DELIVERED')}
                      disabled={updating === r.id}
                      className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium hover:bg-cyan-200 disabled:opacity-50"
                    >{r.status === 'CONFIRMED' ? 'Start Fulfilment' : 'Mark Delivered'}</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Products Grid ──────────────────────────────────────

function ProductsGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return <EmptyState message="No products yet" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {products.map(p => (
        <Link key={p.id} to={`/products/${p.id}`} className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
          {p.images && p.images.length > 0 ? (
            <div className="h-36 bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
          ) : (
            <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-3xl">📦</div>
          )}
          <div className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</h3>
                {p.category && <span className="text-xs text-gray-500 dark:text-gray-400">{p.category}</span>}
              </div>
              {!p.isPublished && <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">Draft</span>}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {p.price && <span className="font-medium text-gray-900 dark:text-white">€{Number(p.price).toFixed(2)}/{p.unit ?? 'unit'}</span>}
              <span>{p._count.batches} batches</span>
              <span>{p._count.requests} requests</span>
            </div>
            {p.certifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.certifications.slice(0, 3).map(c => (
                  <span key={c} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Batches Table ──────────────────────────────────────

function BatchesTable({ batches }: { batches: (Batch & { productName: string })[] }) {
  if (batches.length === 0) return <EmptyState message="No batches yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Batch Code</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Available / Total</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Expiry</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Allocations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {batches.map(b => (
            <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{b.batchCode}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{b.productName}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                {b.availableQuantity} / {b.totalQuantity ?? '—'}
              </td>
              <td className="px-4 py-3"><StatusBadge status={b.status ?? 'ACTIVE'} /></td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{b._count?.allocations ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Allocations Table ──────────────────────────────────

function AllocationsTable({ allocations }: { allocations: (BatchAllocation & { batchCode: string; productName: string })[] }) {
  if (allocations.length === 0) return <EmptyState message="No allocations yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Batch</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Requester</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {allocations.map(a => (
            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{a.batchCode}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.productName}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.request?.requester?.name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.allocatedQuantity}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Recalls Table ──────────────────────────────────────

function RecallsTable({ recalls, products, onRecall }: { recalls: Recall[]; products: Product[]; onRecall: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Active Recalls</h3>
        {products.length > 0 && (
          <button onClick={onRecall} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">
            Issue Recall
          </button>
        )}
      </div>
      {recalls.length === 0 ? (
        <EmptyState message="No recalls issued" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Batch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Issue</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Created By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recalls.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{r.batch.batchCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.batch.product.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.type} /></td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{r.issue}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.createdBy.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Panels ──────────────────────────────────────

function StockOverview({ products, batches }: { products: Product[]; batches: (Batch & { productName: string })[] }) {
  const stockByProduct = products.map(p => {
    const pBatches = batches.filter(b => b.productId === p.id);
    const totalQty = pBatches.reduce((s, b) => s + b.availableQuantity, 0);
    return { name: p.name, qty: totalQty, unit: p.unit ?? 'units', batches: pBatches.length };
  }).sort((a, b) => b.qty - a.qty);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stock Overview</h3>
      {stockByProduct.length === 0 ? (
        <p className="text-sm text-gray-500">No stock data</p>
      ) : (
        <div className="space-y-3">
          {stockByProduct.slice(0, 6).map(s => (
            <div key={s.name} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</div>
                <div className="text-xs text-gray-500">{s.batches} batches</div>
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.qty.toLocaleString()} {s.unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BatchStatusChart({ batches }: { batches: (Batch & { productName: string })[] }) {
  const counts: Record<string, number> = {};
  batches.forEach(b => { const s = b.status ?? 'ACTIVE'; counts[s] = (counts[s] ?? 0) + 1; });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-green-500', ON_HOLD: 'bg-yellow-500', DEPLETED: 'bg-gray-400', EXPIRED: 'bg-red-500', RECALLED: 'bg-red-700',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Batch Status</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No batch data</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colorMap[status] ?? 'bg-gray-400'}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{status.replace(/_/g, ' ')}</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
          {batches.length > 0 && (
            <div className="mt-3 h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
              {entries.map(([status, count]) => (
                <div key={status} className={`${colorMap[status] ?? 'bg-gray-400'} h-full`} style={{ width: `${(count / batches.length) * 100}%` }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ requests }: { requests: SourcingRequest[] }) {
  const recent = [...requests].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recent.map(r => (
            <div key={r.id} className="flex items-start gap-2">
              <Avatar name={r.requester.name} src={r.requester.avatarUrl ?? undefined} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-900 dark:text-white">
                  <span className="font-medium">{r.requester.name}</span> requested <span className="font-medium">{r.product.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={r.status} />
                  <span className="text-[10px] text-gray-400">{timeAgo(r.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modals ─────────────────────────────────────────────

function AddProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', category: '', unit: 'kg', origin: '', moq: '', price: '', currency: 'EUR',
    leadTimeDays: '', isCertified: false, shelfLifeMonths: '', certifications: '', deliveryTerms: '', shippingPorts: '', packagingOptions: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await createProduct({
        name: form.name.trim(),
        description: form.description || undefined,
        category: form.category || undefined,
        unit: form.unit || undefined,
        origin: form.origin || undefined,
        moq: form.moq ? Number(form.moq) : undefined,
        price: form.price ? Number(form.price) : undefined,
        currency: form.currency || undefined,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        isCertified: form.isCertified,
        shelfLifeMonths: form.shelfLifeMonths ? Number(form.shelfLifeMonths) : undefined,
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        deliveryTerms: form.deliveryTerms || undefined,
        shippingPorts: form.shippingPorts || undefined,
        packagingOptions: form.packagingOptions ? form.packagingOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      });
      toast.success('Product created');
      onCreated();
      onClose();
    } catch { toast.error('Failed to create product'); }
    setSaving(false);
  };

  return (
    <ModalWrapper title="Add Product" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
          <Input label="Unit" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Origin" value={form.origin} onChange={v => setForm(f => ({ ...f, origin: v }))} />
          <Input label="MOQ" value={form.moq} onChange={v => setForm(f => ({ ...f, moq: v }))} type="number" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Price" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" />
          <Input label="Currency" value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} />
          <Input label="Lead Time (days)" value={form.leadTimeDays} onChange={v => setForm(f => ({ ...f, leadTimeDays: v }))} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Shelf Life (months)" value={form.shelfLifeMonths} onChange={v => setForm(f => ({ ...f, shelfLifeMonths: v }))} type="number" />
          <Input label="Certifications (comma-sep)" value={form.certifications} onChange={v => setForm(f => ({ ...f, certifications: v }))} />
        </div>
        <Input label="Delivery Terms" value={form.deliveryTerms} onChange={v => setForm(f => ({ ...f, deliveryTerms: v }))} />
        <Input label="Shipping Ports" value={form.shippingPorts} onChange={v => setForm(f => ({ ...f, shippingPorts: v }))} />
        <Input label="Packaging Options (comma-sep)" value={form.packagingOptions} onChange={v => setForm(f => ({ ...f, packagingOptions: v }))} />
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={form.isCertified} onChange={e => setForm(f => ({ ...f, isCertified: e.target.checked }))} className="rounded" />
          Certified Product
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function AddBatchModal({ product, products, onSelectProduct, onClose, onCreated }: {
  product: Product; products: Product[]; onSelectProduct: (p: Product) => void; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ batchCode: '', totalQuantity: '', productionDate: '', expiryDate: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchCode.trim() || !form.totalQuantity) { toast.error('Batch code and quantity required'); return; }
    setSaving(true);
    try {
      await createBatch({
        productId: product.id,
        batchCode: form.batchCode.trim(),
        totalQuantity: Number(form.totalQuantity),
        productionDate: form.productionDate || undefined,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Batch created');
      onCreated();
      onClose();
    } catch { toast.error('Failed to create batch'); }
    setSaving(false);
  };

  return (
    <ModalWrapper title="Add Batch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product</label>
          <select
            value={product.id}
            onChange={e => { const p = products.find(p => p.id === e.target.value); if (p) onSelectProduct(p); }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="Batch Code *" value={form.batchCode} onChange={v => setForm(f => ({ ...f, batchCode: v }))} />
        <Input label="Total Quantity *" value={form.totalQuantity} onChange={v => setForm(f => ({ ...f, totalQuantity: v }))} type="number" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Production Date" value={form.productionDate} onChange={v => setForm(f => ({ ...f, productionDate: v }))} type="date" />
          <Input label="Expiry Date" value={form.expiryDate} onChange={v => setForm(f => ({ ...f, expiryDate: v }))} type="date" />
        </div>
        <Input label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} multiline />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Batch'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function AddRecallModal({ batches, onClose, onCreated }: {
  batches: (Batch & { productName: string })[]; onClose: () => void; onCreated: () => void;
}) {
  const activeBatches = batches.filter(b => b.status === 'ACTIVE' || b.status === 'ON_HOLD');
  const [form, setForm] = useState({ batchId: activeBatches[0]?.id ?? '', type: 'RECALL' as 'RECALL' | 'WITHDRAWAL', issue: '', instructions: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId || !form.issue.trim() || !form.instructions.trim()) { toast.error('All fields required'); return; }
    setSaving(true);
    try {
      await createRecall({ batchId: form.batchId, type: form.type, issue: form.issue.trim(), instructions: form.instructions.trim() });
      toast.success('Recall issued');
      onCreated();
      onClose();
    } catch { toast.error('Failed to issue recall'); }
    setSaving(false);
  };

  return (
    <ModalWrapper title="Issue Recall" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Batch</label>
          <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {activeBatches.map(b => <option key={b.id} value={b.id}>{b.batchCode} — {b.productName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'RECALL' | 'WITHDRAWAL' }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="RECALL">Recall</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
        <Input label="Issue *" value={form.issue} onChange={v => setForm(f => ({ ...f, issue: v }))} multiline />
        <Input label="Instructions *" value={form.instructions} onChange={v => setForm(f => ({ ...f, instructions: v }))} multiline />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
            {saving ? 'Issuing...' : 'Issue Recall'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Shared Components ──────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <div className="text-4xl mb-2">📭</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function Input({ label, value, onChange, type = 'text', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const cls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Lots Table ─────────────────────────────────────────

const LOT_STATUSES = ['OPEN', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'WITHDRAWN'];
const LOAD_STATUSES = ['PLANNING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'RECALLED'];

function LotsTable({ lots, onStatusChange }: { lots: Lot[]; onStatusChange: (lotId: string, status: string) => void }) {
  if (lots.length === 0) return <EmptyState message="No lots yet — create a lot from a confirmed request" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Lot Code</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Product</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Loads</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {lots.map(lot => (
            <tr key={lot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">{lot.lotCode}</td>
              <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{lot.request?.product.name ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{lot.totalQuantity}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{lot._count?.loads ?? lot.loads?.length ?? 0}</td>
              <td className="px-4 py-3">
                <select value={lot.status} onChange={e => onStatusChange(lot.id, e.target.value)} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {LOT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(lot.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Loads Table ────────────────────────────────────────

function LoadsTable({ loads, onStatusChange }: { loads: Load[]; onStatusChange: (loadId: string, status: string) => void }) {
  if (loads.length === 0) return <EmptyState message="No loads yet" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Load Code</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Destination</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">ETA</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {loads.map(l => (
            <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-white">{l.loadCode}</td>
              <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.destination}</td>
              <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{l.quantity}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{l.eta ? new Date(l.eta).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3">
                <select value={l.status} onChange={e => onStatusChange(l.id, e.target.value)} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {LOAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Quick Create Lot Modal ──────────────────────────────

function QuickCreateLotModal({ request, orgId, onClose, onDone }: { request: SourcingRequest; orgId: string; onClose: () => void; onDone: () => void }) {
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
    <ModalWrapper title="Create Lot" onClose={onClose}>
      <form onSubmit={handle} className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-sm space-y-1">
          <p><span className="text-gray-500">Product:</span> <span className="font-medium">{request.product.name}</span></p>
          <p><span className="text-gray-500">Quantity:</span> <span className="font-medium">{request.quantity} {request.unit ?? ''}</span></p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Lot'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
