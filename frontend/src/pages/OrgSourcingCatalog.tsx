import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrgProducts, type Product } from '../services/marketplaceService';
import { getOrganization, type Organization } from '../services/orgService';
import toast from 'react-hot-toast';

// ─── Category filter ────────────────────────────────────

const ALL_CATEGORIES = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Grains', 'Meat', 'Seafood', 'Spices', 'Oils', 'Beverages', 'Nuts', 'Organic', 'Other'];

function getCategoryFromProduct(p: Product): string {
  const cat = (p.category ?? '').toLowerCase();
  const match = ALL_CATEGORIES.find(c => c !== 'All' && cat.includes(c.toLowerCase()));
  return match ?? 'Other';
}

// ─── Main Component ─────────────────────────────────────

export default function OrgSourcingCatalog() {
  const { id: orgId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'name' | 'price-asc' | 'price-desc' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [o, p] = await Promise.all([getOrganization(orgId), getOrgProducts(orgId)]);
      setOrg(o);
      setProducts(p.filter(pr => pr.isPublished));
    } catch {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Categories present in products
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(getCategoryFromProduct));
    return ['All', ...ALL_CATEGORIES.filter(c => c !== 'All' && cats.has(c))];
  }, [products]);

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (category !== 'All') {
      filtered = filtered.filter(p => getCategoryFromProduct(p) === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.origin ?? '').toLowerCase().includes(q)
      );
    }
    const sorted = [...filtered];
    switch (sort) {
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price-asc': sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break;
      case 'price-desc': sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break;
      case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return sorted;
  }, [products, category, search, sort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Org Header */}
      {org && (
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/orgs/${orgId}`} className="text-sm text-blue-600 hover:underline">← {org.name}</Link>
          <div className="flex items-center gap-2">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">{org.name[0]}</div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {org.name} Catalog
                {org.isVerified && <span className="text-blue-500" title="Verified">✓</span>}
              </h1>
              <p className="text-xs text-gray-500">{products.length} products available</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Main Area */}
        <div className="flex-1 min-w-0">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {availableCategories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search / Sort / View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`px-2.5 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`px-2.5 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6" width="14" height="3" rx="1"/><rect x="1" y="11" width="14" height="3" rx="1"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-sm">No products found</p>
              {search && <button onClick={() => setSearch('')} className="mt-2 text-sm text-blue-600 hover:underline">Clear search</button>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(p => <ProductListItem key={p.id} product={p} />)}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          {/* CTA */}
          {org && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
              <h3 className="font-bold text-lg mb-2">Need Custom Supply?</h3>
              <p className="text-sm text-blue-100 mb-4">Contact {org.name} for bulk orders, custom specs, or long-term partnerships.</p>
              <Link to={`/orgs/${orgId}`} className="block w-full text-center bg-white text-blue-700 font-medium text-sm rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors">
                Contact Supplier
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Facts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Products</span><span className="font-medium text-gray-900 dark:text-white">{products.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Categories</span><span className="font-medium text-gray-900 dark:text-white">{availableCategories.length - 1}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Certified</span><span className="font-medium text-gray-900 dark:text-white">{products.filter(p => p.isCertified).length}</span></div>
            </div>
          </div>

          {/* Common Certifications */}
          {(() => {
            const certs = new Set(products.flatMap(p => p.certifications));
            if (certs.size === 0) return null;
            return (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Certifications</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[...certs].map(c => (
                    <span key={c} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card (Grid) ────────────────────────────────

function ProductCard({ product: p }: { product: Product }) {
  const hasStock = (p._count?.batches ?? 0) > 0;

  return (
    <Link to={`/products/${p.id}`} className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all bg-white dark:bg-gray-800">
      {/* Image */}
      <div className="relative h-44 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {p.images && p.images.length > 0 ? (
          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
            <span className="text-4xl">📦</span>
          </div>
        )}
        {/* Availability badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          hasStock ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
        }`}>
          {hasStock ? 'In Stock' : 'On Request'}
        </div>
        {p.isCertified && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Certified</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{p.name}</h3>
            {p.category && <span className="text-xs text-gray-500 dark:text-gray-400">{p.category}</span>}
          </div>
          {p.price && (
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-gray-900 dark:text-white">€{Number(p.price).toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">/{p.unit ?? 'unit'}</div>
            </div>
          )}
        </div>

        {p.origin && (
          <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>📍</span> {p.origin}
          </div>
        )}

        {p.certifications.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.certifications.slice(0, 3).map(c => (
              <span key={c} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">{c}</span>
            ))}
            {p.certifications.length > 3 && (
              <span className="text-[10px] text-gray-400">+{p.certifications.length - 3}</span>
            )}
          </div>
        )}

        {p.moq && (
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            MOQ: {Number(p.moq).toLocaleString()} {p.unit ?? 'units'}
          </div>
        )}

        <div className="mt-3 w-full bg-blue-600 text-white text-center py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </div>
      </div>
    </Link>
  );
}

// ─── Product List Item ──────────────────────────────────

function ProductListItem({ product: p }: { product: Product }) {
  const hasStock = (p._count?.batches ?? 0) > 0;

  return (
    <Link to={`/products/${p.id}`} className="flex gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all bg-white dark:bg-gray-800 group">
      {/* Thumb */}
      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
        {p.images && p.images.length > 0 ? (
          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {p.category && <span className="text-xs text-gray-500">{p.category}</span>}
              {p.origin && <span className="text-xs text-gray-400">📍 {p.origin}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hasStock ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {hasStock ? 'In Stock' : 'On Request'}
            </span>
            {p.price && <span className="text-sm font-bold text-gray-900 dark:text-white">€{Number(p.price).toFixed(2)}/{p.unit ?? 'unit'}</span>}
          </div>
        </div>

        {p.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.description}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          {p.certifications.slice(0, 4).map(c => (
            <span key={c} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">{c}</span>
          ))}
          {p.isCertified && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Certified</span>}
        </div>
      </div>
    </Link>
  );
}
