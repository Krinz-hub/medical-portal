import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="card-clinical p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-8 bg-slate-100 rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
};
