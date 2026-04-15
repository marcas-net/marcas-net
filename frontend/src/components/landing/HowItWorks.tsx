import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up as a food producer, lab, university, regulator, or professional. It takes 30 seconds.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: '#2563eb',
  },
  {
    number: '02',
    title: 'Join or Set Up Your Organization',
    description: 'Create your food company, lab, university, or regulatory body, or join one already on MarcasNet.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: '#3b82f6',
  },
  {
    number: '03',
    title: 'Build Your Profile',
    description: 'Add your bio, role, and expertise to build a professional identity in the food ecosystem.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#6366f1',
  },
  {
    number: '04',
    title: 'Upload Certifications & Reports',
    description: 'Add lab reports, safety certificates, and compliance records to your credential library.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: '#22c55e',
  },
  {
    number: '05',
    title: 'Connect with Industry Partners',
    description: 'Discover and connect with labs, regulators, producers, or researchers. Build the partnerships that matter.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: '#16a34a',
  },
  {
    number: '06',
    title: 'Manage Products & Compliance',
    description: 'Track products, batches, and certification workflows. Coordinate with labs and regulators from one workspace.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#0891b2',
  },
];

function Step({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.15 }}
      className="relative flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: index * 0.15 + 0.15, type: 'spring', stiffness: 200 }}
        className="relative z-10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white mb-6 shadow-md"
        style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}
      >
        {step.icon}
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-[10px] font-black flex items-center justify-center shadow border border-gray-100 dark:border-gray-700">
          {index + 1}
        </span>
      </motion.div>

      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">{step.description}</p>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50" aria-label="How It Works">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
            Simple Onboarding
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Six steps to join the food industry's professional network and start managing your workflows.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-8 left-[8%] right-[8%] h-px bg-gradient-to-r from-blue-200 dark:from-blue-800 via-emerald-200 dark:via-emerald-800 to-cyan-300 dark:to-cyan-700" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <Step key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
