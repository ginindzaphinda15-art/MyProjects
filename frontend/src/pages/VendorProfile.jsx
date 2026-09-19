import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { vendorApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingForm from '../components/customer/BookingForm';
import OrderForm from '../components/customer/OrderForm';
import VendorLocationMap from '../components/customer/VendorLocationMap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatMoney, initials } from '../utils/formatters';

export default function VendorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    vendorApi
      .get(id)
      .then(({ data }) => {
        setVendor(data.vendor);
        setServices(data.services);
      })
      .catch(() => setError('Could not load this business.'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleBooked() {
    setConfirmation('Booking requested — the vendor will confirm it shortly.');
  }

  function handleOrdered() {
    setConfirmation('Order placed — the vendor has been notified.');
  }

  const bookableServices = services.filter((s) => s.duration_minutes);
  const orderableServices = services;

  if (loading) return <LoadingSpinner label="Loading business…" />;
  if (error) return <p className="max-w-3xl mx-auto px-6 py-10 text-accent-red text-sm">{error}</p>;
  if (!vendor) return null;

  const canTransact = !user || user.role === 'customer';
  const brandStyle = vendor.brand_color ? { color: vendor.brand_color } : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      {vendor.banner_url ? (
        <div className="h-40 w-full overflow-hidden bg-ink/5">
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-3 bg-brand-gradient" />
      )}

      <div className="px-6 pt-6 pb-10">
        <div className="flex items-center gap-4 mb-2">
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.business_name}
              className="h-16 w-16 rounded-full object-cover border-2 border-white shadow -mt-14 bg-white"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-brand-gradient text-white flex items-center justify-center font-display text-xl -mt-14 shadow">
              {initials(vendor.business_name)}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl" style={brandStyle}>
              {vendor.business_name}
            </h1>
            <p className="text-ink/60 text-sm">{vendor.category}</p>
          </div>
        </div>
        {vendor.address && <p className="text-ink/50 text-xs mb-4">{vendor.address}</p>}
        {vendor.description && <p className="text-sm text-ink/70 mb-8">{vendor.description}</p>}

        {confirmation && <p className="text-accent-green text-sm mb-4">{confirmation}</p>}

        <h2 className="font-display text-lg mb-3">Menu &amp; services</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {services.length === 0 && <p className="text-sm text-ink/60">Nothing listed yet.</p>}
          {services.map((s) => (
            <div key={s.id} className="bg-white border border-ink/10 rounded-sm overflow-hidden flex">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="h-20 w-20 object-cover flex-shrink-0" />
              ) : (
                <div className="h-20 w-20 flex-shrink-0 bg-brand-gradient/10 flex items-center justify-center text-brand-green font-display text-lg">
                  {initials(s.name)}
                </div>
              )}
              <div className="p-3 flex-1 flex flex-col justify-center">
                <p className="font-medium text-sm">{s.name}</p>
                {s.description && <p className="text-ink/50 text-xs line-clamp-2">{s.description}</p>}
                <span className="font-mono text-sm mt-1">{formatMoney(s.price)}</span>
              </div>
            </div>
          ))}
        </div>

        {!canTransact && (
          <p className="text-sm text-ink/60">Log in as a customer to book or order from this business.</p>
        )}

        {canTransact && (
          <div className="grid md:grid-cols-2 gap-6">
            {bookableServices.length > 0 && (
              <div>
                <VendorLocationMap
                  latitude={vendor.latitude}
                  longitude={vendor.longitude}
                  businessName={vendor.business_name}
                />
                <BookingForm vendor={vendor} services={bookableServices} onBooked={handleBooked} />
              </div>
            )}
            {orderableServices.length > 0 && (
              <OrderForm vendor={vendor} services={orderableServices} onOrdered={handleOrdered} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
