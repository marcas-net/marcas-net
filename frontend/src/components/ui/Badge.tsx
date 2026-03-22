import { type ReactNode } from 'react';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';

const variantMap: Record<BadgeVariant, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'blue', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantMap[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
