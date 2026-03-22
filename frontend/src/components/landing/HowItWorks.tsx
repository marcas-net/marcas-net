const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up in seconds. Choose your role — professional, org admin, regulator, or lab — and set up your profile.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Set Up Your Organization',
    description: 'Create or join a company, laboratory, university, or regulatory body. Configure access levels for each team member.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Upload & Manage Documents',
    description: 'Upload certifications, lab reports, compliance records, and branding files. Keep everything organized and version-tracked.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Connect & Collaborate',
    description: 'Discover partners, regulators, and labs across the network. Collaborate in real time to accelerate certification and brand growth.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdf4 100%)' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
            Simple Onboarding
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Up and running in minutes
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            No complex setup. No lengthy integration. Just four steps to a fully connected brand network.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-emerald-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div
                  className="relative z-10 w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white mb-6 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${i < 2 ? '#2563eb' : '#22c55e'}, ${i < 2 ? '#1d4ed8' : '#16a34a'})`,
                  }}
                >
                  {step.icon}
                  <span className="text-xs font-bold opacity-70 mt-0.5">{step.number}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
