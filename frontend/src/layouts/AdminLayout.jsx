import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Menu, X, ShieldCheck, CalendarCheck } from 'lucide-react';
import api from '../services/api';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Beranda', path: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Manajemen Sistem', path: '/admin/manage', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-x-hidden">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
          {/* Logo desktop */}
          <div className="hidden md:flex items-center mb-8 overflow-hidden min-h-[3rem] gap-3">
            {isSidebarCollapsed ? (
              <div className="p-2 bg-blue-600 rounded-xl mx-auto">
                <ShieldCheck size={18} className="text-white" />
              </div>
            ) : (
              <>
                <div className="p-2 bg-blue-600 rounded-xl shrink-0">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <div className="whitespace-nowrap flex flex-col justify-center">
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Admin Panel</h2>
                  <p className="text-slate-500 text-sm mt-0.5 truncate max-w-[150px]">{user?.name}</p>
                </div>
              </>
            )}
          </div>

          {/* Logo mobile */}
          <div className="md:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <ShieldCheck size={16} className="text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Admin Panel</h2>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.end}
                  onClick={() => setIsSidebarOpen(false)}
                  title={isSidebarCollapsed ? link.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
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

        {/* Bottom actions */}
        <div className="p-6 space-y-2 flex flex-col">
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Log out' : undefined}
            className={`flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ${isSidebarCollapsed ? 'justify-center' : 'text-left'}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Log out</span>}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center gap-3 w-full px-4 py-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors mt-4"
            title={isSidebarCollapsed ? 'Perbesar Sidebar' : 'Perkecil Sidebar'}
          >
            <Menu size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Kecilkan Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel m-4 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Admin Panel</h2>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 rounded-lg border border-slate-200 transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pt-0 md:pt-8 animate-fade-in-up flex flex-col w-full max-w-full overflow-hidden transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
