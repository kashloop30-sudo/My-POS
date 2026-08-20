import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';
import { FileText, Download, BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();
  const [finances, setFinances] = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (selectedBusiness && token) fetchData();
  }, [selectedBusiness, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [finRes, clientRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/finances?businessId=${selectedBusiness.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/clients?businessId=${selectedBusiness.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setFinances(finRes.data);
      setClients(clientRes.data);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const wb = XLSX.utils.book_new();

    // Finance sheet
    const finData = finances.map(f => ({
      Type: f.type,
      Category: f.category,
      Amount: f.amount,
      Branch: f.branch?.name,
      Date: new Date(f.date).toLocaleDateString()
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finData), 'Finances');

    // Clients sheet
    const clientData = clients.map(c => ({
      Name: c.name,
      Contact: c.contact,
      Branch: c.branch?.name,
      TotalSpend: c.totalSpend,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientData), 'Clients');

    XLSX.writeFile(wb, `${selectedBusiness?.name}_Report.xlsx`);
    toast.success('Full report exported to Excel!');
  };

  // Build monthly finance chart data
  const monthlyData = {};
  finances.forEach(f => {
    const month = new Date(f.date).toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyData[month]) monthlyData[month] = { name: month, Income: 0, Expense: 0 };
    if (f.type === 'INCOME') monthlyData[month].Income += f.amount;
    else monthlyData[month].Expense += f.amount;
  });
  const chartData = Object.values(monthlyData).reverse();

  // Category breakdown for pie chart
  const categoryMap = {};
  finances.forEach(f => {
    const key = f.category || 'Other';
    categoryMap[key] = (categoryMap[key] || 0) + f.amount;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const totalIncome  = finances.filter(f => f.type === 'INCOME').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'EXPENSE').reduce((s, f) => s + f.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Select a business to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            Executive Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Performance analytics for <span className="font-semibold text-blue-600">{selectedBusiness.name}</span>
          </p>
        </div>
        <button
          onClick={exportReport}
          className="btn-secondary"
        >
          <Download className="w-4 h-4" />
          Export Full Report (.xlsx)
        </button>
      </div>

      {/* Summary Tiles */}
      {loading ? (
        <SkeletonCard count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Income</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedBusiness.currency} {totalIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Expense</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedBusiness.currency} {totalExpense.toLocaleString()}</p>
            </div>
          </div>
          <div className={`rounded-2xl p-5 flex items-center gap-4 shadow-lg text-white ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">Net Profit</p>
              <p className="text-xl font-extrabold mt-0.5">{netProfit >= 0 ? '+' : '−'}{selectedBusiness.currency} {Math.abs(netProfit).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Monthly Income vs Expense
            </h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.1)' }} />
                    <Bar dataKey="Income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={26} />
                    <Bar dataKey="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No financial records to display chart.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-600" />
              Spend by Category
            </h3>
            <div className="h-64">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.1)' }} />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No expense category data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Clients Table */}
      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : (
        <div className="table-container">
          <div className="section-header">
            <h3 className="font-bold text-gray-900">Top Clients by Spend</h3>
            <span className="text-xs text-gray-400 font-semibold">Ranked by revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...clients].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 8).map((c, i) => (
                  <tr key={c.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.contact}</td>
                    <td className="px-6 py-4">
                      <span className="badge-blue">{c.branch?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900">
                      {selectedBusiness.currency} {c.totalSpend.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No client records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
