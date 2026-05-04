import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState(null);
  const navigate = useNavigate();

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    // Only admins should be here
    if (user?.role !== 'admin') {
      navigate('/dashboard/home');
      return;
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/admin/events');
      setEvents(response.data.data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (eventId) => {
    setSelectingId(eventId);
    try {
      const response = await api.post('/admin/set-event', { event_id: eventId });
      // Update the user in localStorage with the new event_id
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Navigate to the dashboard
      navigate('/dashboard/home');
    } catch (error) {
      console.error("Failed to set event", error);
      alert("Gagal memilih event.");
    } finally {
      setSelectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-12">
      <div className="max-w-4xl w-full mx-auto animate-fade-in-up">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Pilih Event</h1>
          <p className="text-slate-500 text-lg">Silakan pilih event yang ingin Anda kelola sebagai Super Admin.</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {events.length > 0 ? (
            events.map((event) => (
              <div 
                key={event.id}
                onClick={() => handleSelectEvent(event.id)}
                className={`glass-panel p-8 cursor-pointer transition-all duration-300 group
                  ${event.is_active ? 'hover:border-champagne/50 hover:bg-white/5' : 'opacity-70 grayscale'}
                  ${selectingId === event.id ? 'scale-95 opacity-50' : 'hover:scale-[1.02]'}
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Calendar size={28} />
                  </div>
                  {!event.is_active && (
                    <span className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                      Nonaktif
                    </span>
                  )}
                  {event.is_active && user?.event_id === event.id && (
                    <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                      Aktif Saat Ini
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h2>
                <p className="text-slate-500 mb-6">
                  {new Date(event.event_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:underline">
                  <span>Masuk ke Event</span>
                  <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-12 glass-panel">
              <p className="text-slate-500 text-xl">Belum ada event yang terdaftar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
