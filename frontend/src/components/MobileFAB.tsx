import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function MobileFAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Only show on feed page
  if (location.pathname !== '/feed') return null;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Speed dial options */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 md:hidden flex flex-col items-end gap-3">
          <button
            onClick={() => { setOpen(false); /* scroll to create card */ window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Post</span>
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/messages'); }}
            className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Message</span>
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-gray-600 rotate-45'
            : 'bg-gradient-to-r from-blue-600 to-emerald-500'
        }`}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
}
