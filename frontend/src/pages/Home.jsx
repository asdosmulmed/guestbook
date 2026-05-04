import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, UserCheck, UserX } from 'lucide-react';

export default function Home() {
  const { guests, currentEvent } = useOutletContext();

  const totalGuests = guests.length;
  const attendedGuests = guests.filter(g => g.is_attended).length;
  const missingGuests = totalGuests - attendedGuests;

  const stats = [
    { label: 'Total Tamu Undangan', value: totalGuests, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Hadir', value: attendedGuests, icon: UserCheck, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Tidak Hadir', value: missingGuests, icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <header className="mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Beranda</h1>
        <p className="text-slate-500 text-lg">
          {currentEvent ? `Event: ${currentEvent.title}` : 'Ringkasan kehadiran tamu secara real-time'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel p-6 flex items-center gap-6 hover:scale-[1.02] transition-transform">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color}`}>
                <Icon size={32} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 glass-panel p-8 flex-1">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Informasi Acara</h2>
        <p className="text-slate-700 leading-relaxed">
          Selamat datang di sistem buku tamu digital. Melalui panel ini, Anda dapat memantau status kehadiran seluruh tamu undangan. 
          Gunakan menu <strong>Daftar Tamu</strong> di sebelah kiri untuk mencari tamu, menandai kehadiran ("Hadir"), mendaftarkan tamu baru secara manual, maupun mengubah data kehadiran apabila terjadi kesalahan.
        </p>
      </div>
    </div>
  );
}
