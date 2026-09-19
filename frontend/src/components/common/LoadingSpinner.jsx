import React from 'react';

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60">
      <div className="h-8 w-8 rounded-full border-2 border-ink/20 border-t-accent-blue animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
