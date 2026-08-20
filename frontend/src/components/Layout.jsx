import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Users, CheckSquare, LineChart, FileText,
  Settings, LogOut, LayoutDashboard, ChevronLeft, ChevronRight,
  Shield, Menu, Star, Bell, Briefcase, X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { getTerm } from '../config/businessTypes';

const WORKER_ROLES = ['STAFF', 'BRANCH_MANAGER'];

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { businesses, selectedBusiness, setSelectedBusiness } = useContext(BusinessContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);

  const isWorker = WORKER_ROLES.includes(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Main nav — workers see Worker Portal prominently
  const navItems = [
    { name: 'Dashboard',     path: '/',           icon: LayoutDashboard, end: true },
    ...(isWorker ? [{ name: 'Worker Portal', path: '/worker', icon: Star }] : []),
    { name: 'Businesses',    path: '/businesses', icon: Building2 },
    { name: getTerm(selectedBusiness?.type, 'branches'),      path: '/branches',   icon: MapPin },
    { name: getTerm(selectedBusiness?.type, 'clients'),       path: '/clients',    icon: Users },
    { name: 'Workflow',      path: '/workflow',   icon: CheckSquare },
    { name: 'Finance',       path: '/finance',    icon: LineChart },
    { name: 'Reports',       path: '/reports',    icon: FileText },
  ];

  const bottomItems = [
    ...(user?.role === 'SUPER_ADMIN' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const roleBadgeColor = {
    SUPER_ADMIN:    'bg-red-500/20 text-red-300',
    BUSINESS_ADMIN: 'bg-amber-500/20 text-amber-300',
    BRANCH_MANAGER: 'bg-violet-500/20 text-violet-300',
    STAFF:          'bg-emerald-500/20 text-emerald-300',
  }[user?.role] || 'bg-blue-500/20 text-blue-300';

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
          isActive
            ? 'text-white shadow-lg'
            : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
        } ${collapsed ? 'justify-center' : ''}`
      }
      style={({ isActive }) => isActive ? {
        background: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(99,102,241,0.85))',
        boxShadow: '0 4px 20px rgba(99,102,241,0.35)'
      } : {}}
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${
            isActive
              ? 'text-white'
              : item.name === 'Worker Portal'
              ? 'text-amber-400 group-hover:text-amber-300'
              : 'text-slate-400 group-hover:text-slate-200'
          }`} />
          {!collapsed && (
            <span className={`text-sm ${
              isActive ? 'font-semibold' :
              item.name === 'Worker Portal' && !isActive ? 'text-amber-300 group-hover:text-amber-200 font-medium' : 'font-medium'
            }`}>
              {item.name}
            </span>
          )}
          {isActive && !collapsed && (
            <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-white/[0.07] ${collapsed ? 'p-4 justify-center' : 'px-5 py-4'}`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shrink-0 relative"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 20px rgba(99,102,241,0.55)' }}
        >
          B
        </div>
        {!collapsed && (
          <div>
            <span className="text-[15px] font-extrabold text-white tracking-tight">BMS Pro</span>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Business Management</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.name} item={item} />)}
      </div>

      {/* Bottom Nav */}
      <div className="px-3 pb-3 space-y-0.5 border-t border-white/8 pt-3">
        {bottomItems.map(item => <NavItem key={item.name} item={item} />)}
      </div>

      {/* User Profile */}
      <div className="border-t border-white/[0.07] p-3">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl mb-1 ${collapsed ? 'justify-center' : 'bg-white/[0.04]'}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleBadgeColor}`}>
                {user?.role}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#eef2f9] font-sans overflow-hidden">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(170deg, #090e1f 0%, #0f172a 40%, #1a2540 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'} relative shrink-0 z-30`}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 border-r border-white/[0.07]" style={{ background: 'linear-gradient(170deg, #090e1f 0%, #0f172a 40%, #1a2540 100%)' }} />
        {/* Subtle radial glow at top */}
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15), transparent 70%)' }} />
        <div className="relative z-10 flex flex-col h-full text-white">
          <SidebarContent />
        </div>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[88px] w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg z-20 hover:scale-110"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Floating Header */}
        <div className="px-6 pt-4 pb-2 shrink-0 z-10">
          <header className="bg-glass rounded-2xl px-5 py-3 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-white/90">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100/50 text-gray-600 transition-colors">
                <Menu className="w-5 h-5" />
              </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 hidden sm:block uppercase tracking-wide">Active Business</span>
              {businesses.length > 0 ? (
                <select
                  className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 transition-colors font-semibold max-w-[220px]"
                  value={selectedBusiness?.id || ''}
                  onChange={e => {
                    const b = businesses.find(b => b.id === e.target.value);
                    setSelectedBusiness(b);
                  }}
                >
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  No Business Selected
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  style={{ animation: 'fadeInUp 0.2s ease' }}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-sm">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { icon: '📊', text: 'Dashboard loaded successfully', time: 'Just now' },
                      { icon: '✅', text: 'System is up and running', time: 'Today' },
                      { icon: '💡', text: 'Add a business to get started', time: 'Tip' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="text-lg shrink-0">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{n.text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
          </header>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto px-6 pb-6 lg:px-8 lg:pb-8 pt-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
