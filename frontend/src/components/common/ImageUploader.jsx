import React, { useState } from 'react';
import { uploadApi } from '../../services/api';

/**
 * A drop-in image picker: shows the current image (if any), lets the vendor
 * choose a new file, uploads it immediately, and reports the resulting URL
 * back to the parent via onUploaded(url).
 */
export default function ImageUploader({ label, value, onUploaded, aspect = 'square' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { data } = await uploadApi.image(file);
      onUploaded(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  }

  const boxClasses = aspect === 'wide' ? 'h-24 w-full' : 'h-20 w-20';

  return (
    <div>
      {label && <label className="block text-xs text-ink/60 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        <div className={`${boxClasses} rounded-sm border border-ink/15 bg-white overflow-hidden flex items-center justify-center shrink-0`}>
          {value ? (
            <img src={value} alt={label || 'preview'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-ink/40 px-1 text-center">No image</span>
          )}
        </div>
        <label className="text-xs bg-ink text-paper px-3 py-1.5 rounded-sm cursor-pointer hover:opacity-90">
          {uploading ? 'Uploading…' : value ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" onChange={handleChange} className="hidden" disabled={uploading} />
        </label>
      </div>
      {error && <p className="text-accent-red text-xs mt-1">{error}</p>}
    </div>
  );
}
