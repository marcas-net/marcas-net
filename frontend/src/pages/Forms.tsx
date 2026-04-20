import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFormTemplates, createFormTemplate, deleteFormTemplate,
  getFormEntries, createFormEntry, deleteFormEntry,
  type FormTemplate, type FormEntry, type FormField,
} from '../services/formService';
import toast from 'react-hot-toast';

type Tab = 'templates' | 'entries';

export default function Forms() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showFill, setShowFill] = useState<FormTemplate | null>(null);
  const [viewEntry, setViewEntry] = useState<FormEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        getFormTemplates(user?.organizationId ?? undefined),
        getFormEntries(undefined, user?.organizationId ?? undefined),
      ]);
      setTemplates(t);
      setEntries(e);
    } catch {
      toast.error('Failed to load forms');
    }
    setLoading(false);
  }, [user?.organizationId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (type: 'template' | 'entry', id: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'template') await deleteFormTemplate(id);
      else await deleteFormEntry(id);
      toast.success(`${type === 'template' ? 'Template' : 'Entry'} deleted`);
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Forms</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create form templates and collect structured data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([{ key: 'templates' as Tab, label: 'Templates', count: templates.length }, { key: 'entries' as Tab, label: 'My Entries', count: entries.length }]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.label} <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-3">📋</span>
              <p className="text-sm">No form templates yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-blue-600 hover:underline">Create your first template</button>
            </div>
          ) : templates.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{t.name}</h3>
                  {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>}
                </div>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full shrink-0 ml-2">v{t.version}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>{t.fields.length} fields</span>
                <span>{t._count.entries} entries</span>
                {t.organization && <span className="text-blue-600">{t.organization.name}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowFill(t)} className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                  Fill Out
                </button>
                <button onClick={() => handleDelete('template', t.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-lg border border-gray-200 dark:border-gray-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'entries' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-3">📝</span>
              <p className="text-sm">No form entries yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Form</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Submitted By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {entries.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.template.name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{e.user.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          e.status === 'submitted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          e.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-600'
                        }`}>{e.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setViewEntry(e)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs">View</button>
                          <button onClick={() => handleDelete('entry', e.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {showFill && <FillFormModal template={showFill} onClose={() => setShowFill(null)} onSubmitted={load} />}
      {viewEntry && <ViewEntryModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
    </div>
  );
}

// ─── Create Template Modal ──────────────────────────────

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<{ label: string; type: string; required: boolean; options: string }[]>([
    { label: '', type: 'TEXT', required: false, options: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const addField = () => setFields(f => [...f, { label: '', type: 'TEXT', required: false, options: '' }]);
  const removeField = (i: number) => setFields(f => f.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: string, val: string | boolean) => {
    setFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name required'); return; }
    const validFields = fields.filter(f => f.label.trim());
    if (validFields.length === 0) { toast.error('At least one field required'); return; }
    setSaving(true);
    try {
      await createFormTemplate({
        name: name.trim(),
        description: description || undefined,
        fields: validFields.map((f, i) => ({
          label: f.label.trim(),
          type: f.type,
          required: f.required,
          options: f.type === 'SELECT' && f.options ? f.options : undefined,
          sortOrder: i,
        })),
      });
      toast.success('Template created');
      onCreated();
      onClose();
    } catch { toast.error('Failed to create template'); }
    setSaving(false);
  };

  return (
    <Modal title="Create Form Template" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fields</label>
            <button type="button" onClick={addField} className="text-xs text-blue-600 hover:underline">+ Add Field</button>
          </div>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <div className="flex-1 space-y-2">
                  <input placeholder="Field label" value={f.label} onChange={e => updateField(i, 'label', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <div className="flex items-center gap-2">
                    <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="TEXT">Text</option>
                      <option value="TEXTAREA">Long Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="DATE">Date</option>
                      <option value="SELECT">Dropdown</option>
                      <option value="CHECKBOX">Checkbox</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} className="rounded" />
                      Required
                    </label>
                  </div>
                  {f.type === 'SELECT' && (
                    <input placeholder="Options (comma-separated)" value={f.options} onChange={e => updateField(i, 'options', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  )}
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => removeField(i)} className="text-red-400 hover:text-red-600 text-sm mt-1">&times;</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Fill Form Modal ────────────────────────────────────

function FillFormModal({ template, onClose, onSubmitted }: { template: FormTemplate; onClose: () => void; onSubmitted: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setVal = (field: string, val: string) => setValues(v => ({ ...v, [field]: val }));

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'submitted') => {
    e.preventDefault();
    const vs = Object.entries(values).filter(([, v]) => v).map(([fieldName, value]) => ({ fieldName, value }));
    setSaving(true);
    try {
      await createFormEntry({ templateId: template.id, values: vs, status });
      toast.success(status === 'submitted' ? 'Form submitted' : 'Draft saved');
      onSubmitted();
      onClose();
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  return (
    <Modal title={`Fill: ${template.name}`} onClose={onClose}>
      {template.description && <p className="text-xs text-gray-500 mb-4">{template.description}</p>}
      <form onSubmit={e => handleSubmit(e, 'submitted')} className="space-y-3">
        {template.fields.map(f => (
          <FieldInput key={f.id} field={f} value={values[f.label] ?? ''} onChange={v => setVal(f.label, v)} />
        ))}
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button type="button" onClick={e => handleSubmit(e as unknown as React.FormEvent, 'draft')} disabled={saving} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            Save Draft
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── View Entry Modal ───────────────────────────────────

function ViewEntryModal({ entry, onClose }: { entry: FormEntry; onClose: () => void }) {
  return (
    <Modal title={entry.template.name} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span>By: {entry.user.name}</span>
          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
            entry.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>{entry.status}</span>
          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
        {entry.values.length === 0 ? (
          <p className="text-sm text-gray-400">No values recorded</p>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {entry.values.map(v => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 w-1/3">{v.fieldName}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{v.value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Close</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Shared Components ──────────────────────────────────

function FieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
  const label = `${field.label}${field.required ? ' *' : ''}`;
  const cls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";

  switch (field.type) {
    case 'TEXTAREA':
      return (<div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label><textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls} /></div>);
    case 'NUMBER':
      return (<div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label><input type="number" value={value} onChange={e => onChange(e.target.value)} className={cls} /></div>);
    case 'DATE':
      return (<div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label><input type="date" value={value} onChange={e => onChange(e.target.value)} className={cls} /></div>);
    case 'SELECT': {
      const options = (field.options ?? '').split(',').map(o => o.trim()).filter(Boolean);
      return (<div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className={cls}><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
    }
    case 'CHECKBOX':
      return (<label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={value === 'true'} onChange={e => onChange(String(e.target.checked))} className="rounded" />{field.label}{field.required && <span className="text-red-500">*</span>}</label>);
    default:
      return (<div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} className={cls} /></div>);
  }
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
