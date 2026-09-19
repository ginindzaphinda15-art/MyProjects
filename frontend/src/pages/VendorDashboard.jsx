import React, { useEffect, useState } from 'react';
import { vendorApi, uploadApi } from '../services/api';
import Dashboard from '../components/vendor/Dashboard';
import BookingQueue from '../components/vendor/BookingQueue';
import OrderQueue from '../components/vendor/OrderQueue';
import ServiceManager from '../components/vendor/ServiceManager';
import LocationPicker from '../components/vendor/LocationPicker';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'orders', label: 'Orders' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'profile', label: 'Business profile' },
];

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    vendorApi
      .getMine()
      .then(({ data }) => setVendor(data.vendor))
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Opening your counter…" />;

  if (!vendor) {
    return (
      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="font-display text-2xl mb-2">Set up your business profile</h1>
        <p className="text-sm text-ink/60 mb-6">
          Customers will find you once your profile is live. Add your branding and details to get started.
        </p>
        <VendorProfileForm onSaved={setVendor} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-1">
        {vendor.logo_url && (
          <img src={vendor.logo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        )}
        <h1 className="font-display text-2xl">{vendor.business_name}</h1>
      </div>
      <p className="text-ink/60 text-sm mb-6">{vendor.category}</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-sm border ${
              tab === t.key ? 'bg-brand-gradient text-white border-transparent' : 'border-ink/20 text-ink/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Dashboard />}
      {tab === 'bookings' && <BookingQueue />}
      {tab === 'orders' && <OrderQueue />}
      {tab === 'catalog' && <ServiceManager />}
      {tab === 'profile' && <VendorProfileForm vendor={vendor} onSaved={setVendor} />}
    </div>
  );
}

function VendorProfileForm({ vendor, onSaved }) {
  const [form, setForm] = useState({
    businessName: vendor?.business_name || '',
    category: vendor?.category || 'Salon & Spa',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    description: vendor?.description || '',
    logoUrl: vendor?.logo_url || '',
    bannerUrl: vendor?.banner_url || '',
    brandColor: vendor?.brand_color || '#0B63C9',
    latitude: vendor?.latitude != null ? Number(vendor.latitude) : null,
    longitude: vendor?.longitude != null ? Number(vendor.longitude) : null,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [uploading, setUploading] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(field, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(field);
    try {
      const { data } = await uploadApi.image(file);
      update(field, data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload that image.');
    } finally {
      setUploading('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await vendorApi.saveMine(form);
      onSaved(data.vendor);
      setSavedMsg('Profile saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-sm p-5 space-y-4 max-w-lg">
      {error && <p className="text-accent-red text-sm">{error}</p>}
      {savedMsg && <p className="text-accent-green text-sm">{savedMsg}</p>}

      <div>
        <label className="block text-xs text-ink/60 mb-1">Banner image</label>
        <div className="h-24 w-full rounded-sm bg-brand-gradient/10 overflow-hidden mb-2">
          {form.bannerUrl && <img src={form.bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <label className="text-xs text-brand-blue underline cursor-pointer">
          {uploading === 'bannerUrl' ? 'Uploading…' : 'Upload a cover banner'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload('bannerUrl', e)}
            disabled={!!uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-brand-gradient/10 overflow-hidden flex-shrink-0">
          {form.logoUrl && <img src={form.logoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Business logo</label>
          <label className="text-xs text-brand-blue underline cursor-pointer">
            {uploading === 'logoUrl' ? 'Uploading…' : 'Upload a logo'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('logoUrl', e)}
              disabled={!!uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Brand color (accents your public page)</label>
        <input
          type="color"
          value={form.brandColor}
          onChange={(e) => update('brandColor', e.target.value)}
          className="h-9 w-16 border border-ink/20 rounded-sm p-0.5 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Business name</label>
        <input
          type="text"
          value={form.businessName}
          onChange={(e) => update('businessName', e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        >
          {['Salon & Spa', 'Cafe & Restaurant', 'Repair & Trades', 'Fitness & Wellness', 'Retail', 'Professional Services', 'Other'].map(
            (c) => (
              <option key={c}>{c}</option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Phone</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        />
      </div>

      <LocationPicker
        latitude={form.latitude}
        longitude={form.longitude}
        onChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
      />

      <div>
        <label className="block text-xs text-ink/60 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={saving || !!uploading}
        className="bg-brand-gradient text-white text-sm px-4 py-2 rounded-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
