import React, { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Shield, Home, Link2, Video, FileText, FolderOpen, Users, Share2,
  Activity, Settings, LogOut, Sun, Moon, Monitor, Menu, X, Search, ChevronDown
} from 'lucide-react';
import { GlassButton, Dropdown } from './ui';

// Theme Switcher
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const icons = { dark: <Moon size={14} />, light: <Sun size={14} />, system: <Monitor size={14} /> };

  return (
    <Dropdown
      trigger={
        <button className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors">
          {icons[theme]}
        </button>
      }
      items={[
        { label: 'Dark', icon: <Moon size={14} />, onClick: () => setTheme('dark') },
        { label: 'Light', icon: <Sun size={14} />, onClick: () => setTheme('light') },
        { label: 'System', icon: <Monitor size={14} />, onClick: () => setTheme('system') },
      ]}
    />
  );
}

// Public Header
export function PublicHeader() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-subtle">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <img src="/Logo.png" alt="Personal Vault" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-lg font-semibold text-primary">Personal Vault</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">Home</Link>
          <Link to="/links" className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">Links</Link>
          <Link to="/videos" className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">Videos</Link>
          <Link to="/notes" className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">Notes</Link>
          <Link to="/files" className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">Files</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-white/5 transition-colors">
            <Search size={18} />
          </button>
          <ThemeSwitcher />
          {role === 'anonymous' && (
            <GlassButton size="sm" onClick={() => navigate('/login')}>Sign In</GlassButton>
          )}
          {role === 'member' && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">
                  Account <ChevronDown size={14} />
                </button>
              }
              items={[
                { label: 'My Account', icon: <Shield size={14} />, onClick: () => navigate('/account') },
                { label: 'Logout', icon: <LogOut size={14} />, onClick: () => { logout(); navigate('/'); } },
              ]}
            />
          )}
          {role === 'admin' && (
            <GlassButton size="sm" onClick={() => navigate('/admin')}>Admin</GlassButton>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-subtle px-4 py-3 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search public content..."
              className="input-field"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}

// Admin Sidebar
export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: <Home size={18} />, label: 'Dashboard' },
    { path: '/admin/items', icon: <FolderOpen size={18} />, label: 'All Items' },
    { path: '/admin/links', icon: <Link2 size={18} />, label: 'Links' },
    { path: '/admin/videos', icon: <Video size={18} />, label: 'Videos' },
    { path: '/admin/notes', icon: <FileText size={18} />, label: 'Notes' },
    { path: '/admin/files', icon: <FolderOpen size={18} />, label: 'Files' },
    { path: '/admin/members', icon: <Users size={18} />, label: 'Members' },
    { path: '/admin/shares', icon: <Share2 size={18} />, label: 'Share Links' },
    { path: '/admin/activity', icon: <Activity size={18} />, label: 'Activity' },
    { path: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-subtle">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <img src="/Logo.png" alt="Personal Vault" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Personal Vault</p>
            <p className="text-xs text-muted">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary hover:bg-white/5'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-subtle space-y-1">
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors">
          <Home size={18} /> View Site
        </Link>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-strong rounded-xl"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 glass-strong border-r border-subtle transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <SidebarContent />
      </aside>
    </>
  );
}

// Admin Layout
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-gradient-mesh" />
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen relative z-10">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Public Layout
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-gradient-mesh" />
      <PublicHeader />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
