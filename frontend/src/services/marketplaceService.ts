import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isCertified: boolean;
  organizationId: string;
  organization: { id: string; name: string; type: string };
  _count: { batches: number };
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  organization: { id: string; name: string; type: string };
  createdAt: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get('/marketplace/products');
  return res.data.products;
};

export const getServices = async (): Promise<Service[]> => {
  const res = await api.get('/marketplace/services');
  return res.data.services;
};

export const createProduct = async (data: {
  name: string;
  description?: string;
  category?: string;
  isCertified?: boolean;
}): Promise<Product> => {
  const res = await api.post('/marketplace/products', data);
  return res.data.product;
};

export const createService = async (data: {
  name: string;
  description?: string;
}): Promise<Service> => {
  const res = await api.post('/marketplace/services', data);
  return res.data.service;
};
