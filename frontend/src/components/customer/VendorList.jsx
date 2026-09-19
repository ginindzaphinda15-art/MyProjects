import React, { useEffect, useState } from 'react';
import { vendorApi } from '../../services/api';
import VendorCard from './VendorCard';
import LoadingSpinner from '../common/LoadingSpinner';

const CATEGORIES = [
  'All categories',
  'Salon & Spa',
  'Cafe & Restaurant',
  'Repair & Trades',
  'Fitness & Wellness',
  'Retail',
  'Professional Services',
  'Other',
];

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All categories');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = {};
    if (category !== 'All categories') params.category = category;
    if (search.trim()) params.search = search.trim();

    vendorApi
      .list(params)
      .then(({ data }) => {
        if (active) setVendors(data.vendors);
      })
      .catch(() => active && setError('Could not load vendors right now.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [category, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search businesses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-ink/20 rounded-sm px-3 py-2 text-sm bg-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-ink/20 rounded-sm px-3 py-2 text-sm bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner label="Finding businesses near you…" />}
      {error && <p className="text-accent-red text-sm">{error}</p>}
      {!loading && !error && vendors.length === 0 && (
        <p className="text-sm text-ink/60">No businesses match those filters yet.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </div>
  );
}
