import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-icon.jpeg" alt="MarcasNet" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-bold text-gray-900 text-lg tracking-tight">MarcasNet</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Platform', href: '#platform' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-lg">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Platform', href: '#platform' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-gray-700 py-1"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <Link to="/login" className="text-sm font-medium text-center py-2 border border-gray-200 rounded-xl text-gray-700">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-center py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #2563eb, #22c55e)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
