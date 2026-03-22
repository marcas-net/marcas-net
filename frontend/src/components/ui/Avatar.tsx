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
  return (
    <div
      className={`
        ${sizeMap[size]} rounded-full
        bg-gradient-to-br from-blue-500 to-blue-700
        flex items-center justify-center
        text-white font-semibold flex-shrink-0
        ${className}
      `.trim()}
    >
      {getInitials(name)}
    </div>
  );
}
