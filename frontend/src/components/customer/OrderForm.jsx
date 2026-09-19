import React, { useState } from 'react';
import { orderApi } from '../../services/api';
import { formatMoney } from '../../utils/formatters';

export default function OrderForm({ vendor, services, onOrdered }) {
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function setQty(serviceId, qty) {
    setQuantities((prev) => ({ ...prev, [serviceId]: Math.max(0, Number(qty) || 0) }));
  }

  const items = services
    .map((s) => ({ service: s, quantity: quantities[s.id] || 0 }))
    .filter((i) => i.quantity > 0);

  const total = items.reduce((sum, i) => sum + i.quantity * Number(i.service.price), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) {
      setError('Add at least one item to your order.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await orderApi.create({
        vendorId: vendor.id,
        notes,
        items: items.map((i) => ({ serviceId: i.service.id, quantity: i.quantity })),
      });
      onOrdered && onOrdered(data.order);
      setQuantities({});
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-sm p-5 space-y-4">
      <h3 className="font-display text-lg">Place an order</h3>
      {error && <p className="text-accent-red text-sm">{error}</p>}

      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-ink/50 text-xs">{formatMoney(s.price)} each</p>
            </div>
            <input
              type="number"
              min="0"
              value={quantities[s.id] || ''}
              placeholder="0"
              onChange={(e) => setQty(s.id, e.target.value)}
              className="w-20 border border-ink/20 rounded-sm px-2 py-1 text-right"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-ink/60 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <p className="text-sm font-mono">Total: {formatMoney(total)} (pay the vendor directly)</p>

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Placing order…' : 'Place order'}
      </button>
    </form>
  );
}
