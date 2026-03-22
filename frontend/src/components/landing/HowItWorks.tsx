import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Create an Account',
    description: 'Sign up and set up your profile on the platform. Choose your role — professional, organization admin, regulator, or lab technician.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: '#2563eb',
  },
  {
    number: '02',
    title: 'Create or Join an Organization',
    description: 'Create a new organization — company, laboratory, university, or regulatory body — or join an existing institution within the network.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: '#3b82f6',
  },
  {
    number: '03',
    title: 'Invite Members',
    description: 'Add team members and colleagues to your organization. Assign appropriate roles so each person has the right level of access.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    color: '#22c55e',
  },
  {
    number: '04',
    title: 'Collaborate and Manage Documents',
    description: 'Upload documents, share resources with partner organizations, and coordinate activities across your institutional network.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: '#16a34a',
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
      {/* Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: index * 0.15 + 0.15, type: 'spring', stiffness: 200 }}
        className="relative z-10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white mb-6 shadow-md"
        style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}
      >
        {step.icon}
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-black flex items-center justify-center shadow border border-gray-100">
          {index + 1}
        </span>
      </motion.div>

      <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed max-w-[200px] mx-auto">{step.description}</p>
    </motion.div>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-24" style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff 50%, #f0fdf4)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
            Simple Onboarding
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            How MarcasNet Works
          </h2>
          <p className="text-gray-500 text-lg">
            Set up your organization and start collaborating in four straightforward steps.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-emerald-200 to-emerald-300" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((step, i) => (
              <Step key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
