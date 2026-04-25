import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getSourcingRequest, updateSourcingStatus, type SourcingRequest } from '../services/marketplaceService';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'PENDING', label: 'Request Sent' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_FULFILMENT', label: 'In Fulfillment' },
  { key: 'DELIVERED_PENDING_CONFIRMATION', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  SUBMITTED: 0,
  UNDER_REVIEW: 1,
  APPROVED: 1,
  CONFIRMED: 2,
  IN_FULFILMENT: 3,
  DELIVERED: 4,
  DELIVERED_PENDING_CONFIRMATION: 4,
  COMPLETED: 5,
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  IN_FULFILMENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  DELIVERED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  DELIVERED_PENDING_CONFIRMATION: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  WITHDRAWN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [request, setRequest] = useState<SourcingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      const r = await getSourcingRequest(id);
      setRequest(r);
    } catch {
      toast.error('Request not found');
      navigate('/sourcing');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  useEffect(() => {
    if (!socket || !id) return;
    const handler = ({ requestId }: { requestId: string; status: string }) => {
      if (requestId === id) fetchRequest();
    };
    socket.on('sourcing:request_updated', handler);
    return () => { socket.off('sourcing:request_updated', handler); };
  }, [socket, id, fetchRequest]);

  const handleCancel = async () => {
    if (!request) return;
    setCancelling(true);
    try {
      await updateSourcingStatus(request.id, 'WITHDRAWN');
      toast.success('Request withdrawn');
      fetchRequest();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to cancel');
    } finally {
      setCancelling(false);
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
  const currentStep = STEP_INDEX[request.status] ?? 0;
  const isTerminal = ['REJECTED', 'WITHDRAWN', 'CLOSED'].includes(request.status);
  const hasOrder = ['CONFIRMED', 'IN_FULFILMENT', 'DELIVERED', 'DELIVERED_PENDING_CONFIRMATION', 'COMPLETED'].includes(request.status);
  const canCancel = isBuyer && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(request.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link to="/sourcing" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        My Requests
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{request.product.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Request #{request.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Progress bar */}
      {!isTerminal && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {idx > 0 && (
                    <div className={`absolute left-0 top-3 w-full h-0.5 -translate-x-1/2 ${done ? 'bg-blue-500' : 'bg-gray-200 dark:bg-neutral-700'}`} />
                  )}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    done ? 'bg-blue-500 text-white' :
                    active ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' :
                    'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500'
                  }`}>
                    {done ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : idx + 1}
                  </div>
                  <span className={`text-[9px] font-medium text-center leading-tight hidden sm:block ${
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal banner */}
      {request.status === 'REJECTED' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 mb-5 text-sm text-red-700 dark:text-red-300">
          This request was rejected.{request.supplierNotes ? ` Reason: ${request.supplierNotes}` : ''}
        </div>
      )}
      {request.status === 'WITHDRAWN' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 mb-5 text-sm text-orange-700 dark:text-orange-300">
          This request was withdrawn.
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          {/* Product card */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Product</h2>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{request.product.name}</p>
            {request.product.category && (
              <span className="mt-1.5 inline-block text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md">
                {request.product.category}
              </span>
            )}
            <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              {request.product.unit && <p>Unit: <span className="text-gray-700 dark:text-gray-200 font-medium">{request.product.unit}</span></p>}
              {request.product.origin && <p>Origin: <span className="text-gray-700 dark:text-gray-200 font-medium">{request.product.origin}</span></p>}
            </div>
          </div>

          {/* Request details card */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Request Details</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                <span className="font-semibold text-gray-900 dark:text-white">{Number(request.quantity)} {request.unit ?? request.product.unit ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <StatusBadge status={request.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Submitted</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Updated</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date(request.updatedAt).toLocaleDateString()}</span>
              </div>
              {request.message && (
                <div className="pt-2 border-t border-gray-100 dark:border-neutral-700">
                  <p className="text-gray-500 dark:text-gray-400 mb-0.5">Your message</p>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{request.message}"</p>
                </div>
              )}
              {request.supplierNotes && (
                <div className="pt-2 border-t border-gray-100 dark:border-neutral-700">
                  <p className="text-gray-500 dark:text-gray-400 mb-0.5">Supplier note</p>
                  <p className="text-gray-700 dark:text-gray-300">{request.supplierNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Supplier org card */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Supplier</h2>
            <div className="flex items-center gap-3">
              <Avatar name={request.organization.name} src={request.organization.logoUrl ?? undefined} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{request.organization.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {request.organization.type && (
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded-md">
                      {request.organization.type}
                    </span>
                  )}
                  {request.organization.isVerified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Actions</h2>
            <div className="space-y-2">
              {hasOrder && (
                <Link
                  to={`/orders/${request.id}`}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 transition-all"
                >
                  View Order
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-all"
                >
                  {cancelling ? 'Withdrawing...' : 'Withdraw Request'}
                </button>
              )}
              {isSupplier && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(request.status) && (
                <Link
                  to={`/orgs/${request.organizationId}/admin`}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-all"
                >
                  Review in Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {!hasOrder && !canCancel && !isTerminal && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                  Awaiting supplier action
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
