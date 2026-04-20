import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProduct, getProducts, getProductBatches, createSourcingRequest,
  type Product, type Batch, type ProductImage,
} from '../services/marketplaceService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── Main Component ─────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'supply'>('overview');
  const [selectedImage, setSelectedImage] = useState(0);

  // Request form
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState({ quantity: '', unit: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, b] = await Promise.all([getProduct(id), getProductBatches(id)]);
      setProduct(p);
      setBatches(b);
      setSelectedImage(0);

      // Load similar products (same category)
      try {
        const all = await getProducts();
        const sim = all.filter(pr => pr.id !== p.id && pr.category === p.category).slice(0, 4);
        setSimilar(sim.length > 0 ? sim : all.filter(pr => pr.id !== p.id).slice(0, 4));
      } catch { /* skip */ }
    } catch {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reqForm.quantity) { toast.error('Quantity is required'); return; }
    setSubmitting(true);
    try {
      await createSourcingRequest({
        productId: product.id,
        quantity: Number(reqForm.quantity),
        unit: reqForm.unit || product.unit || undefined,
        message: reqForm.message || undefined,
      });
      toast.success('Request submitted!');
      setShowRequest(false);
      setReqForm({ quantity: '', unit: '', message: '' });
    } catch { toast.error('Failed to submit request'); }
    setSubmitting(false);
  };

  // Check if user is member of the product's org
  const isOwnProduct = user?.memberships?.some((m: { organizationId: string }) => m.organizationId === product?.organizationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Product Not Found</h2>
        <Link to="/sourcing" className="mt-4 inline-block text-blue-600 hover:underline">← Browse Products</Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const totalStock = batches.filter(b => b.status === 'ACTIVE').reduce((s, b) => s + b.availableQuantity, 0);
  const hasStock = totalStock > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link to="/sourcing" className="hover:text-blue-600">Products</Link>
        <span>/</span>
        <Link to={`/orgs/${product.organizationId}/catalog`} className="hover:text-blue-600">{product.organization.name}</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Image Gallery + Info */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Image Gallery */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-[4/3]">
              {images.length > 0 ? (
                <img src={images[selectedImage]?.url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {product.category && <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>}
                  {product.origin && <span className="text-sm text-gray-400 flex items-center gap-1"><span>📍</span>{product.origin}</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${hasStock ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {hasStock ? 'In Stock' : 'On Request'}
                  </span>
                </div>
              </div>
              {product.price && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">€{Number(product.price).toFixed(2)}</div>
                  <div className="text-sm text-gray-500">per {product.unit ?? 'unit'}</div>
                </div>
              )}
            </div>

            {/* Certifications */}
            {product.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {product.certifications.map(c => (
                  <span key={c} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">{c}</span>
                ))}
              </div>
            )}

            {/* Supplier */}
            <Link to={`/orgs/${product.organizationId}`} className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors">
              {product.organization.logoUrl ? (
                <img src={product.organization.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600">{product.organization.name[0]}</div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{product.organization.name}</span>
                  {product.organization.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                </div>
                <span className="text-xs text-gray-500">{product.organization.type} · {product.organization.country ?? 'Global'}</span>
              </div>
            </Link>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
              {(['overview', 'specs', 'supply'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === t
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t === 'supply' ? `Supply (${batches.length})` : t}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {activeTab === 'overview' && <OverviewTab product={product} />}
              {activeTab === 'specs' && <SpecsTab product={product} />}
              {activeTab === 'supply' && <SupplyTab batches={batches} unit={product.unit} />}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Request Form */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {/* Request Supply Card */}
          {!isOwnProduct && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Request Supply</h3>
              <p className="text-xs text-gray-500 mb-4">Submit a sourcing request to this supplier</p>

              {showRequest ? (
                <form onSubmit={handleRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={reqForm.quantity}
                      onChange={e => setReqForm(f => ({ ...f, quantity: e.target.value }))}
                      placeholder={product.moq ? `Min: ${Number(product.moq).toLocaleString()}` : 'Enter quantity'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Unit</label>
                    <input
                      type="text"
                      value={reqForm.unit}
                      onChange={e => setReqForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder={product.unit ?? 'kg'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Message</label>
                    <textarea
                      value={reqForm.message}
                      onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Additional requirements, specs, etc."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowRequest(false)} className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {submitting ? 'Sending...' : 'Submit'}
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowRequest(true)} className="w-full bg-blue-600 text-white font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors">
                  Request Supply →
                </button>
              )}

              {/* Quick Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                {product.moq && (
                  <div className="flex justify-between"><span className="text-gray-500">Min. Order</span><span className="font-medium text-gray-900 dark:text-white">{Number(product.moq).toLocaleString()} {product.unit ?? 'units'}</span></div>
                )}
                {product.leadTimeDays && (
                  <div className="flex justify-between"><span className="text-gray-500">Lead Time</span><span className="font-medium text-gray-900 dark:text-white">{product.leadTimeDays} days</span></div>
                )}
                {hasStock && (
                  <div className="flex justify-between"><span className="text-gray-500">Available Stock</span><span className="font-medium text-green-600">{totalStock.toLocaleString()} {product.unit ?? 'units'}</span></div>
                )}
                {product.deliveryTerms && (
                  <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium text-gray-900 dark:text-white">{product.deliveryTerms}</span></div>
                )}
              </div>
            </div>
          )}

          {/* If own product, show manage link */}
          {isOwnProduct && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">This is your product</p>
              <Link to={`/orgs/${product.organizationId}/sourcing`} className="text-sm text-blue-600 hover:underline">Manage in Dashboard →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all bg-white dark:bg-gray-800">
                <div className="h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    {p.price && <span className="text-xs font-semibold text-gray-900 dark:text-white">€{Number(p.price).toFixed(2)}/{p.unit ?? 'unit'}</span>}
                    <span className="text-xs text-gray-500">{p.organization.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Overview ──────────────────────────────────────

function OverviewTab({ product }: { product: Product }) {
  return (
    <div className="space-y-4">
      {product.description && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Description</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {product.highlights && product.highlights.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Highlights</h4>
          <ul className="space-y-1.5">
            {product.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mt-0.5">✓</span> {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.packagingOptions && product.packagingOptions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Packaging Options</h4>
          <div className="flex flex-wrap gap-2">
            {product.packagingOptions.map(p => (
              <span key={p} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Specs ─────────────────────────────────────────

function SpecsTab({ product }: { product: Product }) {
  const specs: [string, string | number | null][] = [
    ['Unit', product.unit],
    ['Currency', product.currency],
    ['MOQ', product.moq ? `${Number(product.moq).toLocaleString()} ${product.unit ?? 'units'}` : null],
    ['Lead Time', product.leadTimeDays ? `${product.leadTimeDays} days` : null],
    ['Shelf Life', product.shelfLifeMonths ? `${product.shelfLifeMonths} months` : null],
    ['Delivery Terms', product.deliveryTerms],
    ['Shipping Ports', product.shippingPorts],
    ['Origin', product.origin],
  ].filter(([, v]) => v != null) as [string, string][];

  const customSpecs = product.specifications ? Object.entries(product.specifications) : [];

  return (
    <div className="space-y-4">
      {(specs.length > 0 || customSpecs.length > 0) ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {specs.map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400 w-40 bg-gray-50 dark:bg-gray-900/30">{k}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white">{v}</td>
                </tr>
              ))}
              {customSpecs.map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400 w-40 bg-gray-50 dark:bg-gray-900/30">{k}</td>
                  <td className="px-4 py-2.5 text-gray-900 dark:text-white">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No specifications available</p>
      )}
    </div>
  );
}

// ─── Tab: Supply ────────────────────────────────────────

function SupplyTab({ batches, unit }: { batches: Batch[]; unit: string | null }) {
  if (batches.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No active supply batches. Submit a request to inquire about availability.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Batch</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Available</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Expiry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {batches.map(b => (
            <tr key={b.id}>
              <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-white">{b.batchCode}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{b.availableQuantity.toLocaleString()} {unit ?? ''}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  b.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  b.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{b.status ?? 'ACTIVE'}</span>
              </td>
              <td className="px-3 py-2 text-gray-500">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
