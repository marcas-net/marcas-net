import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function Partners() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold mb-6">
            Supporters &amp; Partners
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Supported by Our Network
          </h2>
          <p className="text-gray-500 text-base mb-10 max-w-md mx-auto">
            Partner organizations and institutions will be featured here as the network grows.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-400">
              Interested in becoming a partner?{' '}
              <a href="#" className="text-blue-600 hover:underline font-medium">Get in touch</a>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
