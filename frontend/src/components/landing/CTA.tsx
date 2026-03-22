import { Link } from 'react-router-dom';

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #052e16 100%)' }}
      />
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#2563eb' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: '#22c55e' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.05)_0%,_transparent_70%)]" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/80 text-xs font-semibold mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Join thousands of organizations
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
          Ready to grow your{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #4ade80)' }}
          >
            brand network?
          </span>
        </h2>

        <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Create your free account today and connect with the organizations, labs, and regulators that matter to your growth.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
          >
            Create Free Account
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-200"
          >
            Sign in instead
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-8 text-white/30 text-xs">
          No credit card required · Free forever on the starter plan · Upgrade anytime
        </p>
      </div>
    </section>
  );
}
