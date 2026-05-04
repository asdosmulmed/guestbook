import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Plus, Edit, Trash2, Loader2, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import AdminEventModal from '../components/AdminEventModal';
import AdminUserModal from '../components/AdminUserModal';
import ImportGuestModal from '../components/ImportGuestModal';

export default function AdminManage() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'users'
  
  // Data State
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [importEventId, setImportEventId] = useState(null); // event yang sedang diimport

  const navigate = useNavigate();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard/home');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const res = await api.get('/admin/events');
        setEvents(res.data.data);
      } else {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
        // We also need events for the user dropdown
        if (events.length === 0) {
          const evRes = await api.get('/admin/events');
          setEvents(evRes.data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      Swal.fire('Error', 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Event Handlers
  // ======================
  const handleSaveEvent = async (eventData) => {
    try {
      if (selectedEvent) {
        await api.put(`/admin/events/${selectedEvent.id}`, eventData);
        Swal.fire('Berhasil', 'Event berhasil diperbarui!', 'success');
      } else {
        await api.post('/admin/events', eventData);
        Swal.fire('Berhasil', 'Event baru berhasil dibuat!', 'success');
      }
      setIsEventModalOpen(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan event', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Event?',
      text: "Semua data tamu dan petugas terkait mungkin akan terdampak!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#111827',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 shadow-xl',
        confirmButton: 'rounded-xl px-6 py-2.5',
        cancelButton: 'rounded-xl px-6 py-2.5',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/events/${id}`);
        Swal.fire('Terhapus!', 'Event telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus event', 'error');
      }
    }
  };

  // ======================
  // User Handlers
  // ======================
  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, userData);
        Swal.fire('Berhasil', 'Data petugas berhasil diperbarui!', 'success');
      } else {
        await api.post('/admin/users', userData);
        Swal.fire('Berhasil', 'Petugas baru berhasil ditambahkan!', 'success');
      }
      setIsUserModalOpen(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan petugas', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Petugas?',
      text: "Akun ini tidak akan bisa login lagi.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#111827',
      customClass: {
        popup: 'rounded-2xl border border-slate-200 shadow-xl',
        confirmButton: 'rounded-xl px-6 py-2.5',
        cancelButton: 'rounded-xl px-6 py-2.5',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/users/${id}`);
        Swal.fire('Terhapus!', 'Akun petugas telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus petugas', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <header className="mb-8 mt-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Manajemen Sistem</h1>
        <p className="text-slate-500">Kelola Event dan Akun Petugas</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'events' ? 'bg-blue-600 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={18} />
          <span>Kelola Event</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'users' ? 'bg-blue-600 text-white font-medium shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={18} />
          <span>Kelola Petugas</span>
        </button>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-end">
        {activeTab === 'events' ? (
          <button
            onClick={() => { setSelectedEvent(null); setIsEventModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Tambah Event</span>
          </button>
        ) : (
          <button
            onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Tambah Petugas</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar pb-20">
        {loading ? (
          <div className="flex justify-center mt-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            {activeTab === 'events' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-slate-700 font-semibold">Nama Event</th>
                    <th className="p-4 text-slate-700 font-semibold">Tanggal</th>
                    <th className="p-4 text-slate-700 font-semibold">Status</th>
                    <th className="p-4 text-slate-700 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? events.map(event => (
                    <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-900 font-semibold">{event.title}</td>
                      <td className="p-4 text-slate-600">
                        {new Date(event.event_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-3 py-1 rounded-full border ${
                          event.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {event.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button 
                          onClick={() => setImportEventId(event.id)}
                          className="p-2 text-slate-500 hover:text-green-600 bg-slate-100 rounded-lg transition-colors"
                          title="Import Tamu dari Excel"
                        ><Upload size={16} /></button>
                        <button 
                          onClick={() => { setSelectedEvent(event); setIsEventModalOpen(true); }}
                          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        ><Edit size={16} /></button>
                        <button 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 rounded-lg transition-colors"
                          title="Hapus"
                        ><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Belum ada data event.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-slate-700 font-semibold">Nama</th>
                    <th className="p-4 text-slate-700 font-semibold">Email</th>
                    <th className="p-4 text-slate-700 font-semibold">Event Ditugaskan</th>
                    <th className="p-4 text-slate-700 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-900 font-semibold">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4 text-slate-700">
                        {u.event ? u.event.title : <span className="text-red-500">Tidak ada</span>}
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        ><Edit size={16} /></button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 rounded-lg transition-colors"
                          title="Hapus"
                        ><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Belum ada data petugas.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isEventModalOpen && (
        <AdminEventModal 
          event={selectedEvent} 
          onClose={() => setIsEventModalOpen(false)} 
          onSave={handleSaveEvent}
        />
      )}

      {isUserModalOpen && (
        <AdminUserModal 
          user={selectedUser}
          events={events}
          onClose={() => setIsUserModalOpen(false)} 
          onSave={handleSaveUser}
        />
      )}

      {importEventId && (
        <ImportGuestModal
          eventId={importEventId}
          onClose={() => setImportEventId(null)}
          onSuccess={() => {
            setImportEventId(null);
            Swal.fire({
              icon: 'success',
              title: 'Import Selesai!',
              text: 'Daftar tamu berhasil diimport.',
              confirmButtonColor: '#2563EB',
              background: '#ffffff',
              color: '#111827',
              customClass: {
                popup: 'rounded-2xl border border-slate-200 shadow-xl',
                confirmButton: 'rounded-xl px-6 py-2.5',
              }
            });
          }}
        />
      )}
    </div>
  );
}
