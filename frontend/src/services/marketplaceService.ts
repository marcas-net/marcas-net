import api from './api';

// ─── Types ──────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  type: string;
  filename: string;
  size: number;
  order: number;
  productId: string;
  createdAt: string;
}

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
  shelfLifeMonths: number | null;
  certifications: string[];
  specifications: Record<string, string> | null;
  highlights: string[];
  deliveryTerms: string | null;
  shippingPorts: string | null;
  packagingOptions: string[];
  organizationId: string;
  organization: { id: string; name: string; type: string; country?: string | null; logoUrl?: string | null; isVerified?: boolean };
  images?: ProductImage[];
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
  batch?: { id: string; batchCode: string; productionDate?: string | null; expiryDate?: string | null };
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
  product: { id: string; name: string; unit?: string | null; category?: string | null; origin?: string | null };
  requesterId: string;
  requester: { id: string; name: string; avatarUrl?: string | null };
  organizationId: string;
  organization: { id: string; name: string; type?: string; logoUrl?: string | null; isVerified?: boolean };
  buyerOrgId: string | null;
  quantity: number;
  unit: string | null;
  message: string | null;
  status: string;
  supplierNotes: string | null;
  allocations: BatchAllocation[];
  lot?: {
    id: string;
    lotCode: string;
    status: string;
    totalQuantity: number;
    notes: string | null;
    createdAt: string;
    loads?: {
      id: string;
      loadCode: string;
      destination: string;
      quantity: number;
      status: string;
      eta: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
  } | null;
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
  shelfLifeMonths?: number;
  certifications?: string[];
  specifications?: Record<string, string>;
  highlights?: string[];
  deliveryTerms?: string;
  shippingPorts?: string;
  packagingOptions?: string[];
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

export const getSourcingRequest = async (requestId: string): Promise<SourcingRequest> => {
  const res = await api.get(`/marketplace/sourcing/${requestId}`);
  return res.data.request;
};

export const confirmDelivery = async (requestId: string): Promise<SourcingRequest> => {
  const res = await api.post(`/marketplace/sourcing/${requestId}/confirm-delivery`);
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

// ─── Product Images ─────────────────────────────────────

export const uploadProductImages = async (productId: string, files: File[]): Promise<ProductImage[]> => {
  const formData = new FormData();
  files.forEach(f => formData.append('images', f));
  const res = await api.post(`/marketplace/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.images;
};

export const deleteProductImage = async (productId: string, imageId: string): Promise<void> => {
  await api.delete(`/marketplace/products/${productId}/images/${imageId}`);
};

// ─── Allocations ────────────────────────────────────────

export interface Allocation {
  id: string;
  batchId: string;
  requestId: string;
  allocatedQuantity: number;
  batch: { id: string; batchCode: string; product: { id: string; name: string } };
  request: { id: string; quantity: number; status: string; requester: { id: string; name: string } };
  createdAt: string;
}

export const getOrgAllocations = async (orgId: string): Promise<Allocation[]> => {
  const res = await api.get(`/marketplace/allocations/org/${orgId}`);
  return res.data.allocations;
};

// ─── Activity ───────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: 'request' | 'batch' | 'recall';
  title: string;
  detail: string;
  date: string;
}

export const getOrgSourcingActivity = async (orgId: string): Promise<ActivityItem[]> => {
  const res = await api.get(`/marketplace/activity/org/${orgId}`);
  return res.data.activity;
};
