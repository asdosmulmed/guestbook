import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, UserCheck, UsersRound,
  Loader2, ChevronRight, Activity, TrendingUp
} from 'lucide-react';
import api from '../services/api';

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div className="glass-panel p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-slate-900 text-3xl font-bold mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard/home');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterEvent = async (eventId) => {
    try {
      const res = await api.post('/admin/set-event', { event_id: eventId });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard/home');
    } catch (err) {
      console.error('Failed to set event', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const { summary, events } = stats ?? { summary: {}, events: [] };

  const attendanceRate = summary.total_guests > 0
    ? Math.round((summary.total_attended / summary.total_guests) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full animate-fade-in">

      {/* Header */}
      <header className="mb-8 mt-2">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={14} className="text-blue-500" />
          <span className="text-blue-500 text-xs font-semibold uppercase tracking-widest">Overview</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Selamat datang, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Pantau keseluruhan sistem buku tamu digital Anda</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Calendar}
          label="Total Event"
          value={summary.total_events}
          sub={`${summary.total_active} aktif`}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={UsersRound}
          label="Total Undangan"
          value={summary.total_guests}
          sub="Semua event"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          icon={UserCheck}
          label="Total Hadir"
          value={summary.total_attended}
          sub={`${attendanceRate}% tingkat kehadiran`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Petugas"
          value={summary.total_receptionists}
          sub="Receptionist terdaftar"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Events Table */}
      <div className="glass-panel overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-slate-900 font-bold text-lg">Daftar Event</h2>
            <p className="text-slate-400 text-sm mt-0.5">Klik "Masuk" untuk mengelola tamu event tersebut</p>
          </div>
          <button
            onClick={() => navigate('/admin/manage')}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <TrendingUp size={15} />
            Kelola Sistem
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {events.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-slate-700 font-semibold text-sm">Event</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm hidden md:table-cell">Tanggal</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-center">Undangan</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-center hidden sm:table-cell">Hadir</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-center hidden md:table-cell">Kehadiran</th>
                  <th className="p-4 text-slate-700 font-semibold text-sm text-center hidden sm:table-cell">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-slate-900">{event.title}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-slate-500 text-sm">
                      {new Date(event.event_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-center font-medium text-slate-700">{event.guests_count}</td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <span className="text-emerald-600 font-semibold">{event.attended_count}</span>
                    </td>
                    <td className="p-4 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${event.attendance_rate}%` }}
                          />
                        </div>
                        <span className="text-slate-600 text-sm font-medium">{event.attendance_rate}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${
                        event.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {event.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEnterEvent(event.id)}
                        className="flex items-center gap-1.5 ml-auto px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Masuk <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-slate-500 text-lg">Belum ada event.</p>
              <button
                onClick={() => navigate('/admin/manage')}
                className="mt-4 btn-primary"
              >
                Buat Event Baru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
