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

const DEFAULT_AVATAR = 'data:image/png;base64,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';

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={name ?? ''}
      className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800 ${className}`}
    />
  );
}
