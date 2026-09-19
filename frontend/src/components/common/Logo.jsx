import React from 'react';

/**
 * eSebeLink wordmark. `variant="mark"` shows just the pin+link icon (good for
 * tight spaces); `variant="full"` (default) shows the icon plus the name.
 */
export default function Logo({ variant = 'full', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/assets/logo-icon.png"
        alt="eSebeLink"
        className="h-8 w-8 rounded-full object-cover bg-white"
      />
      {variant === 'full' && (
        <span className="font-display font-semibold text-lg tracking-tight brand-text-gradient">
          eSebeLink
        </span>
      )}
    </span>
  );
}
