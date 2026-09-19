import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api';
import { formatMoney, formatTime } from '../../utils/formatters';

export default function BookingForm({ vendor, services, onBooked }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Scheduling assistant: once a date (and service) are picked, ask the
  // backend which times are already taken for this vendor and which are
  // free, so we can steer the customer away from a slot that would just
  // bounce back as a conflict.
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [takenTimes, setTakenTimes] = useState([]);
  const [freeSlots, setFreeSlots] = useState([]);

  const selectedService = services.find((s) => String(s.id) === String(serviceId));

  useEffect(() => {
    if (!date || !serviceId) {
      setTakenTimes([]);
      setFreeSlots([]);
      return;
    }
    let active = true;
    setCheckingAvailability(true);
    bookingApi
      .availability({ vendorId: vendor.id, date, serviceId })
      .then(({ data }) => {
        if (!active) return;
        setTakenTimes(data.takenTimes || []);
        setFreeSlots(data.freeSlots || []);
      })
      .catch(() => active && setError('Could not check availability for that date.'))
      .finally(() => active && setCheckingAvailability(false));
    return () => {
      active = false;
    };
  }, [date, serviceId, vendor.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!serviceId || !date || !time) {
      setError('Please choose a service, date and time.');
      return;
    }
    if (takenTimes.includes(time)) {
      setError('That time is already booked with this vendor — pick a free slot below.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await bookingApi.create({
        vendorId: vendor.id,
        serviceId: Number(serviceId),
        bookingDate: date,
        bookingTime: time,
        notes,
      });
      onBooked && onBooked(data.booking);
    } catch (err) {
      // The scheduling assistant refused a double-booked slot server-side
      // (e.g. someone else grabbed it a moment ago) and offers alternatives.
      const suggested = err.response?.data?.suggestedTimes;
      if (suggested?.length) {
        setFreeSlots(suggested);
        setTakenTimes((prev) => [...new Set([...prev, time])]);
      }
      setError(err.response?.data?.error || 'Could not create the booking.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-sm p-5 space-y-4">
      <h3 className="font-display text-lg">Book a slot</h3>
      {error && <p className="text-accent-red text-sm">{error}</p>}

      <div>
        <label className="block text-xs text-ink/60 mb-1">Service</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {formatMoney(s.price)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink/60 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-full border rounded-sm px-3 py-2 text-sm ${
              time && takenTimes.includes(time) ? 'border-accent-red' : 'border-ink/20'
            }`}
          />
        </div>
      </div>
      {time && takenTimes.includes(time) && (
        <p className="text-xs text-accent-red -mt-2">
          This vendor already has a booking at {formatTime(time)}. Try one of the free times below.
        </p>
      )}

      {date && (
        <div>
          <p className="text-xs text-ink/60 mb-1.5">
            {checkingAvailability ? 'Checking the vendor’s schedule…' : 'Free slots that day (scheduling assistant):'}
          </p>
          {!checkingAvailability && freeSlots.length === 0 && (
            <p className="text-xs text-ink/50">Fully booked that day — try another date.</p>
          )}
          {!checkingAvailability && freeSlots.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {freeSlots.slice(0, 8).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`text-xs px-2 py-1 rounded-sm border ${
                    time === slot
                      ? 'bg-brand-gradient text-white border-transparent'
                      : 'border-brand-green/40 text-brand-green hover:bg-brand-green/10'
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs text-ink/60 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      {selectedService && (
        <p className="text-sm text-ink/70">
          Price: <span className="font-mono">{formatMoney(selectedService.price)}</span> (pay the vendor directly)
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-gradient text-white px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Booking…' : 'Request booking'}
      </button>
    </form>
  );
}
