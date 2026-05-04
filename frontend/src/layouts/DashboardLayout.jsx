import React, { useState, useEffect, useRef, Fragment } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, LogOut, Loader2, Menu, X, Settings, WifiOff } from 'lucide-react';
import api from '../services/api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function DashboardLayout() {
  const [guests, setGuests] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useNetworkStatus();

  const navigate = useNavigate();
  const location = useLocation();
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const prevIsOnlineRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'admin' && !user?.event_id) {
      navigate('/admin/dashboard');
      return;
    }
    fetchGuests();
  }, [user?.event_id]);

  // Re-fetch automatically when coming back online
  useEffect(() => {
    const wasOffline = prevIsOnlineRef.current === false;
    prevIsOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      fetchGuests();
    }
  }, [isOnline]);

  const CACHE_KEY = `guests_cache_${user?.event_id}`;

  const fetchGuests = async () => {
    // If we have a cache, load it immediately so the UI isn't blank
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { guests: cachedGuests, event: cachedEvent } = JSON.parse(cached);
      setGuests(cachedGuests);
      setCurrentEvent(cachedEvent);
      setLoading(false); // show cached data right away
    }

    try {
      const response = await api.get('/guests');
      const data = response.data.data;
      const event = response.data.event;
      setGuests(data);
      setCurrentEvent(event);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ guests: data, event }));
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }
      // Network error: cached data already shown above, just log
      console.error('Failed to fetch guests (will use cache)', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop/Tablet mini-sidebar
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (name, e) => {
    e.preventDefault();
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false); // Auto expand if they click a dropdown while collapsed
    }
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navLinks = [
    { name: 'Beranda', path: '/dashboard/home', icon: Home },
    {
      name: 'Daftar Tamu',
      path: '/dashboard/guests',
      icon: Users,
      subItems: [
        { name: 'Semua Tamu', path: '/dashboard/guests' },
        { name: 'VIP', path: '/dashboard/guests?category=VIP' },
        { name: 'Regular', path: '/dashboard/guests?category=Regular' },
      ]
    },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin Panel', path: '/admin/dashboard', icon: Settings });
  }

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <Fragment>
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-x-hidden">
      {/* Mobile Header (Hidden on md and above) */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel m-4 z-20">
        <div>
          <h2 className="text-xl font-bold text-blue-600 leading-none">Guestbook</h2>
          <p className="text-slate-500 text-xs mt-1 truncate max-w-[200px]">{user?.name}</p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-4 left-4 bottom-4 md:bottom-auto md:left-auto
        ${isSidebarCollapsed ? 'w-[88px]' : 'w-[280px] md:w-64'} h-[calc(100vh-32px)] glass-panel md:my-4 md:ml-4 
        flex flex-col justify-between shrink-0 z-40 overflow-y-auto overflow-x-hidden
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[150%] md:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="hidden md:flex items-center mb-8 overflow-hidden min-h-[3rem]">
            {isSidebarCollapsed ? (
              <h2 className="text-2xl font-bold text-blue-600 mx-auto">G</h2>
            ) : (
              <div className="whitespace-nowrap flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-blue-600 mb-1">Guestbook</h2>
                <p className="text-slate-500 text-sm truncate max-w-[180px]">{user?.name}</p>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-blue-600">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;

              if (link.subItems) {
                const isDropdownOpen = openDropdowns[link.name] && !isSidebarCollapsed;
                const isChildActive = link.subItems.some(sub => {
                  const [path, search] = sub.path.split('?');
                  return location.pathname === path && (location.search === `?${search}` || (!search && !location.search));
                });

                return (
                  <div key={link.name} className="space-y-1">
                    <button
                      onClick={(e) => toggleDropdown(link.name, e)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isChildActive || isDropdownOpen
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      title={isSidebarCollapsed ? link.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="shrink-0" />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                      )}
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen && !isSidebarCollapsed ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-11 pr-4 py-2 space-y-2">
                        {link.subItems.map(sub => {
                          const [path, search] = sub.path.split('?');
                          const isActive = location.pathname === path && (location.search === `?${search}` || (!search && !location.search));

                          return (
                            <NavLink
                              key={sub.name}
                              to={sub.path}
                              onClick={() => {
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                              }}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all duration-300 whitespace-nowrap ${isActive
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200 font-medium shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                              {sub.name}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => {
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? link.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-6 space-y-2 flex flex-col">
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Log out" : undefined}
            className={`flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ${isSidebarCollapsed ? 'justify-center' : 'text-left'
              }`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Log out</span>}
          </button>

          {/* Toggle Button for Desktop/Tablet below logout */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center gap-3 w-full px-4 py-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors mt-4"
            title={isSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            <Menu size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Kecilkan Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Offline banner — fixed at TOP so it's always visible on mobile/tablet */}
      {!isOnline && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white text-sm font-semibold shadow-xl"
        >
          <WifiOff size={16} className="animate-pulse shrink-0" />
          <span>⚠️ Anda sedang offline — check-in tersimpan, akan dikirim saat online kembali</span>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className="flex-1 p-4 md:p-8 pt-0 md:pt-8 animate-fade-in-up flex flex-col w-full max-w-full overflow-hidden transition-all duration-300"
        style={!isOnline ? { paddingTop: '3rem' } : {}}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <Outlet context={{ guests, setGuests, fetchGuests, currentEvent, isOnline }} />
        )}
      </main>
    </div>
    </Fragment>
  );
}
