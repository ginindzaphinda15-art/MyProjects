import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api';
import { formatDate, formatTime, formatMoney } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const FLOW = ['pending', 'confirmed', 'completed'];

export default function BookingQueue() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    bookingApi
      .listForVendor()
      .then(({ data }) => setBookings(data.bookings))
      .finally(() => setLoading(false));
  }

  async function advance(booking) {
    const next = booking.status === 'cancelled' ? 'pending' : FLOW[(FLOW.indexOf(booking.status) + 1) % FLOW.length];
    const { data } = await bookingApi.updateStatus(booking.id, next);
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? data.booking : b)));
  }

  async function cancel(booking) {
    const { data } = await bookingApi.updateStatus(booking.id, 'cancelled');
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? data.booking : b)));
  }

  const visible = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  if (loading) return <LoadingSpinner label="Loading bookings…" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-lg">Bookings</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-auto border border-ink/20 rounded-sm px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {visible.length === 0 && <p className="text-sm text-ink/60">No bookings match this filter.</p>}

      <div className="bg-white border border-ink/10 rounded-sm divide-y divide-ink/10">
        {visible.map((b) => (
          <div key={b.id} className="p-4 flex items-center gap-4">
            <div className="w-24 text-xs font-mono text-ink/60">
              {formatDate(b.booking_date)}
              <br />
              {formatTime(b.booking_time)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{b.service_name}</p>
              <p className="text-xs text-ink/60">
                {b.customer_name} {b.customer_phone ? `· ${b.customer_phone}` : ''} · {formatMoney(b.price)}
              </p>
            </div>
            <button onClick={() => advance(b)} className={`stamp stamp-${b.status}`}>
              {b.status}
            </button>
            {b.status !== 'cancelled' && b.status !== 'completed' && (
              <button onClick={() => cancel(b)} className="text-xs text-accent-red underline">
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
