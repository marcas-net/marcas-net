import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  // Network Layer
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
    layer: 'Network',
    title: 'Organization Profiles',
    description: 'Create and showcase your food company, lab, university, or regulatory body. Let others discover your capabilities.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-indigo-500 to-blue-600',
    layer: 'Network',
    title: 'Professional Profiles',
    description: 'Build your professional identity. Show your role and expertise across the food and nutrition ecosystem.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-500',
    layer: 'Network',
    title: 'Industry Connections',
    description: 'Discover and connect with relevant organizations and professionals. Find labs or suppliers in one place.',
  },
  // Operational Layer
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-green-600',
    layer: 'Operational',
    title: 'Product Records',
    description: 'Register products and track batches. Keep organized records of everything your organization produces.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-teal-500 to-emerald-600',
    layer: 'Operational',
    title: 'Document Management',
    description: 'Upload, version, and share lab reports, certifications, and research files with access controls and audit trails.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-green-500 to-lime-600',
    layer: 'Operational',
    title: 'Workflow Tools',
    description: 'Coordinate activities across teams and organizations with shared workflows and real-time notifications.',
  },
  // Compliance Layer
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    layer: 'Compliance',
    title: 'Certifications & Lab Reports',
    description: 'Manage food safety certificates, lab test results, and regulatory submissions in a structured system.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    gradient: 'from-orange-400 to-amber-500',
    layer: 'Compliance',
    title: 'Role-Based Access Control',
    description: 'Control who can view, upload, and manage sensitive documents. Fine-grained permissions for all roles.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-rose-500 to-red-600',
    layer: 'Compliance',
    title: 'Regulatory Records',
    description: 'Maintain organized, audit-ready records for inspections and regulatory reviews with full activity logs.',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm dark:shadow-black/20 hover:shadow-xl dark:hover:shadow-black/40 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 shadow-sm bg-gradient-to-br ${feature.gradient}`}>
        {feature.icon}
      </div>
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

const layers = [
  { name: 'Network Layer', color: 'text-blue-600 dark:text-blue-400', desc: 'Connect with the right organizations and professionals' },
  { name: 'Operational Layer', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Manage products, documents, and day-to-day workflows' },
  { name: 'Compliance Layer', color: 'text-violet-600 dark:text-violet-400', desc: 'Stay audit-ready with certifications and regulatory records' },
];

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-950" aria-label="Platform Features">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-4">
            Platform Features
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Three Layers. One Platform.
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Network, streamline operations, and maintain compliance, all in one place.
          </p>
        </motion.div>

        {layers.map((layer, li) => {
          const layerFeatures = features.filter(f => f.layer === layer.name.split(' ')[0]);
          return (
            <div key={layer.name} className={li > 0 ? 'mt-12' : ''}>
              <div className="mb-6">
                <h3 className={`text-lg font-bold ${layer.color}`}>{layer.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{layer.desc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {layerFeatures.map((f, i) => (
                  <FeatureCard key={f.title} feature={f} index={li * 3 + i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
