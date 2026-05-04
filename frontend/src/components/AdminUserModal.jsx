import React, { useState } from 'react';
import { X, User, Save } from 'lucide-react';

export default function AdminUserModal({ user, events, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [eventId, setEventId] = useState(user?.event_id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId) {
      alert("Pilih event terlebih dahulu!");
      return;
    }
    setLoading(true);
    
    const payload = {
      name,
      email,
      event_id: eventId
    };
    
    // Only send password if it's filled (or if creating a new user)
    if (password) {
      payload.password = password;
    } else if (!user) {
      alert("Password wajib diisi untuk pengguna baru.");
      setLoading(false);
      return;
    }

    await onSave(payload);
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
          <User size={24} />
          {user ? 'Edit Petugas' : 'Tambah Petugas'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full"
              placeholder="Nama Petugas"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full"
              placeholder="petugas@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password {user && <span className="text-xs text-slate-400">(Kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full"
              placeholder={user ? "••••••••" : "Masukkan password baru"}
              required={!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="glass-input w-full appearance-none bg-white text-slate-900"
              required
            >
              <option value="" disabled>-- Pilih Event --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            <Save size={18} />
            <span>Simpan Petugas</span>
          </button>
        </form>
      </div>
    </div>
  );
}
