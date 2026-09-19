import React from 'react';
import VendorList from '../components/customer/VendorList';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2">Book and order from local businesses</h1>
        <p className="text-ink/60 text-sm">
          Browse salons, restaurants, trades and more — see where they are on the map, then book a slot or place an order.
        </p>
      </div>
      <VendorList />
    </div>
  );
}
