import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const features = [
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Centralize Your Brands',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    label: 'Scale Across Markets',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Secure & Reliable',
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
        {/* Logo */}
        <Link to="/">
          <Logo size="xl" />
        </Link>

        {/* Hero copy */}
        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
              Build, Manage<br />and Grow Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
                Brand Network
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-5 text-lg leading-relaxed">
              Connect. Automate. Expand.<br />All in one intelligent platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-slate-800 font-semibold text-[15px]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative globe */}
        <div className="relative h-44 pointer-events-none select-none" aria-hidden>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-blue-200/60 to-emerald-200/60 blur-2xl" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-52 h-52 rounded-full border-2 border-blue-200/70" />
          <div className="absolute bottom-12 left-[55%] w-36 h-36 rounded-full border border-emerald-200/70" />
          {[
            { b: 32, l: 120 }, { b: 60, l: 80 }, { b: 20, l: 200 },
            { b: 50, l: 260 }, { b: 80, l: 180 }, { b: 10, l: 310 },
          ].map((pos, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full bg-blue-400/70"
              style={{ bottom: pos.b, left: pos.l }} />
          ))}
          {[
            { b: 40, r: 60 }, { b: 70, r: 120 }, { b: 25, r: 90 },
          ].map((pos, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/70"
              style={{ bottom: pos.b, right: pos.r }} />
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col px-6 py-8 lg:px-16">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between mb-8 gap-2">
          {/* Mobile logo + back to home */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="lg:hidden flex-shrink-0">
              <Link to="/">
                <Logo size="lg" />
              </Link>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden xs:inline sm:inline">Back to Home</span>
              <span className="xs:hidden sm:hidden">Home</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm flex-shrink-0">
            <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm whitespace-nowrap">
              {subtitle === 'register' ? (
                <><span className="hidden xs:inline">Already have an account? </span><span className="xs:hidden">Have account? </span></>
              ) : (
                <><span className="hidden xs:inline">Don&apos;t have an account? </span><span className="xs:hidden">New? </span></>
              )}
            </span>
            <Link
              to={subtitle === 'register' ? '/login' : '/register'}
              className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-emerald-600 transition-all shadow-sm whitespace-nowrap"
            >
              {subtitle === 'register' ? 'Sign In' : 'Sign Up'}
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && (
                <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                  Get started with{' '}
                  <span className="font-semibold text-slate-700 dark:text-white">Marcas</span>
                  <span className="font-semibold text-emerald-600">Net</span>
                </p>
              )}
            </div>
            {children}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-8 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fast Setup
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Data
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Global Access
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
