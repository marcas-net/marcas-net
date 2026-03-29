import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      const messages: Record<string, string> = {
        missing_code: 'Authorization was cancelled',
        token_exchange_failed: 'Authentication failed. Please try again.',
        no_email: 'Could not retrieve your email. Please use email/password signup.',
        oauth_failed: 'Something went wrong. Please try again.',
      };
      toast.error(messages[error] || 'Authentication failed');
      navigate('/login', { replace: true });
      return;
    }

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success('Welcome!');
        // Force a full page load so AuthContext picks up localStorage
        window.location.href = '/dashboard';
      } catch {
        toast.error('Authentication failed');
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Signing you in…</p>
      </div>
    </div>
  );
}
