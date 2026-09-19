import React, { useEffect, useRef, useState } from 'react';
import { paymentApi } from '../../services/api';
import { formatMoney } from '../../utils/formatters';

/**
 * Modal that walks a customer through paying via MTN MoMo for a booking or order.
 * Props: amount, bookingId | orderId, onClose(), onSuccess()
 */
export default function PaymentModal({ amount, bookingId, orderId, onClose, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('form'); // form | pending | success | failed
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await paymentApi.initiate({ amount, phone, bookingId, orderId });
      setPaymentId(data.payment.id);
      setStage('pending');
      pollRef.current = setInterval(() => pollStatus(data.payment.id), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start the payment.');
    }
  }

  async function pollStatus(id) {
    try {
      const { data } = await paymentApi.checkStatus(id);
      if (data.payment.status === 'successful') {
        clearInterval(pollRef.current);
        setStage('success');
        onSuccess && onSuccess();
      } else if (data.payment.status === 'failed') {
        clearInterval(pollRef.current);
        setStage('failed');
      }
    } catch {
      // keep polling silently — a transient network error shouldn't stop the flow
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-6 overflow-y-auto z-50">
      <div className="bg-paper rounded-sm max-w-sm w-full p-6 mt-16">
        <h3 className="font-display text-lg mb-1">Pay with MTN MoMo</h3>
        <p className="text-sm text-ink/60 mb-4">Amount due: {formatMoney(amount)}</p>

        {stage === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-accent-red text-sm">{error}</p>}
            <div>
              <label className="block text-xs text-ink/60 mb-1">MoMo phone number</label>
              <input
                type="text"
                placeholder="76123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="text-sm px-3 py-2">
                Cancel
              </button>
              <button type="submit" className="bg-ink text-paper text-sm px-4 py-2 rounded-sm">
                Send payment request
              </button>
            </div>
          </form>
        )}

        {stage === 'pending' && (
          <div className="text-sm text-ink/70 space-y-3">
            <p>Check your phone and approve the MoMo prompt to complete this payment.</p>
            <div className="h-1.5 w-full bg-ink/10 rounded overflow-hidden">
              <div className="h-full w-1/3 bg-accent-amber animate-pulse" />
            </div>
            <button onClick={onClose} className="text-xs underline text-ink/50">
              Close (payment keeps processing)
            </button>
          </div>
        )}

        {stage === 'success' && (
          <div className="text-sm space-y-3">
            <p className="text-accent-green font-medium">Payment successful.</p>
            <button onClick={onClose} className="bg-ink text-paper text-sm px-4 py-2 rounded-sm">
              Done
            </button>
          </div>
        )}

        {stage === 'failed' && (
          <div className="text-sm space-y-3">
            <p className="text-accent-red font-medium">The payment did not go through.</p>
            <button onClick={() => setStage('form')} className="bg-ink text-paper text-sm px-4 py-2 rounded-sm">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
