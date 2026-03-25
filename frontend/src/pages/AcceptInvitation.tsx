import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getInvitation, acceptInvitation } from '../services/invitationService';
import type { InvitationInfo } from '../services/invitationService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { orgTypeVariant, roleVariant } from '../styles/design-system';

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getInvitation(token)
      .then(setInvitation)
      .catch((err) => setError(err.response?.data?.error || 'Invalid or expired invitation'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const result = await acceptInvitation(token);
      toast.success(result.message);
      navigate(`/orgs/${result.organizationId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 px-4">
        <Helmet><title>Invalid Invitation | MarcasNet</title></Helmet>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid Invitation</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error || 'This invitation link is not valid.'}</p>
          <Link to="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 px-4">
      <Helmet><title>Accept Invitation | MarcasNet</title></Helmet>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">You're Invited!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">You've been invited to join an organization</p>
        </div>

        <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Organization</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{invitation.organization.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Type</span>
            <Badge variant={orgTypeVariant[invitation.organization.type] ?? 'blue'}>{invitation.organization.type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Your Role</span>
            <Badge variant={roleVariant[invitation.role] ?? 'blue'}>{invitation.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Invited Email</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{invitation.email}</span>
          </div>
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Please log in to accept this invitation</p>
            <Link to={`/login?redirect=/accept-invitation/${token}`}>
              <Button variant="primary" className="w-full">Log In</Button>
            </Link>
            <Link to={`/register?redirect=/accept-invitation/${token}`}>
              <Button variant="secondary" className="w-full">Create Account</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {user.email !== invitation.email && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-yellow-700 dark:text-yellow-400">
                Warning: You're logged in as {user.email}, but this invitation was sent to {invitation.email}.
              </div>
            )}
            <Button variant="primary" className="w-full" onClick={handleAccept} loading={accepting}>
              Accept Invitation & Join
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full">Cancel</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
