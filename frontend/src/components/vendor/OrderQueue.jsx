import React, { useEffect, useState } from 'react';
import { orderApi } from '../../services/api';
import { formatDate, formatMoney } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const FLOW = ['received', 'preparing', 'ready', 'completed'];

export default function OrderQueue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    orderApi
      .listForVendor()
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }

  async function advance(order) {
    const next = order.status === 'cancelled' ? 'received' : FLOW[(FLOW.indexOf(order.status) + 1) % FLOW.length];
    const { data } = await orderApi.updateStatus(order.id, next);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
  }

  async function cancel(order) {
    const { data } = await orderApi.updateStatus(order.id, 'cancelled');
    setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
  }

  const visible = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  if (loading) return <LoadingSpinner label="Loading orders…" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-lg">Orders</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-auto border border-ink/20 rounded-sm px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="received">Received</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {visible.length === 0 && <p className="text-sm text-ink/60">No orders match this filter.</p>}

      <div className="bg-white border border-ink/10 rounded-sm divide-y divide-ink/10">
        {visible.map((o) => (
          <div key={o.id} className="p-4 flex items-center gap-4">
            <div className="w-24 text-xs font-mono text-ink/60">{formatDate(o.created_at?.slice(0, 10))}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {o.customer_name} · {formatMoney(o.total_amount)}
              </p>
              <p className="text-xs text-ink/60">
                {(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </p>
            </div>
            <button onClick={() => advance(o)} className={`stamp stamp-${o.status}`}>
              {o.status}
            </button>
            {o.status !== 'cancelled' && o.status !== 'completed' && (
              <button onClick={() => cancel(o)} className="text-xs text-accent-red underline">
                Cancel
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
