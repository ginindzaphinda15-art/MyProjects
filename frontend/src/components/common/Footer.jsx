import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-rail text-paper/60 text-xs">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span>© {new Date().getFullYear()} eSebeLink Marketplace</span>
        <span>Book directly with local businesses</span>
        <span>Contact:+26878282145/79062416</span>
      </div>
    </footer>
  );
}
