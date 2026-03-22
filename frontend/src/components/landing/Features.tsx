const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
    glow: 'bg-blue-100',
    title: 'Organization Management',
    description:
      'Create and manage companies, labs, universities, and regulatory bodies in one unified workspace. Assign roles, control access, and track activity across every entity.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-green-600',
    glow: 'bg-emerald-100',
    title: 'Collaboration',
    description:
      'Invite team members, assign granular roles, and streamline cross-organization workflows. Real-time visibility into who is doing what, across every project.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    glow: 'bg-violet-100',
    title: 'Document Management',
    description:
      'Upload, organize, and share compliance documents, certifications, and reports securely. Maintain a full audit trail and ensure every document is version-controlled.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-amber-500',
    glow: 'bg-orange-100',
    title: 'Global Connectivity',
    description:
      'Connect with regulatory bodies, testing laboratories, and international partners. Build a trusted network that accelerates certification and market access worldwide.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-4">
            Platform Features
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything your brand network needs
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Built for organizations that need structure, speed, and compliance — all in one place.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${f.glow} rounded-2xl`} />

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 shadow-sm bg-gradient-to-br ${f.gradient}`}
              >
                {f.icon}
              </div>

              <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
