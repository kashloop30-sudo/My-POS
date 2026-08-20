import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonTable } from '../components/Skeleton';
import { Plus, Users, Search, Download, ChevronDown, ChevronUp, History, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const Clients = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();

  const [clients, setClients]   = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedClient, setExpandedClient] = useState(null);

  const [filterBranch, setFilterBranch] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');

  const [formData, setFormData]       = useState({ name: '', contact: '', branchId: '', service: '', amountPaid: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBusiness && token) {
      fetchBranches();
      fetchClients();
    }
  }, [selectedBusiness, token]);

  // When branch changes in form, load its services
  useEffect(() => {
    if (formData.branchId && token) fetchServices(formData.branchId);
  }, [formData.branchId, token]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/branches?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, branchId: res.data[0].id }));
    } catch { /* noop */ }
  };

  const fetchServices = async (branchId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/services?branchId=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data);
    } catch { /* noop */ }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/clients?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/clients`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchClients();
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, name: '', contact: '', service: '', amountPaid: '' }));
      toast.success('Client visit logged successfully!');
    } catch {
      toast.error('Failed to log client visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredClients.map(c => ({
      Name: c.name,
      Contact: c.contact,
      Branch: c.branch.name,
      'Total Spend': c.totalSpend,
      'Last Visit': c.updatedAt.split('T')[0],
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `${selectedBusiness.name}_Clients.xlsx`);
    toast.info('Excel exported!');
  };

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <Users className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Select a business from the top dropdown to view clients.</p>
      </div>
    );
  }

  const filteredClients = clients.filter(c => {
    const matchesBranch = filterBranch ? c.branchId === filterBranch : true;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const parseHistory = (raw) => {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage customers for{' '}
            <span className="font-semibold text-blue-600">{selectedBusiness.name}</span>
            <span className="ml-2 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
              {clients.length} total
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Onboard Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or contact…"
            className="input-base pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="input-base md:w-52"
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
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
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Total Spend</th>
                  <th className="px-6 py-3.5 text-right">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map(client => {
                  const isExpanded = expandedClient === client.id;
                  const history = parseHistory(client.history);
                  return (
                    <React.Fragment key={client.id}>
                      <tr className="table-row">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{client.contact}</td>
                        <td className="px-6 py-4">
                          <span className="badge-blue">{client.branch.name}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {selectedBusiness.currency} {client.totalSpend.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            {history.length} visit{history.length !== 1 ? 's' : ''}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                      {/* Expanded visit history */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-6 py-0">
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mb-3" style={{ animation: 'fadeInUp 0.2s ease' }}>
                              <p className="text-xs font-bold text-blue-700 mb-3 uppercase tracking-wide">Visit History</p>
                              {history.length === 0 ? (
                                <p className="text-xs text-gray-400">No visit history recorded.</p>
                              ) : (
                                <div className="space-y-2">
                                  {history.slice().reverse().map((v, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white rounded-lg px-4 py-2.5 border border-blue-100/60 text-xs">
                                      <span className="text-gray-400 font-medium w-24 shrink-0">
                                        {new Date(v.date).toLocaleDateString()}
                                      </span>
                                      <span className="flex-1 font-medium text-gray-700">{v.service || 'General'}</span>
                                      <span className="font-bold text-gray-900 shrink-0">
                                        {selectedBusiness.currency} {(v.amount || 0).toLocaleString()}
                                      </span>
                                      {v.staffName && <span className="text-gray-400 shrink-0">by {v.staffName}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No clients found matching your criteria.</p>
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
              <h2 className="text-xl font-bold text-gray-900">Onboard Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Client Name</label>
                <input required type="text" placeholder="John Doe" className="input-base"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contact</label>
                <input required type="text" placeholder="Phone or email" className="input-base"
                  value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Branch</label>
                <select required className="input-base"
                  value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Service</label>
                <select className="input-base"
                  value={formData.service}
                  onChange={e => {
                    const s = services.find(sv => sv.name === e.target.value);
                    setFormData({...formData, service: e.target.value, amountPaid: s ? s.price.toString() : formData.amountPaid});
                  }}>
                  <option value="">— Select or type below —</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} ({selectedBusiness.currency} {s.price})</option>)}
                </select>
                {services.length === 0 && (
                  <input type="text" placeholder="e.g. Consultation, Purchase" className="input-base mt-2"
                    value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Amount Paid ({selectedBusiness.currency})</label>
                <input required type="number" step="0.01" min="0" placeholder="0.00" className="input-base"
                  value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} />
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting || branches.length === 0} className="btn-primary">
                  {isSubmitting ? <><span className="spinner" /> Saving…</> : <><Plus className="w-4 h-4" /> Log Visit</>}
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

export default Clients;
