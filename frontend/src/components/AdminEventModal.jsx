import React, { useState } from 'react';
import { X, Calendar, Save } from 'lucide-react';

export default function AdminEventModal({ event, onClose, onSave }) {
  const [title, setTitle] = useState(event?.title || '');
  // Format date to YYYY-MM-DD for input type="date"
  const [date, setDate] = useState(event?.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '');
  const [isActive, setIsActive] = useState(event ? event.is_active : true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({
      title,
      event_date: date,
      is_active: isActive
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-8 w-full max-w-md relative animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar size={24} />
          {event ? 'Edit Event' : 'Tambah Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Event</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              placeholder="Contoh: Romeo & Juliet Wedding"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Event</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-slate-700 cursor-pointer select-none">
              Event Aktif
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            <Save size={18} />
            <span>Simpan Event</span>
          </button>
        </form>
      </div>
    </div>
  );
}
