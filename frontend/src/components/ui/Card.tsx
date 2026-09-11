import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${
        hoverable ? 'card-clinical-interactive' : 'card-clinical'
      } overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
