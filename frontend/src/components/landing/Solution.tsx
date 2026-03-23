import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const benefits = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Centralized Food Documentation',
    desc: 'Lab reports, food safety certificates, nutrition research, and compliance records are all stored in one structured, searchable environment.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Structured Organization Management',
    desc: 'Create food producers, nutrition labs, universities, or regulatory bodies as separate organizations. Manage members and control who can access what.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Secure Document Storage',
    desc: 'Upload and organize food certifications, laboratory test reports, and nutrition research files in a secure system with role-based access — no more attachments lost in email.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Cross-Institutional Coordination',
    desc: 'Food companies can connect with testing laboratories and regulatory bodies within the same network — coordinating certification, compliance, and research activities in one place.',
  },
];

export function Solution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 bg-white dark:bg-gray-950" aria-label="The Solution">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-5">
              The Solution
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-5">
              A Unified Network for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                Institutional Collaboration
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-4">
              MarcasNet brings organizations together into a single digital platform where institutions can collaborate more effectively.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              Instead of relying on multiple disconnected systems, organizations can manage their teams, documents, and partnerships from one structured environment. The platform helps institutions stay organized while enabling secure collaboration across their network.
            </p>
          </motion.div>

          {/* Right: benefit cards */}
          <div className="space-y-4">
            {benefits.map((b, i) => {
              const cardRef = useRef(null);
              const cardInView = useInView(cardRef, { once: true, margin: '-60px' });
              return (
                <motion.div
                  key={b.title}
                  ref={cardRef}
                  initial={{ opacity: 0, x: 32 }}
                  animate={cardInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm group-hover:scale-105 transition-transform bg-gradient-to-br from-blue-600 to-green-500"
                  >
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{b.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
