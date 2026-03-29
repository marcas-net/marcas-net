interface AvatarProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  // Generate a deterministic human-like avatar using DiceBear's "adventurer" style
  const seed = encodeURIComponent((name ?? 'user').trim().toLowerCase());
  const dicebearUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

  return (
    <img
      src={dicebearUrl}
      alt={name ?? ''}
      className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800 ${className}`}
    />
  );
}
