import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/Skeleton';
import { Plus, LineChart, TrendingUp, TrendingDown, Trash2, X } from 'lucide-react';

const Finance = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();

  const [finances, setFinances]   = useState([]);
  const [branches, setBranches]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData]   = useState({ type: 'INCOME', amount: '', category: '', date: '', branchId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBusiness && token) { fetchBranches(); fetchFinances(); }
  }, [selectedBusiness, token]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/branches?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, branchId: res.data[0].id }));
    } catch { /* noop */ }
  };

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/finances?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFinances(res.data);
    } catch {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this financial record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/finances/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFinances(prev => prev.filter(f => f.id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/finances', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchFinances();
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, amount: '', category: '', date: '' }));
      toast.success('Financial record added!');
    } catch {
      toast.error('Failed to add record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <LineChart className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Select a business to view finances.</p>
      </div>
    );
  }

  // Summary
  const totalIncome  = finances.filter(f => f.type === 'INCOME').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'EXPENSE').reduce((s, f) => s + f.amount, 0);
  const net = totalIncome - totalExpense;
  const currency = selectedBusiness.currency;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Financial Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">
            Income & expenses for{' '}
            <span className="font-semibold text-blue-600">{selectedBusiness.name}</span>
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Income',  value: `${currency} ${totalIncome.toLocaleString()}`,  icon: TrendingUp,   bg: 'from-emerald-500 to-green-600' },
          { label: 'Total Expense', value: `${currency} ${totalExpense.toLocaleString()}`, icon: TrendingDown, bg: 'from-red-500 to-rose-600' },
          { label: 'Net Balance',   value: `${net >= 0 ? '+' : '−'}${currency} ${Math.abs(net).toLocaleString()}`, icon: LineChart, bg: net >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-500' },
        ].map((c, i) => (
          <div key={i} className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg flex items-center gap-4`}
            style={{ animation: `fadeInUp 0.35s ease ${i * 0.07}s both` }}>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">{c.label}</p>
              <p className="text-xl font-extrabold mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {finances.map(record => (
                  <tr key={record.id} className="table-row group">
                    <td className="px-6 py-4">
                      {record.type === 'INCOME' ? (
                        <span className="badge-green">
                          <TrendingUp className="w-3 h-3" /> Income
                        </span>
                      ) : (
                        <span className="badge-red">
                          <TrendingDown className="w-3 h-3" /> Expense
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{record.category}</td>
                    <td className={`px-6 py-4 font-bold ${record.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {record.type === 'INCOME' ? '+' : '−'}{currency} {record.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-blue">{record.branch.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                      {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {finances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <LineChart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No financial records yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add Financial Record</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {['INCOME', 'EXPENSE'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setFormData({...formData, type: t})}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      formData.type === t
                        ? t === 'INCOME'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-red-500 text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {t === 'INCOME' ? '📈 Income' : '📉 Expense'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Amount ({currency})</label>
                <input required type="number" step="0.01" min="0" placeholder="0.00" className="input-base"
                  value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                <input required type="text"
                  placeholder={formData.type === 'INCOME' ? 'e.g. Sales, Service Fee' : 'e.g. Utilities, Rent, Payroll'}
                  className="input-base"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Branch</label>
                  <select required className="input-base"
                    value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Date</label>
                  <input required type="date" className="input-base"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting || branches.length === 0} className="btn-primary">
                  {isSubmitting ? <><span className="spinner" /> Saving…</> : <><Plus className="w-4 h-4" /> Add Record</>}
                </button>
              </div>
              {branches.length === 0 && <p className="text-red-500 text-xs text-center">Create a branch first.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
