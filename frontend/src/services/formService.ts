import api from './api';

export interface FormField {
  id: string;
  templateId: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'TEXTAREA' | 'CHECKBOX';
  required: boolean;
  options: string | null;
  sortOrder: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  version: number;
  organizationId: string | null;
  organization?: { id: string; name: string; type: string } | null;
  fields: FormField[];
  _count: { entries: number };
  createdAt: string;
  updatedAt: string;
}

export interface FormValue {
  id: string;
  entryId: string;
  fieldName: string;
  value: string | null;
}

export interface FormEntry {
  id: string;
  templateId: string;
  template: { id: string; name: string };
  userId: string;
  user: { id: string; name: string };
  organizationId: string | null;
  organization?: { id: string; name: string } | null;
  status: string;
  visibility: string;
  values: FormValue[];
  createdAt: string;
  updatedAt: string;
}

// Templates
export const getFormTemplates = async (orgId?: string): Promise<FormTemplate[]> => {
  const params = orgId ? `?orgId=${orgId}` : '';
  const res = await api.get(`/forms/templates${params}`);
  return res.data.templates;
};

export const getFormTemplate = async (id: string): Promise<FormTemplate> => {
  const res = await api.get(`/forms/templates/${id}`);
  return res.data.template;
};

export const createFormTemplate = async (data: {
  name: string;
  description?: string;
  fields?: { label: string; type?: string; required?: boolean; options?: string; sortOrder?: number }[];
}): Promise<FormTemplate> => {
  const res = await api.post('/forms/templates', data);
  return res.data.template;
};

export const updateFormTemplate = async (id: string, data: {
  name?: string;
  description?: string;
  fields?: { label: string; type?: string; required?: boolean; options?: string; sortOrder?: number }[];
}): Promise<FormTemplate> => {
  const res = await api.put(`/forms/templates/${id}`, data);
  return res.data.template;
};

export const deleteFormTemplate = async (id: string): Promise<void> => {
  await api.delete(`/forms/templates/${id}`);
};

// Entries
export const getFormEntries = async (templateId?: string, orgId?: string): Promise<FormEntry[]> => {
  const params = new URLSearchParams();
  if (templateId) params.set('templateId', templateId);
  if (orgId) params.set('orgId', orgId);
  const q = params.toString();
  const res = await api.get(`/forms/entries${q ? `?${q}` : ''}`);
  return res.data.entries;
};

export const createFormEntry = async (data: {
  templateId: string;
  values?: { fieldName: string; value?: string }[];
  status?: string;
  visibility?: string;
}): Promise<FormEntry> => {
  const res = await api.post('/forms/entries', data);
  return res.data.entry;
};

export const updateFormEntry = async (id: string, data: {
  values?: { fieldName: string; value?: string }[];
  status?: string;
  visibility?: string;
}): Promise<FormEntry> => {
  const res = await api.put(`/forms/entries/${id}`, data);
  return res.data.entry;
};

export const deleteFormEntry = async (id: string): Promise<void> => {
  await api.delete(`/forms/entries/${id}`);
};
