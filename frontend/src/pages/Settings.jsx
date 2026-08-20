import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { User, Bell, Shield, Palette, Globe, Save, Check, KeyRound } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [name, setName]               = useState(user?.name || '');
  const [email, setEmail]             = useState(user?.email || '');
  const [isSaving, setIsSaving]       = useState(false);
  const [activeTab, setActiveTab]     = useState('profile');

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Profile settings updated!');
    }, 600);
  };

  return (
    <div className="max-w-4xl space-y-8 page-enter">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences, system security, and workspace settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="section-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Personal Profile</h2>
              <p className="text-xs text-gray-400">Update your account credentials and public name</p>
            </div>
          </div>
          <span className="badge-blue font-semibold">{user?.role || 'STAFF'}</span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shrink-0"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 28px rgba(99,102,241,0.40)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                className="input-base"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                className="input-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? <><span className="spinner" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', boxShadow: '0 6px 18px rgba(139,92,246,0.30)' }}>
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">System Notifications</h3>
            <p className="text-xs text-gray-400 mb-4">Control how you receive alerts and reports.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
              <span className="text-xs font-semibold text-gray-700">Email digest alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#34d399,#10b981)', boxShadow: '0 6px 18px rgba(16,185,129,0.30)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Password & Security</h3>
            <p className="text-xs text-gray-400 mb-4">Manage multi-factor auth and credentials.</p>
            <button 
              type="button"
              onClick={() => toast.info('Password reset link sent to your email')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Change Password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 6px 18px rgba(245,158,11,0.30)' }}>
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Interface Theme</h3>
            <p className="text-xs text-gray-400 mb-3">Adjust visual appearance.</p>
            <div className="flex gap-2">
              {['Light', 'System'].map((t, idx) => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => toast.info(`Theme set to ${t}`)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all ${
                    idx === 0 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)', boxShadow: '0 6px 18px rgba(14,165,233,0.28)' }}>
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Language & Region</h3>
            <p className="text-xs text-gray-400 mb-3">Set language and date format.</p>
            <select className="input-base text-xs py-2">
              <option>English (US) - Default</option>
              <option>English (UK)</option>
              <option>Swahili</option>
            </select>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pb-4 font-medium">
        BMS Pro Enterprise v2.0 &bull; Designed for High-Performance Business Operations
      </div>
    </div>
  );
};

export default Settings;
