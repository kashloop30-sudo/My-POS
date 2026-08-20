import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign, Users, CheckSquare, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (selectedBusiness && token) {
      fetchSummary();
      fetchChartData();
    }
  }, [selectedBusiness, token]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/finances/summary?businessId=${selectedBusiness.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/finances?businessId=${selectedBusiness.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aggregated = {};
      res.data.forEach(f => {
        const month = new Date(f.date).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!aggregated[month]) aggregated[month] = { name: month, Income: 0, Expense: 0 };
        if (f.type === 'INCOME') aggregated[month].Income += f.amount;
        else aggregated[month].Expense += f.amount;
      });
      setChartData(Object.values(aggregated).reverse());
    } catch { /* noop */ }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <LayoutDashboard className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Welcome to BMS Pro</h2>
        <p className="text-gray-500 mt-2">Create or select a business from the top dropdown to view your dashboard.</p>
      </div>
    );
  }

  const currency = selectedBusiness.currency;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const cards = summary ? [
    { label: 'Total Income',  value: `${currency} ${summary.totalIncome.toLocaleString()}`,  icon: TrendingUp,   bg: 'bg-emerald-50', iconColor: 'text-emerald-600', trend: '+12%', up: true },
    { label: 'Total Expense', value: `${currency} ${summary.totalExpense.toLocaleString()}`, icon: TrendingDown, bg: 'bg-red-50',     iconColor: 'text-red-500',    trend: 'All branches', up: null },
    { label: 'Total Clients', value: summary.totalClients,                                   icon: Users,        bg: 'bg-blue-50',    iconColor: 'text-blue-600',   trend: 'Customers', up: null },
    { label: 'Active Tasks',  value: summary.activeTasks,                                    icon: CheckSquare,  bg: 'bg-amber-50',   iconColor: 'text-amber-500',  trend: 'Pending', up: null },
  ] : [];

  return (
    <div className="space-y-7 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Good {greeting} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with{' '}
          <span className="font-semibold text-blue-600">{selectedBusiness.name}</span> today.
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ animation: `fadeInUp 0.4s ease ${i * 0.08}s both` }}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{card.label}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate anim-count">{card.value}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {card.up !== null && (
                    <ArrowUpRight className={`w-3 h-3 ${card.up ? 'text-emerald-500' : 'text-red-400 rotate-90'}`} />
                  )}
                  <p className={`text-xs truncate ${card.up ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{card.trend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Charts */}
      {!loading && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Income vs Expense</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">Monthly</span>
            </div>
            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F87171" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip
                      cursor={{ stroke: '#F3F4F6', strokeWidth: 2, fill: 'transparent' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,.12)', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Expense" stroke="#F87171" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No financial data yet — add some records in Finance.
                </div>
              )}
            </div>
          </div>

          {/* Net Profit card */}
          <div className={`rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg
            ${summary.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-500 to-green-600'
              : 'bg-gradient-to-br from-red-500 to-rose-600'
            } text-white`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <p className="text-green-100 font-semibold text-sm mb-1">Net Profit</p>
            <p className="text-4xl font-extrabold">
              {summary.netProfit >= 0 ? '+' : '−'}{currency} {Math.abs(summary.netProfit).toLocaleString()}
            </p>
            <p className="text-white/60 text-xs mt-3">Total revenue minus expenses across all branches</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
