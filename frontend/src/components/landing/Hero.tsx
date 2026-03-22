import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-semibold mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Now in Public Beta
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Build, Manage and{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
            >
              Grow Your Brand
            </span>{' '}
            Network
          </h1>

          {/* Subtext */}
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            MarcasNet is the unified platform connecting{' '}
            <strong className="text-gray-700 font-semibold">organizations</strong>,{' '}
            <strong className="text-gray-700 font-semibold">regulators</strong>,{' '}
            <strong className="text-gray-700 font-semibold">labs</strong> and{' '}
            <strong className="text-gray-700 font-semibold">professionals</strong> — so your brand
            grows faster, with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
            >
              Get Started — it's free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-gray-700 font-semibold text-sm bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Free to get started
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Secure & compliant
            </div>
          </div>
        </div>

        {/* Hero image / UI preview */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="absolute inset-0 rounded-2xl blur-2xl opacity-20"
            style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }} />
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white">
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 h-5 bg-gray-200 rounded-full max-w-xs" />
            </div>
            {/* Mock dashboard content */}
            <div className="flex" style={{ minHeight: '320px' }}>
              {/* Sidebar */}
              <div className="w-48 bg-slate-900 p-4 space-y-2 flex-shrink-0">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500" />
                  <div className="h-3 w-20 bg-slate-700 rounded-full" />
                </div>
                {[80, 60, 70, 55, 65].map((w, i) => (
                  <div
                    key={i}
                    className={`h-7 rounded-lg flex items-center px-3 gap-2 ${i === 0 ? 'bg-blue-500/20' : ''}`}
                  >
                    <div className="w-3 h-3 rounded bg-slate-600" />
                    <div className={`h-2 rounded-full bg-slate-${i === 0 ? '400' : '700'}`} style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 p-6 bg-gray-50">
                <div className="h-5 w-36 bg-gray-200 rounded-full mb-5" />
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { color: 'blue', label: 'Organizations' },
                    { color: 'green', label: 'Documents' },
                    { color: 'purple', label: 'Members' },
                  ].map((stat) => (
                    <div key={stat.color} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg bg-${stat.color}-100 mb-3`} />
                      <div className="h-5 w-8 bg-gray-900 rounded mb-1.5 text-xs font-bold" />
                      <div className="h-2.5 w-20 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="h-3 w-28 bg-gray-200 rounded-full mb-4" />
                  {[90, 70, 85].map((w, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-1">
                        <div className={`h-2 bg-gray-200 rounded-full`} style={{ width: `${w}%` }} />
                        <div className="h-1.5 bg-gray-100 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
