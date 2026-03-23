const previews = [
  {
    title: 'Dashboard Overview',
    description: 'Real-time stats on your organizations, documents, and team members at a glance.',
    badge: 'Dashboard',
    badgeColor: 'bg-blue-100 text-blue-700',
    screen: (
      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Organizations', val: '12', color: 'bg-blue-500' },
            { label: 'Documents', val: '48', color: 'bg-emerald-500' },
            { label: 'Members', val: '7', color: 'bg-violet-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className={`w-6 h-6 rounded-lg ${s.color} mb-2`} />
              <div className="text-lg font-black text-gray-900">{s.val}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-3">Recent Activity</div>
          {[
            { name: 'Lab Report Q1', type: 'PDF', date: 'Today' },
            { name: 'Certification ISO 9001', type: 'DOC', date: 'Yesterday' },
            { name: 'Quality Audit 2026', type: 'XLS', date: '3 days ago' },
          ].map((d) => (
            <div key={d.name} className="flex items-center gap-2 py-1.5">
              <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gray-500">{d.type}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-700 truncate">{d.name}</div>
              </div>
              <div className="text-[10px] text-gray-400 flex-shrink-0">{d.date}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Organization Hub',
    description: 'Browse, join, or manage organizations. Filter by type — company, lab, regulator, university.',
    badge: 'Organizations',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    screen: (
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="h-2 flex-1 bg-gray-100 rounded-full" />
        </div>
        {[
          { name: 'TechCorp SA', type: 'COMPANY', members: 14, color: 'bg-blue-500' },
          { name: 'BioLab Norte', type: 'LABORATORY', members: 6, color: 'bg-emerald-500' },
          { name: 'ANMAT Regional', type: 'REGULATOR', members: 3, color: 'bg-red-500' },
        ].map((org) => (
          <div key={org.name} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${org.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900">{org.name}</div>
              <div className="text-[10px] text-gray-400">{org.members} members</div>
            </div>
            <div className="text-[9px] font-semibold text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5">{org.type}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Document Vault',
    description: 'Secure, searchable document storage with role-based access and full version history.',
    badge: 'Documents',
    badgeColor: 'bg-violet-100 text-violet-700',
    screen: (
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="h-2.5 w-24 bg-gray-300 rounded-full" />
          <div className="h-6 w-16 rounded-lg bg-blue-500" />
        </div>
        {[
          { name: 'ISO_9001_Cert_2026.pdf', size: '2.4 MB', status: 'Verified' },
          { name: 'Lab_Report_Q1.docx', size: '890 KB', status: 'Pending' },
          { name: 'Quality_Manual_v3.xlsx', size: '1.1 MB', status: 'Verified' },
          { name: 'Brand_Guidelines.pdf', size: '5.2 MB', status: 'Draft' },
        ].map((doc) => (
          <div key={doc.name} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-gray-800 truncate">{doc.name}</div>
              <div className="text-[9px] text-gray-400">{doc.size}</div>
            </div>
            <div
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                doc.status === 'Verified'
                  ? 'bg-emerald-100 text-emerald-700'
                  : doc.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {doc.status}
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function PlatformPreview() {
  return (
    <section id="platform" className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-4">
            Platform Preview
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            A workspace designed for clarity
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
            Clean interfaces that surface exactly what you need — no clutter, no complexity.
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previews.map((p) => (
            <div
              key={p.title}
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Screen mockup */}
              <div className="p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                  <div className="w-2 h-2 rounded-full bg-yellow-300" />
                  <div className="w-2 h-2 rounded-full bg-green-300" />
                </div>
                {p.screen}
              </div>
              {/* Meta */}
              <div className="p-5">
                <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${p.badgeColor}`}>
                  {p.badge}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{p.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
