import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import {
  Users, CheckSquare, DollarSign, Plus, Briefcase, Trash2,
  Clock, CheckCircle2, AlertCircle, Tag, Pencil, X, Star,
  UserPlus, Layers, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Worker Dashboard — focused view for STAFF / BRANCH_MANAGER
═══════════════════════════════════════════════════════════ */

const API = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}`;

// ── Tiny stat badge ──────────────────────────────────────────
const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex-1 min-w-[140px]`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-xl font-extrabold text-gray-900 anim-count">{value ?? '—'}</p>
    </div>
  </div>
);

// ── Priority chip ─────────────────────────────────────────────
const PriorityChip = ({ p }) => {
  const map = {
    LOW:    'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH:   'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700 urgent-pulse',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${map[p] || 'bg-gray-100 text-gray-600'}`}>
      {p}
    </span>
  );
};

const WorkerDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();

  // ── state ─────────────────────────────────────────────────
  const [branches, setBranches]     = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [services, setServices]     = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [todayStats, setTodayStats] = useState({ clients: 0, revenue: 0, tasks: 0 });

  // ── onboarding form ───────────────────────────────────────
  const [onboard, setOnboard] = useState({ name: '', contact: '', serviceId: '', amountPaid: '', notes: '' });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // ── services form ─────────────────────────────────────────
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [svc, setSvc]                         = useState({ name: '', description: '', price: '' });
  const [submittingSvc, setSubmittingSvc]     = useState(false);
  const [editSvc, setEditSvc]                 = useState(null); // service being edited

  // ── task accordion ────────────────────────────────────────
  const [taskExpanded, setTaskExpanded] = useState(true);

  // ── load branch list ──────────────────────────────────────
  useEffect(() => {
    if (selectedBusiness && token) fetchBranches();
  }, [selectedBusiness, token]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API}/branches?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
      if (res.data.length > 0) setSelectedBranch(res.data[0].id);
    } catch { /* noop */ }
  };

  // ── load branch data when branch changes ──────────────────
  useEffect(() => {
    if (selectedBranch && token) {
      setLoading(true);
      Promise.all([
        fetchServices().catch(() => {}),
        fetchTasks().catch(() => {}),
        fetchClients().catch(() => {}),
      ]).finally(() => setLoading(false));
    }
  }, [selectedBranch, token]);

  const fetchServices = async () => {
    const res = await axios.get(`${API}/services?branchId=${selectedBranch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setServices(res.data);
  };

  const fetchTasks = async () => {
    const res = await axios.get(`${API}/tasks?businessId=${selectedBusiness.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const branchTasks = res.data.filter(t => t.branchId === selectedBranch);
    setTasks(branchTasks);
    setTodayStats(prev => ({
      ...prev,
      tasks: branchTasks.filter(t => t.status !== 'COMPLETED').length,
    }));
  };

  const fetchClients = async () => {
    const res = await axios.get(`${API}/clients?branchId=${selectedBranch}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const today = new Date().toDateString();
    const todayClients = res.data.filter(c => new Date(c.updatedAt).toDateString() === today);
    setClients(res.data);
    const todayRevenue = todayClients.reduce((acc, c) => {
      try {
        const h = JSON.parse(c.history || '[]');
        const todayVisits = h.filter(v => new Date(v.date).toDateString() === today);
        return acc + todayVisits.reduce((s, v) => s + (v.amount || 0), 0);
      } catch { return acc; }
    }, 0);
    setTodayStats(prev => ({
      ...prev,
      clients: todayClients.length,
      revenue: todayRevenue,
    }));
  };

  // ── onboard client ────────────────────────────────────────
  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return toast.error('Select a branch first');
    setSubmittingOnboard(true);
    try {
      const selectedService = services.find(s => s.id === onboard.serviceId);
      await axios.post(`${API}/clients`, {
        name: onboard.name,
        contact: onboard.contact,
        service: selectedService ? selectedService.name : 'General',
        amountPaid: onboard.amountPaid,
        branchId: selectedBranch,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`✅ ${onboard.name} onboarded successfully!`);
      setOnboard({ name: '', contact: '', serviceId: '', amountPaid: '', notes: '' });
      fetchClients();
    } catch {
      toast.error('Failed to onboard client. Please try again.');
    } finally {
      setSubmittingOnboard(false);
    }
  };

  // ── create / update service ───────────────────────────────
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSvc(true);
    try {
      if (editSvc) {
        await axios.put(`${API}/services/${editSvc.id}`, {
          name: svc.name,
          description: svc.description,
          price: svc.price,
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Service updated');
      } else {
        await axios.post(`${API}/services`, {
          name: svc.name,
          description: svc.description,
          price: svc.price,
          branchId: selectedBranch,
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Service added');
      }
      setSvc({ name: '', description: '', price: '' });
      setShowServiceForm(false);
      setEditSvc(null);
      fetchServices();
    } catch {
      toast.error('Failed to save service');
    } finally {
      setSubmittingSvc(false);
    }
  };

  const startEditService = (s) => {
    setEditSvc(s);
    setSvc({ name: s.name, description: s.description || '', price: s.price });
    setShowServiceForm(true);
  };

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await axios.delete(`${API}/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service removed');
    } catch {
      toast.error('Failed to delete service');
    }
  };

  // ── update task status ────────────────────────────────────
  const updateTask = async (taskId, status) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      await axios.put(`${API}/tasks/${taskId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
      fetchTasks();
    }
  };

  // ── currency ──────────────────────────────────────────────
  const currency = selectedBusiness?.currency || 'USD';

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Please select a business from the top dropdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 page-enter">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            Worker Portal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span> —
            {' '}<span className="text-blue-600 font-medium">{selectedBusiness.name}</span>
          </p>
        </div>

        {/* Branch selector */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
          >
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Today's Stats ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        <StatBadge icon={UserPlus}    label="Clients Today"   value={todayStats.clients} color="bg-blue-50 text-blue-600"    />
        <StatBadge icon={DollarSign}  label="Revenue Today"   value={`${currency} ${todayStats.revenue.toLocaleString()}`} color="bg-emerald-50 text-emerald-600" />
        <StatBadge icon={CheckSquare} label="Open Tasks"      value={todayStats.tasks}   color="bg-orange-50 text-orange-500" />
        <StatBadge icon={Users}       label="Total Clients"   value={clients.length}     color="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left: Onboard Client ──────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="section-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <h2 className="font-bold">Onboard Client</h2>
            </div>
          </div>
          <form onSubmit={handleOnboard} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Client Name</label>
              <input
                required
                type="text"
                placeholder="John Doe"
                className="input-base"
                value={onboard.name}
                onChange={e => setOnboard(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contact</label>
              <input
                required
                type="text"
                placeholder="Phone or email"
                className="input-base"
                value={onboard.contact}
                onChange={e => setOnboard(p => ({ ...p, contact: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Service</label>
              <select
                className="input-base"
                value={onboard.serviceId}
                onChange={e => {
                  const s = services.find(sv => sv.id === e.target.value);
                  setOnboard(p => ({
                    ...p,
                    serviceId: e.target.value,
                    amountPaid: s ? s.price.toString() : p.amountPaid,
                  }));
                }}
              >
                <option value="">— Select service —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({currency} {s.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Amount Paid ({currency})</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input-base"
                value={onboard.amountPaid}
                onChange={e => setOnboard(p => ({ ...p, amountPaid: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={submittingOnboard || !selectedBranch}
              className="btn-primary w-full"
            >
              {submittingOnboard
                ? <><span className="spinner" /> Saving…</>
                : <><UserPlus className="w-4 h-4" /> Onboard Client</>
              }
            </button>
            {branches.length === 0 && (
              <p className="text-xs text-red-500 text-center">Create a branch first.</p>
            )}
          </form>
        </div>

        {/* ── Right: Services + Tasks ───────────────────────── */}
        <div className="xl:col-span-3 space-y-6">

          {/* Services Offered */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="section-header">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <h2 className="font-bold text-gray-900">Services Offered</h2>
                <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-semibold">
                  {services.length}
                </span>
              </div>
              <button
                onClick={() => { setShowServiceForm(f => !f); setEditSvc(null); setSvc({ name: '', description: '', price: '' }); }}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Add / Edit form */}
            {showServiceForm && (
              <div className="px-5 pt-4 pb-2 border-b border-gray-100 bg-violet-50/40">
                <form onSubmit={handleServiceSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
                      <input required type="text" placeholder="e.g. Haircut" className="input-base"
                        value={svc.name} onChange={e => setSvc(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Price ({currency}) *</label>
                      <input required type="number" step="0.01" min="0" placeholder="0.00" className="input-base"
                        value={svc.price} onChange={e => setSvc(p => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <input type="text" placeholder="Short description…" className="input-base"
                      value={svc.description} onChange={e => setSvc(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 justify-end pb-2">
                    <button type="button" onClick={() => { setShowServiceForm(false); setEditSvc(null); }} className="btn-secondary text-xs py-1.5 px-4">
                      Cancel
                    </button>
                    <button type="submit" disabled={submittingSvc} className="btn-primary text-xs py-1.5 px-4">
                      {submittingSvc ? <span className="spinner" /> : (editSvc ? 'Update' : 'Save')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-32" />
                        <div className="skeleton h-2.5 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  <Tag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No services yet. Add your first service above.
                </div>
              ) : (
                services.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">
                      {currency} {Number(s.price).toLocaleString()}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => startEditService(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteService(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Task Queue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setTaskExpanded(e => !e)}
              className="section-header w-full text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-gray-900">My Task Queue</h2>
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-semibold">
                  {tasks.filter(t => t.status !== 'COMPLETED').length} open
                </span>
              </div>
              {taskExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {taskExpanded && (
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="p-5 space-y-3">
                    {[1,2].map(i => (
                      <div key={i} className="space-y-1.5">
                        <div className="skeleton h-4 w-48" />
                        <div className="skeleton h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No tasks assigned to this branch yet.
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-4 px-5 py-4 ${task.status === 'COMPLETED' ? 'opacity-50' : ''}`}>
                      <div className="pt-0.5 shrink-0">
                        {task.status === 'COMPLETED'
                          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                          : task.status === 'IN_PROGRESS'
                          ? <AlertCircle className="w-5 h-5 text-blue-500" />
                          : <Clock className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold text-sm ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          <PriorityChip p={task.priority} />
                        </div>
                        {task.dueDate && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {task.status !== 'COMPLETED' && (
                          <div className="flex gap-2 mt-2">
                            {task.status !== 'IN_PROGRESS' && (
                              <button onClick={() => updateTask(task.id, 'IN_PROGRESS')}
                                className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 font-medium hover:bg-blue-100 transition-colors">
                                Start
                              </button>
                            )}
                            <button onClick={() => updateTask(task.id, 'COMPLETED')}
                              className="text-[11px] px-2.5 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100 font-medium hover:bg-green-100 transition-colors">
                              Mark Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Clients ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-gray-900">Recent Clients</h2>
          </div>
          <span className="text-xs text-gray-400">{clients.length} total</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-2.5 w-20" />
                </div>
                <div className="skeleton h-4 w-16" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No clients yet for this branch.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.contact}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-gray-900">{currency} {c.totalSpend.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{new Date(c.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
