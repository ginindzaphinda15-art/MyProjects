import React from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../../utils/formatters';

export default function VendorCard({ vendor }) {
  const ring = vendor.brand_color ? { boxShadow: `0 0 0 2px ${vendor.brand_color}` } : undefined;

  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className="block bg-white border border-ink/10 rounded-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {vendor.banner_url ? (
        <div className="h-24 w-full overflow-hidden bg-ink/5">
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-2 bg-brand-gradient" />
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.business_name}
              className="h-10 w-10 rounded-full object-cover"
              style={ring}
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full bg-brand-gradient text-white flex items-center justify-center font-display text-sm"
              style={ring}
            >
              {initials(vendor.business_name)}
            </div>
          )}
          <div>
            <h3 className="font-display text-base leading-tight">{vendor.business_name}</h3>
            <p className="text-xs text-ink/60">{vendor.category}</p>
          </div>
        </div>
        {vendor.description && (
          <p className="text-sm text-ink/70 line-clamp-2">{vendor.description}</p>
        )}
        {vendor.address && <p className="text-xs text-ink/50 mt-3">{vendor.address}</p>}
      </div>
    </Link>
  );
}
