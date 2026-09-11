import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  dot = false
}) => {
  return (
    <span
      className={`badge-clinical badge-${variant} badge-${size} ${className}`}
    >
      {dot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
};
