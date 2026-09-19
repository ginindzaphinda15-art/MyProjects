import React, { useEffect, useState } from 'react';
import { serviceApi, uploadApi } from '../../services/api';
import { formatMoney, initials } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ServiceManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', price: '', durationMinutes: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    serviceApi
      .listMine()
      .then(({ data }) => setServices(data.services))
      .finally(() => setLoading(false));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { data } = await uploadApi.image(file);
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload that photo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError('Give the service a name and a price.');
      return;
    }
    setError('');
    try {
      const { data } = await serviceApi.create({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        imageUrl: form.imageUrl || undefined,
      });
      setServices((prev) => [data.service, ...prev]);
      setForm({ name: '', description: '', price: '', durationMinutes: '', imageUrl: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add that service.');
    }
  }

  async function toggleActive(service) {
    const { data } = await serviceApi.update(service.id, { isActive: !service.is_active });
    setServices((prev) => prev.map((s) => (s.id === service.id ? data.service : s)));
  }

  async function remove(service) {
    if (!window.confirm(`Remove "${service.name}"?`)) return;
    await serviceApi.remove(service.id);
    setServices((prev) => prev.filter((s) => s.id !== service.id));
  }

  if (loading) return <LoadingSpinner label="Loading your catalog…" />;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleAdd} className="bg-white border border-ink/10 rounded-sm p-5 space-y-3 h-fit">
        <h3 className="font-display text-lg">Add a service or product</h3>
        {error && <p className="text-accent-red text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-sm bg-brand-gradient/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-ink/40">Photo</span>
            )}
          </div>
          <label className="text-xs text-brand-blue underline cursor-pointer">
            {uploading ? 'Uploading…' : 'Upload a catalog photo'}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="hidden" />
          </label>
        </div>

        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="5"
            placeholder="Minutes (if a booking)"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            className="border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="bg-brand-gradient text-white text-sm px-4 py-2 rounded-sm">
          Add to catalog
        </button>
      </form>

      <div className="bg-white border border-ink/10 rounded-sm divide-y divide-ink/10">
        {services.length === 0 && <p className="p-4 text-sm text-ink/60">Nothing in your catalog yet.</p>}
        {services.map((s) => (
          <div key={s.id} className="p-4 flex items-center gap-3">
            {s.image_url ? (
              <img src={s.image_url} alt={s.name} className="h-12 w-12 rounded-sm object-cover flex-shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-sm bg-brand-gradient/10 text-brand-green flex items-center justify-center font-display text-sm flex-shrink-0">
                {initials(s.name)}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-ink/60">
                {formatMoney(s.price)}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
              </p>
            </div>
            <button onClick={() => toggleActive(s)} className={`stamp ${s.is_active ? 'stamp-completed' : 'stamp-cancelled'}`}>
              {s.is_active ? 'active' : 'hidden'}
            </button>
            <button onClick={() => remove(s)} className="text-xs text-accent-red underline">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
