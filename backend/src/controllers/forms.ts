import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

// ─── Templates ──────────────────────────────────────────

export const getFormTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId } = req.query;
    const where: Record<string, unknown> = {};
    if (orgId) where.organizationId = orgId as string;

    const templates = await prisma.formTemplate.findMany({
      where,
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ templates });
  } catch (error) {
    console.error('Get form templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.formTemplate.findUnique({
      where: { id: id as string },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { entries: true } },
      },
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (error) {
    console.error('Get form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, fields } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const orgId = req.user.organizationId as string | undefined;

    const template = await prisma.formTemplate.create({
      data: {
        name,
        description: description || null,
        organizationId: orgId || null,
        fields: fields?.length
          ? {
              create: (fields as { label: string; type?: string; required?: boolean; options?: string; sortOrder?: number }[]).map(
                (f, i) => ({
                  label: f.label,
                  type: (f.type as 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'TEXTAREA' | 'CHECKBOX') || 'TEXT',
                  required: f.required ?? false,
                  options: f.options || null,
                  sortOrder: f.sortOrder ?? i,
                })
              ),
            }
          : undefined,
      },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { entries: true } },
      },
    });
    res.status(201).json({ template });
  } catch (error) {
    console.error('Create form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, fields } = req.body;

    const existing = await prisma.formTemplate.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    // Only org members or admins can update
    if (existing.organizationId && existing.organizationId !== req.user.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const template = await prisma.formTemplate.update({
      where: { id: id as string },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        version: { increment: 1 },
        ...(fields
          ? {
              fields: {
                deleteMany: {},
                create: (fields as { label: string; type?: string; required?: boolean; options?: string; sortOrder?: number }[]).map(
                  (f, i) => ({
                    label: f.label,
                    type: (f.type as 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'TEXTAREA' | 'CHECKBOX') || 'TEXT',
                    required: f.required ?? false,
                    options: f.options || null,
                    sortOrder: f.sortOrder ?? i,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        fields: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { entries: true } },
      },
    });
    res.json({ template });
  } catch (error) {
    console.error('Update form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.formTemplate.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    if (existing.organizationId && existing.organizationId !== req.user.organizationId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.formTemplate.delete({ where: { id: id as string } });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Entries ────────────────────────────────────────────

export const getFormEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, orgId } = req.query;
    const where: Record<string, unknown> = {};
    if (templateId) where.templateId = templateId as string;
    if (orgId) where.organizationId = orgId as string;

    // Non-admins can only see their own entries or org entries
    if (req.user.role !== 'ADMIN') {
      where.OR = [
        { userId: req.user.id },
        { organizationId: req.user.organizationId },
        { visibility: 'public' },
      ];
    }

    const entries = await prisma.formEntry.findMany({
      where,
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        values: true,
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ entries });
  } catch (error) {
    console.error('Get form entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFormEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, values, status, visibility } = req.body;
    if (!templateId) return res.status(400).json({ error: 'Template ID is required' });

    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: { fields: true },
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Validate required fields if submitting
    if (status === 'submitted' && template.fields.length > 0) {
      const requiredFields = template.fields.filter(f => f.required).map(f => f.label);
      const providedFields = (values as { fieldName: string; value?: string }[] | undefined)?.map(v => v.fieldName) ?? [];
      const missing = requiredFields.filter(f => !providedFields.includes(f));
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }
    }

    const entry = await prisma.formEntry.create({
      data: {
        templateId,
        userId: req.user.id,
        organizationId: req.user.organizationId || null,
        status: status || 'draft',
        visibility: visibility || 'private',
        values: values?.length
          ? { create: (values as { fieldName: string; value?: string }[]).map(v => ({ fieldName: v.fieldName, value: v.value || null })) }
          : undefined,
      },
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        values: true,
      },
    });
    res.status(201).json({ entry });
  } catch (error) {
    console.error('Create form entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFormEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { values, status, visibility } = req.body;

    const existing = await prisma.formEntry.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const entry = await prisma.formEntry.update({
      where: { id: id as string },
      data: {
        status: status || undefined,
        visibility: visibility || undefined,
        ...(values
          ? {
              values: {
                deleteMany: {},
                create: (values as { fieldName: string; value?: string }[]).map(v => ({
                  fieldName: v.fieldName,
                  value: v.value || null,
                })),
              },
            }
          : {}),
      },
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        values: true,
      },
    });
    res.json({ entry });
  } catch (error) {
    console.error('Update form entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFormEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.formEntry.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.formEntry.delete({ where: { id: id as string } });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete form entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
