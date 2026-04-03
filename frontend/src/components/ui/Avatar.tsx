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

const DEFAULT_AVATAR = '/user-avatar.svg';

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
  return (
    <img
      src={src || DEFAULT_AVATAR}
      alt={name ?? ''}
      className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800 ${className}`}
    />
  );
}
