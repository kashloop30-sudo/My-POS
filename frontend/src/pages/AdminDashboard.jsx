import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Users, Building2, MapPin, CheckSquare, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, BarChart3, Globe, RefreshCw
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import { useToast } from '../components/Toast';

const AdminDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const toast = useToast();
  const [stats, setStats]           = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchAdminData(); }, [token]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const bizRes = await axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bizList = bizRes.data;
      setBusinesses(bizList);

      let totalIncome = 0, totalExpense = 0, totalClients = 0, totalTasks = 0, totalBranches = 0;

      await Promise.all(bizList.map(async (biz) => {
        try {
          const [summaryRes, branchRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/finances/summary?businessId=${biz.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/branches?businessId=${biz.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          totalIncome   += summaryRes.data.totalIncome  || 0;
          totalExpense  += summaryRes.data.totalExpense || 0;
          totalClients  += summaryRes.data.totalClients || 0;
          totalTasks    += summaryRes.data.activeTasks  || 0;
          totalBranches += branchRes.data.length        || 0;
        } catch { /* skip */ }
      }));

      setStats({ totalBusinesses: bizList.length, totalBranches, totalClients, totalTasks, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-red-100">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">Super Admin privileges required.</p>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Businesses',    value: stats.totalBusinesses, icon: Building2,   gradient: 'from-blue-400 to-blue-600',     shadow: 'rgba(59,130,246,0.32)' },
    { label: 'Branches',      value: stats.totalBranches,   icon: MapPin,       gradient: 'from-violet-400 to-violet-600',  shadow: 'rgba(139,92,246,0.32)' },
    { label: 'Total Clients', value: stats.totalClients,    icon: Users,        gradient: 'from-emerald-400 to-emerald-600',shadow: 'rgba(16,185,129,0.32)' },
    { label: 'Active Tasks',  value: stats.totalTasks,      icon: CheckSquare,  gradient: 'from-orange-400 to-orange-600',  shadow: 'rgba(249,115,22,0.32)' },
    { label: 'Revenue',       value: `$${stats.totalIncome.toLocaleString()}`,  icon: TrendingUp,   gradient: 'from-teal-400 to-green-500',     shadow: 'rgba(20,184,166,0.32)' },
    { label: 'Expenses',      value: `$${stats.totalExpense.toLocaleString()}`, icon: TrendingDown, gradient: 'from-rose-400 to-red-500',        shadow: 'rgba(244,63,94,0.32)' },
  ] : [];

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform-wide overview across all businesses</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-200">
            <Globe className="w-4 h-4" />
            <span className="font-semibold text-sm">Super Admin</span>
          </div>
        </div>
      </div>

      {/* Net Profit Banner */}
      {!loading && stats && (
        <div
          className={`rounded-2xl p-6 flex items-center justify-between relative overflow-hidden
          bg-gradient-to-r ${stats.netProfit >= 0 ? 'from-emerald-600 to-teal-500' : 'from-red-600 to-rose-500'} text-white`}
          style={{ animation: 'fadeInUp 0.4s ease', boxShadow: stats.netProfit >= 0 ? '0 20px 56px rgba(16,185,129,0.30)' : '0 20px 56px rgba(239,68,68,0.30)' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-white/70 font-bold text-xs uppercase tracking-widest">Platform Net Profit</p>
            <p className="text-5xl font-extrabold mt-1">
              {stats.netProfit >= 0 ? '+' : '−'}${Math.abs(stats.netProfit).toLocaleString()}
            </p>
            <p className="text-white/50 text-xs mt-2">Across all businesses and branches</p>
          </div>
          <DollarSign className="w-24 h-24 text-white/10 relative" />
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <SkeletonCard count={6} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card"
              style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both` }}>
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 8px 24px ${card.shadow}` }}
              >
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-0.5 anim-count">{card.value ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Businesses Table */}
      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : (
        <div className="table-container">
          <div className="section-header">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              All Registered Businesses
            </h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {businesses.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5">#</th>
                  <th className="px-6 py-3.5">Business</th>
                  <th className="px-6 py-3.5">Industry</th>
                  <th className="px-6 py-3.5">Currency</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {businesses.map((biz, idx) => (
                  <tr key={biz.id} className="table-row">
                    <td className="px-6 py-4 text-gray-300 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {biz.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <p className="font-bold text-gray-900">{biz.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-violet">{biz.industry || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-600 bg-gray-50 rounded-lg">{biz.currency}</td>
                    <td className="px-6 py-4">
                      <span className="badge-green">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {businesses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      No businesses registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
