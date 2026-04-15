import api from './api';

// ─── Types ──────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string | null;
  origin: string | null;
  moq: number | null;
  price: number | null;
  currency: string | null;
  leadTimeDays: number | null;
  isCertified: boolean;
  isPublished: boolean;
  organizationId: string;
  organization: { id: string; name: string; type: string; country?: string | null };
  batches?: BatchSummary[];
  _count: { batches: number; requests: number };
  createdAt: string;
  updatedAt: string;
}

export interface BatchSummary {
  id: string;
  batchCode: string;
  availableQuantity: number;
  totalQuantity?: number;
  status?: string;
  expiryDate: string | null;
  productionDate: string | null;
}

export interface Batch extends BatchSummary {
  productId: string;
  notes: string | null;
  _count?: { allocations: number };
  allocations?: BatchAllocation[];
  createdAt: string;
}

export interface BatchAllocation {
  id: string;
  batchId: string;
  requestId: string;
  allocatedQuantity: number;
  batch?: { id: string; batchCode: string };
  request?: {
    id: string;
    requester: { id: string; name: string };
    status: string;
  };
  createdAt: string;
}

export interface SourcingRequest {
  id: string;
  productId: string;
  product: { id: string; name: string; unit?: string | null; category?: string | null };
  requesterId: string;
  requester: { id: string; name: string; avatarUrl?: string | null };
  organizationId: string;
  organization: { id: string; name: string; type?: string };
  buyerOrgId: string | null;
  quantity: number;
  unit: string | null;
  message: string | null;
  status: string;
  supplierNotes: string | null;
  allocations: BatchAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface Recall {
  id: string;
  batchId: string;
  batch: {
    id: string;
    batchCode: string;
    product: { id: string; name: string };
    allocations?: BatchAllocation[];
  };
  organizationId: string;
  type: string;
  issue: string;
  instructions: string;
  createdBy: { id: string; name: string };
  resolvedAt: string | null;
  createdAt: string;
}

// ─── Products ───────────────────────────────────────────

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get('/marketplace/products');
  return res.data.products;
};

export const getProduct = async (id: string): Promise<Product> => {
  const res = await api.get(`/marketplace/products/${id}`);
  return res.data.product;
};

export const getOrgProducts = async (orgId: string): Promise<Product[]> => {
  const res = await api.get(`/marketplace/products/org/${orgId}`);
  return res.data.products;
};

export const createProduct = async (data: {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  origin?: string;
  moq?: number;
  price?: number;
  currency?: string;
  leadTimeDays?: number;
  isCertified?: boolean;
}): Promise<Product> => {
  const res = await api.post('/marketplace/products', data);
  return res.data.product;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
  const res = await api.put(`/marketplace/products/${id}`, data);
  return res.data.product;
};

// ─── Batches ────────────────────────────────────────────

export const createBatch = async (data: {
  productId: string;
  batchCode: string;
  totalQuantity: number;
  productionDate?: string;
  expiryDate?: string;
  notes?: string;
}): Promise<Batch> => {
  const res = await api.post('/marketplace/batches', data);
  return res.data.batch;
};

export const getProductBatches = async (productId: string): Promise<Batch[]> => {
  const res = await api.get(`/marketplace/batches/product/${productId}`);
  return res.data.batches;
};

// ─── Sourcing Requests ──────────────────────────────────

export const createSourcingRequest = async (data: {
  productId: string;
  quantity: number;
  unit?: string;
  message?: string;
}): Promise<SourcingRequest> => {
  const res = await api.post('/marketplace/sourcing', data);
  return res.data.request;
};

export const getMySourcingRequests = async (): Promise<SourcingRequest[]> => {
  const res = await api.get('/marketplace/sourcing/mine');
  return res.data.requests;
};

export const getOrgSourcingRequests = async (orgId: string): Promise<SourcingRequest[]> => {
  const res = await api.get(`/marketplace/sourcing/org/${orgId}`);
  return res.data.requests;
};

export const updateSourcingStatus = async (
  requestId: string,
  status: string,
  supplierNotes?: string
): Promise<SourcingRequest> => {
  const res = await api.put(`/marketplace/sourcing/${requestId}/status`, { status, supplierNotes });
  return res.data.request;
};

// ─── Recalls ────────────────────────────────────────────

export const createRecall = async (data: {
  batchId: string;
  type?: 'WITHDRAWAL' | 'RECALL';
  issue: string;
  instructions: string;
}): Promise<{ recall: Recall; affectedOrganizations: number; affectedQuantity: number }> => {
  const res = await api.post('/marketplace/recalls', data);
  return res.data;
};

export const getOrgRecalls = async (orgId: string): Promise<Recall[]> => {
  const res = await api.get(`/marketplace/recalls/org/${orgId}`);
  return res.data.recalls;
};
