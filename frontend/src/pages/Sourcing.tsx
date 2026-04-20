import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProducts, getProduct, getOrgProducts, createProduct, createBatch,
  createSourcingRequest, getMySourcingRequests, getOrgSourcingRequests,
  updateSourcingStatus, getOrgRecalls, createRecall,
  type Product, type SourcingRequest, type Recall,
} from '../services/marketplaceService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── Status badge helper ────────────────────────────────

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
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Tabs ───────────────────────────────────────────────

type Tab = 'browse' | 'my-requests' | 'supply' | 'incoming' | 'recalls';

const BUYER_TABS: { key: Tab; label: string }[] = [
  { key: 'browse', label: 'Products' },
  { key: 'my-requests', label: 'My Requests' },
];

const SUPPLIER_TABS: { key: Tab; label: string }[] = [
  { key: 'supply', label: 'My Supply' },
  { key: 'incoming', label: 'Incoming Requests' },
  { key: 'recalls', label: 'Recall Center' },
];

// ─── Main component ─────────────────────────────────────

export default function Sourcing() {
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;

  const [view, setView] = useState<'buyer' | 'supplier'>('buyer');
  const [tab, setTab] = useState<Tab>('browse');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [myRequests, setMyRequests] = useState<SourcingRequest[]>([]);
  const [orgProducts, setOrgProducts] = useState<Product[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SourcingRequest[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState<string | null>(null); // productId
  const [search, setSearch] = useState('');

  // Switch view resets tab
  useEffect(() => {
    setTab(view === 'buyer' ? 'browse' : 'supply');
  }, [view]);

  // Load data based on tab
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'browse') {
        setProducts(await getProducts());
      } else if (tab === 'my-requests') {
        setMyRequests(await getMySourcingRequests());
      } else if (tab === 'supply' && user?.organizationId) {
        setOrgProducts(await getOrgProducts(user.organizationId));
      } else if (tab === 'incoming' && user?.organizationId) {
        setIncomingRequests(await getOrgSourcingRequests(user.organizationId));
      } else if (tab === 'recalls' && user?.organizationId) {
        setRecalls(await getOrgRecalls(user.organizationId));
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab, user?.organizationId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.organization.name.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = view === 'buyer' ? BUYER_TABS : SUPPLIER_TABS;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Link to="/orgs" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1.5 transition-colors mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Organizations
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sourcing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {view === 'buyer' ? 'Browse products and request supply from the network' : 'Manage your supply and incoming orders'}
          </p>
        </div>

        {/* View toggle */}
        {hasOrg && (
          <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setView('buyer')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                view === 'buyer'
                  ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Network
            </button>
            <button
              onClick={() => setView('supplier')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                view === 'supplier'
                  ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              My Organization
            </button>
          </div>
        )}
      </div>

      {/* Tab bar — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex border-b border-gray-200 dark:border-neutral-700/80 min-w-max">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'browse' && (
            <BrowseProducts
              products={filteredProducts}
              search={search}
              onSearch={setSearch}
              onSelect={async (p) => {
                try {
                  const full = await getProduct(p.id);
                  setSelectedProduct(full);
                  setShowRequestModal(true);
                } catch {
                  toast.error('Failed to load product');
                }
              }}
            />
          )}
          {tab === 'my-requests' && (
            <MyRequests requests={myRequests} />
          )}
          {tab === 'supply' && (
            <MySupply
              products={orgProducts}
              onAddProduct={() => setShowAddProduct(true)}
              onAddBatch={(pid) => setShowAddBatch(pid)}
              onRefresh={loadData}
            />
          )}
          {tab === 'incoming' && (
            <IncomingRequests requests={incomingRequests} onRefresh={loadData} />
          )}
          {tab === 'recalls' && (
            <RecallCenter recalls={recalls} orgProducts={orgProducts} onRefresh={loadData} />
          )}
        </>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedProduct && (
        <RequestModal
          product={selectedProduct}
          onClose={() => { setShowRequestModal(false); setSelectedProduct(null); }}
          onSubmit={async (qty, unit, msg) => {
            await createSourcingRequest({ productId: selectedProduct.id, quantity: qty, unit, message: msg });
            toast.success('Request submitted');
            setShowRequestModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onSubmit={async (data) => {
            await createProduct(data);
            toast.success('Product added');
            setShowAddProduct(false);
            loadData();
          }}
        />
      )}

      {/* Add Batch Modal */}
      {showAddBatch && (
        <AddBatchModal
          productId={showAddBatch}
          onClose={() => setShowAddBatch(null)}
          onSubmit={async (data) => {
            await createBatch(data);
            toast.success('Batch created');
            setShowAddBatch(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ─── Browse Products ────────────────────────────────────

function BrowseProducts({
  products, search, onSearch, onSelect,
}: {
  products: Product[];
  search: string;
  onSearch: (s: string) => void;
  onSelect: (p: Product) => void;
}) {
  const [sort, setSort] = useState<'name' | 'price' | 'newest'>('newest');

  const sorted = [...products].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'price') return (Number(a.price) || 0) - (Number(b.price) || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      {/* Search + Sort toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products, categories, or organizations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'name' | 'price' | 'newest')}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/30 sm:w-40"
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="price">Price low–high</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-sm font-medium">No products available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(product => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="text-left bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 hover:shadow-md dark:hover:shadow-black/30 hover:border-blue-200 dark:hover:border-blue-800 transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                </div>
                {product.isCertified && (
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              {product.category && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md mb-2 inline-block self-start">
                  {product.category}
                </span>
              )}
              {product.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-auto">{product.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-50 dark:border-neutral-700/60">
                <span className="truncate">{product.organization.name}</span>
                {product.price != null && (
                  <span className="font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">
                    {product.currency ?? '€'}{Number(product.price).toFixed(2)}/{product.unit ?? 'unit'}
                  </span>
                )}
              </div>
              {product.origin && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">Origin: {product.origin}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Requests (buyer) ────────────────────────────────

function MyRequests({ requests }: { requests: SourcingRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-sm font-medium">You haven't made any sourcing requests yet</p>
        <p className="text-xs mt-1">Browse products and submit a request to get started</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 hover:border-gray-200 dark:hover:border-neutral-600 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{req.product.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  From {req.organization.name}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-50 dark:border-neutral-700/60">
              <span>Qty: <span className="font-semibold text-gray-700 dark:text-gray-300">{Number(req.quantity)} {req.unit ?? req.product.unit ?? ''}</span></span>
              <span className="text-gray-300 dark:text-neutral-600">·</span>
              <span>{new Date(req.createdAt).toLocaleDateString()}</span>
            </div>
          {req.message && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">"{req.message}"</p>
          )}
          {req.allocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Allocated Batches</p>
              <div className="flex flex-wrap gap-1.5">
                {req.allocations.map(a => (
                  <span key={a.id} className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                    {a.batch?.batchCode}: {Number(a.allocatedQuantity)} {req.unit ?? ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {req.supplierNotes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="font-semibold">Supplier note:</span> {req.supplierNotes}
            </p>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

// ─── My Supply (supplier) ───────────────────────────────

function MySupply({
  products, onAddProduct, onAddBatch,
}: {
  products: Product[];
  onAddProduct: () => void;
  onAddBatch: (productId: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={onAddProduct}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 shadow-sm transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm font-medium">No products listed yet</p>
          <p className="text-xs mt-1">Add your first product to start receiving sourcing requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {product.category && (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">
                        {product.category}
                      </span>
                    )}
                    {product.isCertified && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">
                        Certified
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{product._count.requests} request{product._count.requests !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => onAddBatch(product.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  + Add Batch
                </button>
              </div>

              {/* Batches */}
              {product.batches && product.batches.length > 0 ? (
                <div className="space-y-1.5">
                  {product.batches.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700/50 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{b.batchCode}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          b.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          b.status === 'DEPLETED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span>{Number(b.availableQuantity)}/{Number(b.totalQuantity ?? 0)} {product.unit ?? ''}</span>
                        {b.expiryDate && (
                          <span>Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No batches registered</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Incoming Requests (supplier) ───────────────────────

function IncomingRequests({ requests, onRefresh }: { requests: SourcingRequest[]; onRefresh: () => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (requestId: string, status: string) => {
    setUpdatingId(requestId);
    try {
      await updateSourcingStatus(requestId, status);
      toast.success(`Request ${status.toLowerCase().replace('_', ' ')}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <p className="text-sm font-medium">No incoming requests</p>
        <p className="text-xs mt-1">Requests from other organizations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const isPending = req.status === 'PENDING';
        const isApproved = req.status === 'APPROVED';
        const isUpdating = updatingId === req.id;

        return (
          <div key={req.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar name={req.requester.name} size="sm" src={req.requester.avatarUrl ?? undefined} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.requester.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requested {Number(req.quantity)} {req.unit ?? req.product.unit ?? ''} of <span className="font-medium">{req.product.name}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>
            {req.message && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic ml-11">"{req.message}"</p>
            )}

            {/* Allocation info */}
            {req.allocations.length > 0 && (
              <div className="mt-3 ml-11 flex flex-wrap gap-1.5">
                {req.allocations.map(a => (
                  <span key={a.id} className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                    {a.batch?.batchCode}: {Number(a.allocatedQuantity)}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            {(isPending || isApproved) && (
              <div className="flex items-center gap-2 mt-3 ml-11">
                {isPending && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-all"
                    >
                      Reject
                    </button>
                  </>
                )}
                {isApproved && (
                  <button
                    onClick={() => handleStatusUpdate(req.id, 'CONFIRMED')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
                  >
                    {isUpdating ? 'Allocating...' : 'Confirm & Allocate'}
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 ml-11">
              {new Date(req.createdAt).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recall Center ──────────────────────────────────────

function RecallCenter({
  recalls, orgProducts, onRefresh,
}: {
  recalls: Recall[];
  orgProducts: Product[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ batchId: '', type: 'WITHDRAWAL', issue: '', instructions: '' });
  const [submitting, setSubmitting] = useState(false);

  // Collect all batches from org products for the dropdown
  const allBatches = orgProducts.flatMap(p =>
    (p.batches ?? []).filter(b => b.status === 'ACTIVE').map(b => ({ ...b, productName: p.name }))
  );

  const handleSubmit = async () => {
    if (!formData.batchId || !formData.issue || !formData.instructions) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createRecall({
        batchId: formData.batchId,
        type: formData.type as 'WITHDRAWAL' | 'RECALL',
        issue: formData.issue,
        instructions: formData.instructions,
      });
      toast.success(`${formData.type === 'RECALL' ? 'Recall' : 'Withdrawal'} created. ${result.affectedOrganizations} organization(s) affected.`);
      setShowForm(false);
      setFormData({ batchId: '', type: 'WITHDRAWAL', issue: '', instructions: '' });
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">{recalls.length} record{recalls.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Trigger Withdrawal / Recall
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/50 p-5 mb-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">New Withdrawal / Recall</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <select
              value={formData.batchId}
              onChange={e => setFormData(d => ({ ...d, batchId: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500/30"
            >
              <option value="">Select batch...</option>
              {allBatches.map(b => (
                <option key={b.id} value={b.id}>{b.productName} / {b.batchCode}</option>
              ))}
            </select>
            <select
              value={formData.type}
              onChange={e => setFormData(d => ({ ...d, type: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500/30"
            >
              <option value="WITHDRAWAL">Withdrawal (supply chain only)</option>
              <option value="RECALL">Recall (includes consumers)</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Issue description"
            value={formData.issue}
            onChange={e => setFormData(d => ({ ...d, issue: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 mb-3 focus:ring-2 focus:ring-red-500/30"
          />
          <textarea
            placeholder="Instructions for affected parties"
            value={formData.instructions}
            onChange={e => setFormData(d => ({ ...d, instructions: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 mb-3 resize-none focus:ring-2 focus:ring-red-500/30"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recalls list */}
      {recalls.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm font-medium">No recalls or withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recalls.map(r => (
            <div key={r.id} className={`rounded-xl border p-5 ${
              r.type === 'RECALL'
                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      r.type === 'RECALL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    }`}>
                      {r.type}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {r.batch.product.name} / {r.batch.batchCode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{r.issue}</p>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{r.instructions}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Created by {r.createdBy.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Request Modal ──────────────────────────────────────

function RequestModal({
  product, onClose, onSubmit,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (qty: number, unit: string | undefined, message: string | undefined) => Promise<void>;
}) {
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState(product.unit ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalAvailable = (product.batches ?? []).reduce((sum, b) => sum + Number(b.availableQuantity), 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Request Supply</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{product.name} from {product.organization.name}</p>

        {/* Product info */}
        <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-lg p-3 mb-4 text-xs space-y-1">
          {product.category && <p><span className="text-gray-500 dark:text-gray-400">Category:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{product.category}</span></p>}
          {product.origin && <p><span className="text-gray-500 dark:text-gray-400">Origin:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{product.origin}</span></p>}
          {product.moq != null && <p><span className="text-gray-500 dark:text-gray-400">MOQ:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{Number(product.moq)} {product.unit ?? 'units'}</span></p>}
          {product.price != null && <p><span className="text-gray-500 dark:text-gray-400">Price:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{product.currency ?? '€'}{Number(product.price)}/{product.unit ?? 'unit'}</span></p>}
          {product.leadTimeDays != null && <p><span className="text-gray-500 dark:text-gray-400">Lead time:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{product.leadTimeDays} days</span></p>}
          <p><span className="text-gray-500 dark:text-gray-400">Available stock:</span> <span className="text-gray-700 dark:text-gray-200 font-medium">{totalAvailable} {product.unit ?? 'units'}</span></p>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex gap-2">
            <input
              type="number"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder="Quantity"
              min={product.moq ? Number(product.moq) : 1}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="Unit"
              className="w-24 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Message to supplier (optional)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!qty || Number(qty) <= 0) {
                toast.error('Enter a valid quantity');
                return;
              }
              setSubmitting(true);
              try {
                await onSubmit(Number(qty), unit || undefined, message || undefined);
              } catch (err: any) {
                toast.error(err?.response?.data?.error ?? 'Failed to submit');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Product Modal ──────────────────────────────────

function AddProductModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; category?: string; unit?: string; origin?: string; moq?: number; price?: number; currency?: string; leadTimeDays?: number; isCertified?: boolean }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '', description: '', category: '', unit: 'kg', origin: '',
    moq: '', price: '', currency: 'EUR', leadTimeDays: '', isCertified: false,
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Product</h2>
        <div className="space-y-3">
          <input type="text" placeholder="Product name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500/30" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
            <input type="text" placeholder="Unit (kg, L, pcs)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <input type="text" placeholder="Origin (country/region)" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="MOQ" value={form.moq} onChange={e => setForm(f => ({ ...f, moq: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
            <input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} step="0.01"
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
            <input type="number" placeholder="Lead days" value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isCertified} onChange={e => setForm(f => ({ ...f, isCertified: e.target.checked }))}
              className="rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500/30" />
            Certified product
          </label>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={async () => {
              if (!form.name) { toast.error('Name is required'); return; }
              setSubmitting(true);
              try {
                await onSubmit({
                  name: form.name,
                  description: form.description || undefined,
                  category: form.category || undefined,
                  unit: form.unit || undefined,
                  origin: form.origin || undefined,
                  moq: form.moq ? Number(form.moq) : undefined,
                  price: form.price ? Number(form.price) : undefined,
                  currency: form.currency,
                  leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
                  isCertified: form.isCertified,
                });
              } catch (err: any) {
                toast.error(err?.response?.data?.error ?? 'Failed to create');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Batch Modal ────────────────────────────────────

function AddBatchModal({
  productId, onClose, onSubmit,
}: {
  productId: string;
  onClose: () => void;
  onSubmit: (data: { productId: string; batchCode: string; totalQuantity: number; productionDate?: string; expiryDate?: string; notes?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    batchCode: '', totalQuantity: '', productionDate: '', expiryDate: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Batch</h2>
        <div className="space-y-3">
          <input type="text" placeholder="Batch code *" value={form.batchCode} onChange={e => setForm(f => ({ ...f, batchCode: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 font-mono" />
          <input type="number" placeholder="Total quantity *" value={form.totalQuantity} onChange={e => setForm(f => ({ ...f, totalQuantity: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 block">Production date</label>
              <input type="date" value={form.productionDate} onChange={e => setForm(f => ({ ...f, productionDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 block">Expiry date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={async () => {
              if (!form.batchCode || !form.totalQuantity) { toast.error('Batch code and quantity are required'); return; }
              setSubmitting(true);
              try {
                await onSubmit({
                  productId,
                  batchCode: form.batchCode,
                  totalQuantity: Number(form.totalQuantity),
                  productionDate: form.productionDate || undefined,
                  expiryDate: form.expiryDate || undefined,
                  notes: form.notes || undefined,
                });
              } catch (err: any) {
                toast.error(err?.response?.data?.error ?? 'Failed to create batch');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Creating...' : 'Create Batch'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
