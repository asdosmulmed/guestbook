import React, { useState } from 'react';
import { X, UserMinus, Edit } from 'lucide-react';
import Swal from 'sweetalert2';

export default function EditCheckInModal({ guest, onClose, onUpdate, onUndo }) {
  // guest.attendance exists if they are checked in
  const initialPax = guest.attendance?.pax || 1;
  const [pax, setPax] = useState(initialPax);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate(guest.id, pax);
    setLoading(false);
  };

  const handleUndo = async () => {
    const result = await Swal.fire({
      title: 'Batalkan Kehadiran?',
      text: `Yakin ingin membatalkan kehadiran ${guest.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Kembali',
      background: '#ffffff',
      color: '#111827',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 shadow-xl',
        confirmButton: 'rounded-xl px-6 py-2.5',
        cancelButton: 'rounded-xl px-6 py-2.5',
      }
    });

    if (result.isConfirmed) {
      setLoading(true);
      await onUndo(guest.id);
      setLoading(false);
    }
  };

  if (!guest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-8 w-full max-w-md relative animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Edit Kehadiran</h2>
        <p className="text-slate-600 mb-6 text-lg">{guest.name}</p>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ubah Jumlah Orang</label>
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
          
          <div className="flex flex-col gap-3 mt-8">
            <button 
              type="submit" 
              disabled={loading || pax === initialPax}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Edit size={18} />
              <span>Simpan Perubahan Jumlah</span>
            </button>

            <button 
              type="button" 
              onClick={handleUndo}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <UserMinus size={18} />
              <span>Batal Hadir (Undo)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
