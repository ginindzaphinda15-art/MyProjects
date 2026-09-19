import React, { useEffect, useState } from 'react';
import { bookingApi, orderApi } from '../services/api';
import { formatDate, formatTime, formatMoney } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bookings');

  useEffect(() => {
    Promise.all([bookingApi.listMine(), orderApi.listMine()])
      .then(([b, o]) => {
        setBookings(b.data.bookings);
        setOrders(o.data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id) {
    const { data } = await bookingApi.cancel(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? data.booking : b)));
  }

  if (loading) return <LoadingSpinner label="Loading your activity…" />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl mb-6">My bookings &amp; orders</h1>

      <div className="flex gap-2 mb-6">
        <TabButton active={tab === 'bookings'} onClick={() => setTab('bookings')} label={`Bookings (${bookings.length})`} />
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} label={`Orders (${orders.length})`} />
      </div>

      {tab === 'bookings' && (
        <div className="bg-white border border-ink/10 rounded-sm divide-y divide-ink/10">
          {bookings.length === 0 && <p className="p-4 text-sm text-ink/60">No bookings yet — browse a business to get started.</p>}
          {bookings.map((b) => (
            <div key={b.id} className="p-4 flex items-center gap-4">
              <div className="w-24 text-xs font-mono text-ink/60">
                {formatDate(b.booking_date)}
                <br />
                {formatTime(b.booking_time)}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{b.service_name}</p>
                <p className="text-ink/60 text-xs">{b.vendor_name} · {formatMoney(b.price)}</p>
              </div>
              <span className={`stamp stamp-${b.status}`}>{b.status}</span>
              {['pending', 'confirmed'].includes(b.status) && (
                <button onClick={() => cancelBooking(b.id)} className="text-xs text-accent-red underline">
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white border border-ink/10 rounded-sm divide-y divide-ink/10">
          {orders.length === 0 && <p className="p-4 text-sm text-ink/60">No orders yet — browse a business to get started.</p>}
          {orders.map((o) => (
            <div key={o.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 text-sm">
                <p className="font-medium">{o.vendor_name} · {formatMoney(o.total_amount)}</p>
                <p className="text-ink/60 text-xs">{(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
              </div>
              <span className={`stamp stamp-${o.status}`}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-sm border ${
        active ? 'bg-ink text-paper border-ink' : 'border-ink/20 text-ink/70'
      }`}
    >
      {label}
    </button>
  );
}
