import React, { useEffect, useState } from 'react';
import { bookingApi, orderApi } from '../../services/api';
import { formatMoney } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingApi.listForVendor(), orderApi.listForVendor()])
      .then(([b, o]) => {
        setBookings(b.data.bookings);
        setOrders(o.data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Pulling up your counter…" />;

  const today = new Date().toISOString().slice(0, 10);
  const todaysBookings = bookings.filter((b) => b.booking_date === today && b.status !== 'cancelled');
  const openOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const weekRevenue =
    bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.price), 0) +
    orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <StatCard label="Today's bookings" value={todaysBookings.length} />
      <StatCard label="Open orders" value={openOrders.length} />
      <StatCard label="Total takings" value={formatMoney(weekRevenue)} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-ink/10 rounded-sm p-4">
      <p className="text-xs text-ink/60 mb-2">{label}</p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}
