import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const problems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    title: 'Scattered Documents',
    description: 'Certifications, reports, and compliance records live in separate email threads, drives, and local folders — making them hard to find and track.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    title: 'Disconnected Organizations',
    description: 'Institutions work with multiple partners — companies, regulators, labs — but there is no shared space to manage those relationships or track shared activities.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    title: 'Uncontrolled Access',
    description: 'Without proper role management, the wrong people get access to sensitive documents, or the right people are locked out of information they need.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    title: 'Inefficient Coordination',
    description: 'Coordinating across institutions using email chains and spreadsheets is slow, error-prone, and provides no visibility into the current status of activities.',
  },
];

function ProblemCard({ problem, index }: { problem: typeof problems[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`bg-white rounded-2xl border ${problem.border} p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className={`w-11 h-11 rounded-xl ${problem.bg} ${problem.color} flex items-center justify-center mb-4`}>
        {problem.icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{problem.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{problem.description}</p>
    </motion.div>
  );
}

export function Problem() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold mb-4">
            The Challenge
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            The Challenge Organizations Face
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Organizations today often collaborate across multiple institutions — companies, laboratories, regulators, and universities. Managing these relationships is difficult when information is scattered across emails, separate systems, and disconnected tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((problem, i) => (
            <ProblemCard key={problem.title} problem={problem} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
