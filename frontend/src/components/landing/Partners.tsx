const partners = [
  { name: 'ISO', description: 'International Standards' },
  { name: 'INPI', description: 'Intellectual Property' },
  { name: 'ANSES', description: 'Food Safety' },
  { name: 'INTI', description: 'Technology Institute' },
  { name: 'IRAM', description: 'Standards Body' },
  { name: 'CONICET', description: 'Research Council' },
  { name: 'SENASA', description: 'Agriculture' },
  { name: 'INAL', description: 'Food Lab' },
];

export function Partners() {
  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Trusted by organizations across industries
          </p>
          <p className="text-gray-500 text-sm">
            MarcasNet integrates with the regulatory and certification ecosystem you already work within.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {partners.map((p) => (
            <div
              key={p.name}
              className="group flex flex-col items-center justify-center gap-1 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
              >
                {p.name.substring(0, 2)}
              </div>
              <span className="text-xs font-bold text-gray-700 mt-1">{p.name}</span>
              <span className="text-[10px] text-gray-400 text-center leading-tight hidden sm:block">{p.description}</span>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { value: '500+', label: 'Organizations', icon: '🏢' },
            { value: '12k+', label: 'Documents managed', icon: '📄' },
            { value: '98%', label: 'Compliance rate', icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className="text-3xl mb-1">{stat.icon}</span>
              <span
                className="text-4xl font-extrabold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
              >
                {stat.value}
              </span>
              <span className="text-gray-500 text-sm mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
