import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { trackEvent } from '../../utils/analytics';

export function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      className="py-24 relative overflow-hidden"
      aria-label="Call to Action"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #052e16 100%)' }}
    >
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl -z-10"
        style={{ background: '#2563eb' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl -z-10"
        style={{ background: '#22c55e' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-xs font-semibold mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open to all organizations
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Join the Food Industry's{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #4ade80)' }}
            >
              Professional Network
            </span>
          </h2>

          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Create your free account and connect with food producers, labs, researchers, and regulators. Build your professional network today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ filter: 'none' }}
              animate={{ boxShadow: ['0 0 0px #22c55e00', '0 0 24px #22c55e44', '0 0 0px #22c55e00'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Link
                to="/register"
                onClick={() => trackEvent('create_account_clicked')}
                aria-label="Create a free MarcasNet account"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-sm shadow-xl transition-all bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
              >
                Create Free Account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border border-white/20 text-white/80 hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </motion.div>
          </div>

          <p className="mt-8 text-white/25 text-xs">
            Free to start &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Built for the food industry
          </p>
        </motion.div>
      </div>
    </section>
  );
}
