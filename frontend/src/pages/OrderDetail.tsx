import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  getSourcingRequest, confirmDelivery, type SourcingRequest,
} from '../services/marketplaceService';
import { createLoad, updateLoadStatus } from '../services/orgService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  IN_FULFILMENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  DELIVERED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  DELIVERED_PENDING_CONFIRMATION: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  LOADING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  PLANNING: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  READY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  RECALLED: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200',
};

const LOAD_STEPS = ['PLANNING', 'READY', 'IN_TRANSIT', 'DELIVERED'];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

type Load = NonNullable<NonNullable<SourcingRequest['lot']>['loads']>[number];

function LoadCard({
  load, isSupplier, orgId, onRefresh,
}: {
  load: Load;
  isSupplier: boolean;
  orgId: string;
  onRefresh: () => void;
}) {
  const [status, setStatus] = useState(load.status);
  const [updating, setUpdating] = useState(false);
  const stepIdx = LOAD_STEPS.indexOf(load.status);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateLoadStatus(orgId, load.id, status);
      toast.success('Load status updated');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-200">{load.loadCode}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{load.destination}</p>
        </div>
        <StatusBadge status={load.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>Qty: <span className="font-semibold text-gray-700 dark:text-gray-200">{Number(load.quantity)}</span></span>
        {load.eta && <span>ETA: <span className="text-gray-700 dark:text-gray-200">{new Date(load.eta).toLocaleDateString()}</span></span>}
      </div>

      {/* Mini progress dots */}
      <div className="flex items-center gap-2 mb-3">
        {LOAD_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-all ${
              i <= stepIdx ? 'bg-blue-500' : 'bg-gray-200 dark:bg-neutral-600'
            }`} />
            {i < LOAD_STEPS.length - 1 && (
              <div className={`h-0.5 w-5 transition-all ${i < stepIdx ? 'bg-blue-500' : 'bg-gray-200 dark:bg-neutral-600'}`} />
            )}
          </div>
        ))}
        <span className="text-[10px] text-gray-400 ml-1">{load.status.replace(/_/g, ' ')}</span>
      </div>

      {load.notes && <p className="text-[10px] text-gray-400 mb-3 italic">{load.notes}</p>}

      {isSupplier && load.status !== 'DELIVERED' && (
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/30"
          >
            {LOAD_STEPS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button
            onClick={handleUpdate}
            disabled={updating || status === load.status}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {updating ? '...' : 'Update'}
          </button>
        </div>
      )}
    </div>
  );
}

function AddShipmentModal({
  lotId, orgId, onClose, onDone,
}: {
  lotId: string;
  orgId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({ destination: '', quantity: '', eta: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.destination || !form.quantity) {
      toast.error('Destination and quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      await createLoad(orgId, {
        lotId,
        destination: form.destination,
        quantity: parseFloat(form.quantity),
        eta: form.eta || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Shipment added');
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to add shipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Shipment</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Destination *"
            value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="number"
            placeholder="Quantity *"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            min={1}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
          />
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 block">ETA (optional)</label>
            <input
              type="date"
              value={form.eta}
              onChange={e => setForm(f => ({ ...f, eta: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Adding...' : 'Add Shipment'}
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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [request, setRequest] = useState<SourcingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showAddShipment, setShowAddShipment] = useState(false);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      const r = await getSourcingRequest(id);
      // Redirect if no lot yet
      if (['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(r.status)) {
        navigate(`/requests/${id}`, { replace: true });
        return;
      }
      setRequest(r);
    } catch {
      toast.error('Order not found');
      navigate('/sourcing');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  useEffect(() => {
    if (!socket || !id) return;
    const handler = ({ requestId }: { requestId: string }) => {
      if (requestId === id) fetchRequest();
    };
    socket.on('sourcing:request_updated', handler);
    return () => { socket.off('sourcing:request_updated', handler); };
  }, [socket, id, fetchRequest]);

  const handleConfirmDelivery = async () => {
    if (!request) return;
    setConfirming(true);
    try {
      const updated = await confirmDelivery(request.id);
      setRequest(updated);
      toast.success('Delivery confirmed! Order completed.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) return null;

  const isBuyer = request.requesterId === user?.id;
  const isSupplier = user?.organizationId === request.organizationId;
  const lot = request.lot;
  const loads = lot?.loads ?? [];
  const orgId = request.organizationId;
  const canAddShipment = isSupplier && lot && !['DELIVERED', 'WITHDRAWN'].includes(lot.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <Link to={`/requests/${request.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Request Detail
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Order {lot ? lot.lotCode : request.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{request.product.name}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Delivery confirmation banner */}
      {isBuyer && request.status === 'DELIVERED_PENDING_CONFIRMATION' && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-violet-900 dark:text-violet-200 text-sm">All shipments delivered</p>
              <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">Please confirm receipt to complete the order.</p>
            </div>
            <button
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all flex-shrink-0"
            >
              {confirming ? 'Confirming...' : 'Confirm Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Completed banner */}
      {request.status === 'COMPLETED' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 mb-5 flex items-center gap-2.5">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            Order completed on {new Date(request.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Order overview */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm mb-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Order Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Product</p>
            <p className="font-semibold text-gray-900 dark:text-white">{request.product.name}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Total Qty</p>
            <p className="font-semibold text-gray-900 dark:text-white">{lot ? Number(lot.totalQuantity) : Number(request.quantity)} {request.unit ?? ''}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Buyer</p>
            <div className="flex items-center gap-1.5">
              <Avatar name={request.requester.name} src={request.requester.avatarUrl ?? undefined} size="xs" />
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{request.requester.name}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 mb-0.5">Confirmed</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">{new Date(request.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Allocations */}
      {request.allocations.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm mb-5">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Batch Allocations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-700">
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">Batch Code</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">Production Date</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-medium">Expiry Date</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Allocated Qty</th>
                </tr>
              </thead>
              <tbody>
                {request.allocations.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 dark:border-neutral-700/50">
                    <td className="py-2 pr-4 font-mono font-semibold text-gray-700 dark:text-gray-200">{a.batch?.batchCode ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                      {a.batch?.productionDate ? new Date(a.batch.productionDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                      {a.batch?.expiryDate ? new Date(a.batch.expiryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-700 dark:text-gray-200">{Number(a.allocatedQuantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipments */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Shipments ({loads.length})
          </h2>
          {canAddShipment && (
            <button
              onClick={() => setShowAddShipment(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Shipment
            </button>
          )}
        </div>

        {loads.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <p className="text-sm">{isSupplier ? 'No shipments yet — add the first one above.' : 'Awaiting supplier to add shipments.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loads.map(load => (
              <LoadCard
                key={load.id}
                load={load}
                isSupplier={isSupplier}
                orgId={orgId}
                onRefresh={fetchRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Shipment Modal */}
      {showAddShipment && lot && (
        <AddShipmentModal
          lotId={lot.id}
          orgId={orgId}
          onClose={() => setShowAddShipment(false)}
          onDone={() => { setShowAddShipment(false); fetchRequest(); }}
        />
      )}
    </div>
  );
}
