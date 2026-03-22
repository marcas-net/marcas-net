import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const floatingOrbs = [
  { size: 320, top: '-80px', right: '-60px', color: '#2563eb', delay: 0 },
  { size: 220, bottom: '-40px', left: '-40px', color: '#22c55e', delay: 1.5 },
  { size: 160, top: '40%', right: '15%', color: '#6366f1', delay: 0.8 },
];

const nodePositions = [
  { cx: 200, cy: 100, label: 'Company', color: '#2563eb' },
  { cx: 350, cy: 60,  label: 'Lab',     color: '#22c55e' },
  { cx: 440, cy: 170, label: 'Regulator', color: '#f59e0b' },
  { cx: 360, cy: 280, label: 'University', color: '#8b5cf6' },
  { cx: 200, cy: 280, label: 'Professional', color: '#ec4899' },
  { cx: 100, cy: 185, label: 'Institute', color: '#06b6d4' },
];

const edges = [
  [0, 1], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [0, 3], [1, 3],
];

export function Hero() {
  return (
    <section className="relative pt-24 pb-20 overflow-hidden min-h-screen flex items-center">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20" />
      <div className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(37,99,235,0.06) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating blobs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-[0.07] blur-3xl -z-10"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            top: orb.top,
            right: (orb as { right?: string }).right,
            bottom: (orb as { bottom?: string }).bottom,
            left: (orb as { left?: string }).left,
          }}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-semibold mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Institutional Collaboration Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6"
            >
              A Network for{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
              >
                Organizations
              </span>{' '}
              &amp; Institutions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-500 leading-relaxed mb-4"
            >
              MarcasNet connects organizations, professionals, laboratories,
              universities and regulatory bodies into a structured digital network where
              they can collaborate, manage documents, and coordinate activities.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-sm text-gray-400 leading-relaxed mb-10"
            >
              Many institutions work with multiple partners but lack a unified system to
              manage collaboration and documentation. MarcasNet provides a shared
              environment where organizations can manage their members, documents, and
              institutional relationships in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-gray-700 font-semibold text-sm bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-5 text-xs text-gray-400"
            >
              Free to start &nbsp;·&nbsp; Secure platform &nbsp;·&nbsp; Built for institutional collaboration
            </motion.p>
          </div>

          {/* Right: network illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-20"
                style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
              />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-2xl p-8">
                <svg viewBox="0 0 540 360" className="w-full h-auto" style={{ minHeight: 260 }}>
                  {/* Edges */}
                  {edges.map(([a, b], i) => {
                    const na = nodePositions[a];
                    const nb = nodePositions[b];
                    return (
                      <motion.line
                        key={i}
                        x1={na.cx} y1={na.cy}
                        x2={nb.cx} y2={nb.cy}
                        stroke="#e2e8f0"
                        strokeWidth="1.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                      />
                    );
                  })}
                  {/* Nodes */}
                  {nodePositions.map((node, i) => (
                    <motion.g
                      key={node.label}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1, type: 'spring', stiffness: 200 }}
                      style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                    >
                      <circle cx={node.cx} cy={node.cy} r="28" fill={node.color} fillOpacity="0.12" />
                      <circle cx={node.cx} cy={node.cy} r="18" fill={node.color} />
                      <text
                        x={node.cx}
                        y={node.cy + 42}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#374151"
                        fontFamily="Inter, sans-serif"
                      >
                        {node.label}
                      </text>
                    </motion.g>
                  ))}
                </svg>
                <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                  Organizations connected in one network
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
