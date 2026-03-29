interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
}

const sizes = {
  sm: { text: 'text-lg', badge: 'text-sm px-1.5 py-0.5 rounded-md' },
  md: { text: 'text-xl', badge: 'text-base px-2 py-0.5 rounded-lg' },
  lg: { text: 'text-2xl', badge: 'text-lg px-2.5 py-0.5 rounded-lg' },
  xl: { text: 'text-3xl', badge: 'text-xl px-3 py-1 rounded-xl' },
};

export default function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const s = sizes[size];
  const marcasColor = variant === 'light' ? 'text-white' : 'text-slate-900 dark:text-white';

  return (
    <span className={`inline-flex items-center gap-0.5 font-bold tracking-tight ${s.text}`}>
      <span className={marcasColor}>Marcas</span>
      <span className={`bg-emerald-600 text-white font-bold ${s.badge}`}>Net</span>
    </span>
  );
}
