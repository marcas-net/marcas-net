import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trackEvent } from '../../utils/analytics';

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
    <section className="relative pt-24 pb-20 overflow-hidden min-h-screen flex items-center" aria-label="Hero">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
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
          className="absolute rounded-full opacity-[0.07] dark:opacity-[0.12] blur-3xl -z-10"
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
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6"
            >
              The professional network for the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
                food industry
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/register"
                  onClick={() => trackEvent('signup_clicked')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
                  aria-label="Get started with MarcasNet"
                >
                  Create Free Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  onClick={() => trackEvent('login_clicked')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 font-semibold text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-5 text-xs text-gray-500 dark:text-gray-500"
            >
              Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Built for the food industry
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
                className="absolute inset-0 rounded-3xl blur-3xl opacity-20 dark:opacity-30"
                style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
              />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-black/40 p-8">
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
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-700"
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
                        fill="currentColor"
                        className="text-gray-700 dark:text-gray-300"
                        fontFamily="Inter, sans-serif"
                      >
                        {node.label}
                      </text>
                    </motion.g>
                  ))}
                </svg>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  Food &amp; nutrition organizations connected in one network
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
