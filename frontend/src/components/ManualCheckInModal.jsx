import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ManualCheckInModal({ onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pax, setPax] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(name, pax, address);
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
        
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Tamu Manual</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Tamu</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
              placeholder="Masukkan nama lengkap"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alamat <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="glass-input"
              placeholder="Contoh: Jl. Merdeka No. 1, Bandung"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Jumlah Orang</label>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setPax(Math.max(1, pax - 1))}
                className="w-12 h-12 shrink-0 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors text-xl"
              >-</button>
              <input
                type="number"
                min="1"
                value={pax}
                onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                className="glass-input text-center text-xl font-bold w-full"
                required
              />
              <button 
                type="button"
                onClick={() => setPax(pax + 1)}
                className="w-12 h-12 shrink-0 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors text-xl"
              >+</button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Daftar & Hadir'}
          </button>
        </form>
      </div>
    </div>
  );
}
