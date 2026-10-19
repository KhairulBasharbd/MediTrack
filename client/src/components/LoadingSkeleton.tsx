import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-3 w-24 bg-slate-100 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded"></div>
        <div className="h-3 w-4/5 bg-slate-100 rounded"></div>
      </div>
      <div className="pt-2 flex justify-between items-center border-t border-slate-100">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-7 w-20 bg-slate-200 rounded"></div>
      </div>
    </div>
  );
};

export const SlotsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-200 rounded-lg"></div>
      ))}
    </div>
  );
};
