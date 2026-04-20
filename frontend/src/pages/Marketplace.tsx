import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, type Product } from '../services/marketplaceService';
import toast from 'react-hot-toast';

const ALL_CATEGORIES = [
  'All', 'Fruits', 'Vegetables', 'Dairy', 'Grains', 'Meat', 'Seafood',
  'Spices', 'Oils', 'Beverages', 'Nuts', 'Organic', 'Other',
];

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'newest' | 'name' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [certifiedOnly, setCertifiedOnly] = useState(false);

  useEffect(() => {
    getProducts()
      .then(p => setProducts(p.filter(pr => pr.isPublished)))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => matchCategory(p.category)));
    return ['All', ...ALL_CATEGORIES.filter(c => c !== 'All' && cats.has(c))];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'All') list = list.filter(p => matchCategory(p.category) === category);
    if (certifiedOnly) list = list.filter(p => p.isCertified);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.origin ?? '').toLowerCase().includes(q) ||
        p.organization.name.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sort) {
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price-asc': sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break;
      case 'price-desc': sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break;
      default: sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [products, category, certifiedOnly, search, sort]);

  const orgCount = useMemo(() => new Set(products.map(p => p.organizationId)).size, [products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold">Marketplace</h1>
        <p className="text-blue-100 mt-1 text-sm sm:text-base">Browse verified products from trusted suppliers across the network</p>
        <div className="flex gap-4 mt-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">{products.length} Products</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{orgCount} Suppliers</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{products.filter(p => p.isCertified).length} Certified</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === c
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Search + Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products, suppliers, origins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={certifiedOnly} onChange={e => setCertifiedOnly(e.target.checked)} className="rounded text-blue-600" />
            Certified
          </label>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-2.5 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`px-2.5 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6" width="14" height="3" rx="1"/><rect x="1" y="11" width="14" height="3" rx="1"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {filtered.length} of {products.length} products
        {category !== 'All' && <> in <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span></>}
        {search && <> matching "<span className="font-medium text-gray-700 dark:text-gray-300">{search}</span>"</>}
      </p>

      {/* Product Grid / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-5xl mb-3">🔍</span>
          <p className="text-sm font-medium">No products match your filters</p>
          <button onClick={() => { setSearch(''); setCategory('All'); setCertifiedOnly(false); }} className="mt-2 text-sm text-blue-600 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => <ProductListItem key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────

function ProductCard({ product: p }: { product: Product }) {
  const hasStock = (p._count?.batches ?? 0) > 0;

  return (
    <Link to={`/products/${p.id}`} className="group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all bg-white dark:bg-gray-800">
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {p.images && p.images.length > 0 ? (
          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-4xl">📦</div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${hasStock ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
          {hasStock ? 'In Stock' : 'On Request'}
        </div>
        {p.isCertified && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Certified</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{p.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          {p.category && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">{p.category}</span>}
          {p.origin && <span className="text-[10px] text-gray-400">📍 {p.origin}</span>}
        </div>
        <div className="flex items-center justify-between mt-2">
          {p.price ? (
            <span className="text-sm font-bold text-gray-900 dark:text-white">€{Number(p.price).toFixed(2)}<span className="text-xs font-normal text-gray-500">/{p.unit ?? 'unit'}</span></span>
          ) : (
            <span className="text-xs text-gray-400">Price on request</span>
          )}
        </div>
        {p.certifications && p.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {p.certifications.slice(0, 2).map(c => (
              <span key={c} className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">{c}</span>
            ))}
            {p.certifications.length > 2 && <span className="text-[9px] text-gray-400">+{p.certifications.length - 2}</span>}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {p.organization.logoUrl ? (
            <img src={p.organization.logoUrl} alt="" className="w-4 h-4 rounded object-cover" />
          ) : (
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[8px] font-bold">{p.organization.name[0]}</div>
          )}
          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{p.organization.name}</span>
          {p.organization.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Product List Item ──────────────────────────────────

function ProductListItem({ product: p }: { product: Product }) {
  const hasStock = (p._count?.batches ?? 0) > 0;

  return (
    <Link to={`/products/${p.id}`} className="flex gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 hover:shadow-md transition-all bg-white dark:bg-gray-800 group">
      <div className="w-28 h-28 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
        {p.images && p.images.length > 0 ? (
          <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 transition-colors">{p.name}</h3>
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
        {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
        <div className="flex items-center gap-2 mt-2">
          {p.certifications?.slice(0, 3).map(c => (
            <span key={c} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">{c}</span>
          ))}
          {p.isCertified && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Certified</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {p.organization.logoUrl ? (
            <img src={p.organization.logoUrl} alt="" className="w-4 h-4 rounded object-cover" />
          ) : (
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[8px] font-bold">{p.organization.name[0]}</div>
          )}
          <span className="text-[10px] text-gray-500 truncate">{p.organization.name}</span>
          {p.organization.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Helpers ────────────────────────────────────────────

function matchCategory(cat: string | null): string {
  if (!cat) return 'Other';
  const lower = cat.toLowerCase();
  const match = ALL_CATEGORIES.find(c => c !== 'All' && lower.includes(c.toLowerCase()));
  return match ?? 'Other';
}
