export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  secondary: '#22c55e',
  secondaryHover: '#16a34a',
  background: '#f8fafc',
  cardBg: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  sidebar: '#0f172a',
} as const;

export const orgTypeVariant: Record<string, 'blue' | 'green' | 'purple' | 'red' | 'yellow'> = {
  COMPANY: 'blue',
  LABORATORY: 'green',
  UNIVERSITY: 'purple',
  REGULATOR: 'red',
  PROFESSIONAL: 'yellow',
};

export const roleVariant: Record<string, 'red' | 'orange' | 'blue' | 'purple' | 'green'> = {
  ADMIN: 'red',
  ORG_ADMIN: 'orange',
  USER: 'blue',
  REGULATOR: 'purple',
  LAB: 'green',
  UNIVERSITY: 'purple',
  PROFESSIONAL: 'blue',
};
