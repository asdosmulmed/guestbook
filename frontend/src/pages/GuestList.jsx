import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, CheckCircle, MapPin, FileUp, FileDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useOfflineQueue, enqueue } from '../hooks/useOfflineQueue';
import CheckInModal from '../components/CheckInModal';
import ManualCheckInModal from '../components/ManualCheckInModal';
import EditCheckInModal from '../components/EditCheckInModal';
import Toast from '../components/Toast';
import ImportGuestModal from '../components/ImportGuestModal';

export default function GuestList() {
  const { guests, setGuests, fetchGuests, currentEvent, isOnline } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  // Modals state
  const [selectedGuestForCheckIn, setSelectedGuestForCheckIn] = useState(null);
  const [selectedGuestForEdit, setSelectedGuestForEdit] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

  // Offline sync callback — called after each queued item is sent to server
  const handleSynced = useCallback(({ type, data, tempId }) => {
    if (type === 'check-in') {
      setGuests(prev => prev.map(g => g.id === data.id ? data : g));
    } else if (type === 'manual-check-in') {
      setGuests(prev => prev.map(g => g.id === tempId ? data : g));
    } else if (type === 'update-check-in') {
      setGuests(prev => prev.map(g => g.id === data.id ? data : g));
    } else if (type === 'undo-check-in') {
      // data.deleted_guest means walk-in guest was removed; data.data has reverted guest
      if (data.deleted_guest) {
        setGuests(prev => prev.filter(g => g.id !== data.data?.id));
      } else if (data.data) {
        setGuests(prev => prev.map(g => g.id === data.data.id ? data.data : g));
      }
    }
  }, [setGuests]);

  useOfflineQueue({ isOnline, onSync: handleSynced, api });

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown size={13} className="text-slate-400 ml-1 inline" />;
    return sortConfig.dir === 'asc'
      ? <ArrowUp size={13} className="text-blue-600 ml-1 inline" />
      : <ArrowDown size={13} className="text-blue-600 ml-1 inline" />;
  };

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleCheckIn = async (guestId, pax) => {
    // Optimistic update regardless of online status
    const optimisticGuest = {
      ...guests.find(g => g.id === guestId),
      is_attended: true,
      attendance: { pax, check_in_time: new Date().toISOString() },
    };
    setGuests(prev => prev.map(g => g.id === guestId ? optimisticGuest : g));
    setSelectedGuestForCheckIn(null);
    setSearchQuery('');

    if (!isOnline) {
      enqueue({ id: `co-${guestId}-${Date.now()}`, type: 'check-in', guest_id: guestId, pax });
      triggerToast(`${optimisticGuest.name} hadir (offline — akan disinkronkan)`);
      return;
    }

    try {
      const response = await api.post('/check-in', { guest_id: guestId, pax });
      const checkedInGuest = response.data.data;
      setGuests(prev => prev.map(g => g.id === guestId ? checkedInGuest : g));
      triggerToast(`${checkedInGuest.name} berhasil hadir!`);
    } catch (error) {
      if (!error.response) {
        // Network error — keep optimistic state and queue
        enqueue({ id: `co-${guestId}-${Date.now()}`, type: 'check-in', guest_id: guestId, pax });
        triggerToast(`${optimisticGuest.name} hadir (offline — akan disinkronkan)`);
      } else {
        // Server error — rollback
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, is_attended: false, attendance: null } : g));
        alert(error.response.data?.message || 'Check-in gagal.');
      }
    }
  };

  const handleManualCheckIn = async (name, pax, address) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticGuest = {
      id: tempId,
      name,
      pax,
      address,
      category: 'Walk-in',
      is_attended: true,
      attendance: { pax, check_in_time: new Date().toISOString() },
    };

    setGuests(prev => [...prev, optimisticGuest]);
    setIsManualModalOpen(false);
    setSearchQuery('');

    if (!isOnline) {
      enqueue({ id: `mc-${Date.now()}`, type: 'manual-check-in', name, pax, address, tempId });
      triggerToast(`${name} didaftarkan (offline — akan disinkronkan)`);
      return;
    }

    try {
      const response = await api.post('/manual-check-in', { name, pax, address });
      const newGuest = response.data.data;
      setGuests(prev => prev.map(g => g.id === tempId ? newGuest : g));
      triggerToast(`${newGuest.name} didaftarkan & hadir!`);
    } catch (error) {
      if (!error.response) {
        // Network error — keep optimistic and queue
        enqueue({ id: `mc-${Date.now()}`, type: 'manual-check-in', name, pax, address, tempId });
        triggerToast(`${name} didaftarkan (offline — akan disinkronkan)`);
      } else {
        setGuests(prev => prev.filter(g => g.id !== tempId));
        alert(error.response.data?.message || 'Manual check-in gagal.');
      }
    }
  };

  const handleUpdateCheckIn = async (guestId, pax) => {
    const originalGuest = guests.find(g => g.id === guestId);
    // Optimistic update
    setGuests(prev => prev.map(g =>
      g.id === guestId ? { ...g, attendance: { ...g.attendance, pax } } : g
    ));
    setSelectedGuestForEdit(null);

    if (!isOnline) {
      enqueue({ id: `uc-${guestId}-${Date.now()}`, type: 'update-check-in', guest_id: guestId, pax });
      triggerToast(`Jumlah orang diperbarui (offline — akan disinkronkan)`);
      return;
    }

    try {
      const response = await api.put(`/check-in/${guestId}`, { pax });
      const updatedGuest = response.data.data;
      setGuests(prev => prev.map(g => g.id === guestId ? updatedGuest : g));
      triggerToast(`Jumlah orang untuk ${updatedGuest.name} diperbarui!`);
    } catch (error) {
      if (!error.response) {
        // Network error — keep optimistic and queue
        enqueue({ id: `uc-${guestId}-${Date.now()}`, type: 'update-check-in', guest_id: guestId, pax });
        triggerToast('Jumlah orang diperbarui (offline — akan disinkronkan)');
      } else {
        if (originalGuest) setGuests(prev => prev.map(g => g.id === guestId ? originalGuest : g));
        alert(error.response.data?.message || 'Update gagal.');
      }
    }
  };

  const handleUndoCheckIn = async (guestId) => {
    const originalGuest = guests.find(g => g.id === guestId);
    const isWalkIn = originalGuest?.category === 'Walk-in';

    // Optimistic update: mark as not attended (or hide if walk-in)
    if (isWalkIn) {
      setGuests(prev => prev.filter(g => g.id !== guestId));
    } else {
      setGuests(prev => prev.map(g =>
        g.id === guestId ? { ...g, is_attended: false, attendance: null } : g
      ));
    }
    setSelectedGuestForEdit(null);

    if (!isOnline) {
      enqueue({ id: `ud-${guestId}-${Date.now()}`, type: 'undo-check-in', guest_id: guestId });
      triggerToast('Kehadiran dibatalkan (offline — akan disinkronkan)');
      return;
    }

    try {
      const response = await api.delete(`/check-in/${guestId}`);
      if (!response.data.deleted_guest) {
        const revertedGuest = response.data.data;
        setGuests(prev => prev.map(g => g.id === guestId ? revertedGuest : g));
      }
      triggerToast('Kehadiran berhasil dibatalkan.');
    } catch (error) {
      if (!error.response) {
        // Network error — keep optimistic and queue
        enqueue({ id: `ud-${guestId}-${Date.now()}`, type: 'undo-check-in', guest_id: guestId });
        triggerToast('Kehadiran dibatalkan (offline — akan disinkronkan)');
      } else {
        // Server error — rollback optimistic update
        if (originalGuest) {
          if (isWalkIn) {
            setGuests(prev => [...prev, originalGuest]);
          } else {
            setGuests(prev => prev.map(g => g.id === guestId ? originalGuest : g));
          }
        }
        alert(error.response.data?.message || 'Batal kehadiran gagal.');
      }
    }
  };

  // Client-side filtering + sorting
  const filteredGuests = useMemo(() => {
    let result = guests.filter(g => {
      const matchName = g.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter ? g.category === categoryFilter : true;
      return matchName && matchCategory;
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const valA = (a[sortConfig.key] ?? '').toString().toLowerCase();
        const valB = (b[sortConfig.key] ?? '').toString().toLowerCase();
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [guests, searchQuery, categoryFilter, sortConfig]);

  // Export kehadiran ke Excel
  const handleExportExcel = () => {
    const eventName = currentEvent?.title || 'Event';
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    // Ringkasan statistik
    const totalTamu = guests.length;
    const totalHadir = guests.filter(g => g.is_attended).length;
    const totalPax = guests.reduce((sum, g) => sum + (g.attendance?.pax || 0), 0);
    const totalBelum = totalTamu - totalHadir;

    // Baris data tamu
    const rows = guests.map((g, idx) => ({
      'No': idx + 1,
      'Nama': g.name,
      'Kategori': g.category || '-',
      'Alamat': g.address || '-',
      'Status': g.is_attended ? 'Hadir' : 'Belum Hadir',
      'Jml. Orang': g.attendance?.pax || '-',
      'Waktu Check-in': g.attendance?.check_in_time
        ? new Date(g.attendance.check_in_time).toLocaleString('id-ID')
        : '-',
    }));

    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Tamu
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 30 }, // Nama
      { wch: 12 }, // Kategori
      { wch: 35 }, // Alamat
      { wch: 14 }, // Status
      { wch: 12 }, // Jml. Orang
      { wch: 22 }, // Waktu Check-in
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran Tamu');

    // Sheet 2: Ringkasan
    const summaryData = [
      ['Laporan Kehadiran Tamu'],
      ['Event', eventName],
      ['Tanggal Cetak', now.toLocaleString('id-ID')],
      [],
      ['Total Undangan', totalTamu],
      ['Total Hadir', totalHadir],
      ['Total Belum Hadir', totalBelum],
      ['Total Tamu Hadir (Pax)', totalPax],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    XLSX.writeFile(wb, `Kehadiran_${eventName}_${dateStr}.xlsx`);
    triggerToast('Data kehadiran berhasil diekspor!');
  };

  return (
    <div className="flex flex-col h-full">
      <Toast
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />

      <header className="mb-6 mt-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">Daftar Tamu</h1>
          <p className="text-slate-500">Cari tamu dan tandai kehadiran</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="btn-outline flex items-center gap-2"
          >
            <FileDown size={18} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn-outline flex items-center gap-2"
          >
            <FileUp size={18} />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>Tamu Manual</span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-4 animate-fade-in-up">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-400" size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama tamu..."
          className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl py-3 pl-12 pr-6 text-base md:text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="md:hidden flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="flex-1 btn-outline flex items-center justify-center gap-2"
        >
          <FileDown size={18} />
          <span>Export</span>
        </button>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex-1 btn-outline flex items-center justify-center gap-2"
        >
          <FileUp size={18} />
          <span>Import</span>
        </button>
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          <span>Manual</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto pb-20">
        {filteredGuests.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    className="p-4 text-slate-700 font-semibold text-sm cursor-pointer select-none hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Nama <SortIcon colKey="name" />
                  </th>
                  <th
                    className="p-4 text-slate-700 font-semibold text-sm cursor-pointer select-none hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    Kategori <SortIcon colKey="category" />
                  </th>
                  <th className="p-4 text-slate-700 font-semibold text-sm hidden md:table-cell">Alamat</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-center">Jml. Orang</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map(guest => (
                  <tr
                    key={guest.id}
                    className={`border-b border-slate-100 transition-colors ${guest.is_attended ? 'bg-green-50/60' : 'hover:bg-slate-50'
                      }`}
                  >
                    {/* Nama */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-900">{guest.name}</span>
                      {guest.is_attended && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} /> Hadir
                        </span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="p-4">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${guest.category === 'VIP'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : guest.category === 'Walk-in'
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {guest.category}
                      </span>
                    </td>

                    {/* Alamat */}
                    <td className="p-4 hidden md:table-cell">
                      {guest.address ? (
                        <span className="text-slate-600 text-sm flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          {guest.address}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Jumlah Orang */}
                    <td className="p-4 text-center">
                      {guest.is_attended ? (
                        <span className="font-bold text-slate-900 text-base">{guest.attendance?.pax}</span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="p-4 text-right">
                      {guest.is_attended ? (
                        <button
                          onClick={() => setSelectedGuestForEdit(guest)}
                          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedGuestForCheckIn(guest)}
                          className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
                        >
                          Hadir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center animate-fade-in py-20 glass-panel">
            <p className="text-xl text-slate-500">Tidak ada tamu yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedGuestForCheckIn && (
        <CheckInModal
          guest={selectedGuestForCheckIn}
          onClose={() => setSelectedGuestForCheckIn(null)}
          onConfirm={handleCheckIn}
        />
      )}

      {selectedGuestForEdit && (
        <EditCheckInModal
          guest={selectedGuestForEdit}
          onClose={() => setSelectedGuestForEdit(null)}
          onUpdate={handleUpdateCheckIn}
          onUndo={handleUndoCheckIn}
        />
      )}

      {isManualModalOpen && (
        <ManualCheckInModal
          onClose={() => setIsManualModalOpen(false)}
          onConfirm={handleManualCheckIn}
        />
      )}

      {isImportModalOpen && (
        <ImportGuestModal
          eventId={currentEvent?.id}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchGuests();
            triggerToast('Import tamu berhasil!');
          }}
        />
      )}
    </div>
  );
}
