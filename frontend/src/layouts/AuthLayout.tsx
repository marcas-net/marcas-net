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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    label: 'Centralize Your Brands',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    label: 'Scale Across Markets',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    label: 'Secure & Reliable',
  },
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const authCtaLabel = subtitle === 'register' ? 'Already have an account?' : "Don't have an account?";
  const authCtaHref = subtitle === 'register' ? '/login' : '/register';
  const authCtaButton = subtitle === 'register' ? 'Sign In' : 'Sign Up';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-14 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
        <Link to="/">
          <Logo size="xl" />
        </Link>

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white">
              Build, Manage
              <br />
              and Grow Your
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Brand Network
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              Connect. Automate. Expand.
              <br />
              All in one intelligent platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-center gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {feature.icon}
                </div>
                <span className="text-[15px] font-semibold text-slate-800">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none relative h-44 select-none" aria-hidden>
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/60 to-emerald-200/60 blur-2xl" />
          <div className="absolute bottom-4 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full border-2 border-blue-200/70" />
          <div className="absolute bottom-12 left-[55%] h-36 w-36 rounded-full border border-emerald-200/70" />

          {[
            { b: 32, l: 120 },
            { b: 60, l: 80 },
            { b: 20, l: 200 },
            { b: 50, l: 260 },
            { b: 80, l: 180 },
            { b: 10, l: 310 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-blue-400/70"
              style={{ bottom: pos.b, left: pos.l }}
            />
          ))}

          {[
            { b: 40, r: 60 },
            { b: 70, r: 120 },
            { b: 25, r: 90 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400/70"
              style={{ bottom: pos.b, right: pos.r }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-16">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start sm:gap-4">
            <div className="flex-shrink-0 lg:hidden">
              <Link to="/">
                <Logo size="lg" />
              </Link>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:px-0 sm:text-sm"
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-gray-800 dark:bg-gray-900/70 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{authCtaLabel}</span>
            <Link
              to={authCtaHref}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-emerald-600 sm:w-auto sm:min-w-[112px]"
            >
              {authCtaButton}
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8 md:p-10">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Get started with{' '}
                    <span className="font-semibold text-slate-700 dark:text-white">Marcas</span>
                    <span className="font-semibold text-emerald-600">Net</span>
                  </p>
                )}
              </div>

              {children}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 sm:mt-6 sm:gap-8">
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fast Setup
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Secure Data
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                  />
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
