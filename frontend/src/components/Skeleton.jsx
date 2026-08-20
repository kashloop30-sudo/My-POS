import React from 'react';

/**
 * Skeleton loading placeholder.
 * Usage:
 *   <Skeleton className="h-4 w-40" />           - single bar
 *   <SkeletonTable rows={5} cols={4} />          - table rows
 *   <SkeletonCard count={4} />                   - stat cards
 */

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="table-container overflow-hidden">
    <div className="table-header px-6 py-3 flex gap-6">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-6 px-6 py-4 border-b border-gray-100 last:border-0">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-32' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
