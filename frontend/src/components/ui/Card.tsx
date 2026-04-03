import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/80 shadow-sm dark:shadow-black/10
        ${paddingClasses[padding]}
        ${hover ? 'transition-all duration-200 hover:shadow-md dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-neutral-600 cursor-pointer hover:-translate-y-0.5' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  change?: string;
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
  orange: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
};

export function StatCard({ label, value, icon, color = 'blue', change }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {change && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{change}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
    </Card>
  );
}
