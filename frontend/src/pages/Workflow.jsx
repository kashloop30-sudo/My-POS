import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { Plus, CheckSquare, Clock, AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';

const Workflow = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();

  const [tasks, setTasks]     = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', priority: 'MEDIUM', dueDate: '', branchId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBusiness && token) { fetchBranches(); fetchTasks(); }
  }, [selectedBusiness, token]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/branches?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, branchId: res.data[0].id }));
    } catch { /* noop */ }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tasks?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchTasks();
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, title: '', priority: 'MEDIUM', dueDate: '' }));
      toast.success('Task created!');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      toast.error('Status update failed');
      fetchTasks();
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <CheckSquare className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Select a business to view the workflow board.</p>
      </div>
    );
  }

  const columns = {
    PENDING:     { title: 'To Do',       icon: Clock,         headerBg: 'bg-gray-50',   dot: 'bg-gray-400',  border: 'border-gray-200',  count: 'bg-gray-200 text-gray-700' },
    IN_PROGRESS: { title: 'In Progress', icon: AlertCircle,   headerBg: 'bg-blue-50',   dot: 'bg-blue-500',  border: 'border-blue-200',  count: 'bg-blue-100 text-blue-700' },
    COMPLETED:   { title: 'Done',        icon: CheckCircle2,  headerBg: 'bg-green-50',  dot: 'bg-green-500', border: 'border-green-200', count: 'bg-green-100 text-green-700' },
  };

  const priorityConfig = {
    LOW:    { cls: 'bg-gray-100 text-gray-600',        ring: '' },
    MEDIUM: { cls: 'bg-blue-100 text-blue-700',        ring: '' },
    HIGH:   { cls: 'bg-orange-100 text-orange-700',    ring: '' },
    URGENT: { cls: 'bg-red-100 text-red-700',          ring: 'urgent-pulse' },
  };

  return (
    <div className="space-y-6 h-full flex flex-col page-enter">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Workflow Board</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kanban task management for{' '}
            <span className="font-semibold text-blue-600">{selectedBusiness.name}</span>
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="w-80 shrink-0">
              <div className="skeleton h-12 rounded-t-xl mb-2" />
              {[1,2].map(j => <div key={j} className="skeleton h-28 rounded-xl mb-3" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-5 min-w-max h-full items-start">
            {Object.entries(columns).map(([statusKey, col]) => {
              const colTasks = tasks.filter(t => t.status === statusKey);
              return (
                <div key={statusKey} className={`w-80 rounded-2xl flex flex-col border ${col.border} overflow-hidden bg-white/60 shadow-sm`}>
                  {/* Column header — glass look */}
                  <div className={`${col.headerBg} px-4 py-3.5 border-b ${col.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shrink-0`} />
                      <h3 className="font-bold text-gray-800 text-sm">{col.title}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${col.count}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 p-3 space-y-3 min-h-[200px] overflow-y-auto">
                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
                        style={{ animation: 'fadeInUp 0.3s ease' }}
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${priorityConfig[task.priority]?.cls} ${priorityConfig[task.priority]?.ring}`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-3">{task.title}</h4>

                        <div className="flex flex-col gap-1.5 mb-3 text-xs text-gray-400">
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {task.branch?.name && (
                            <div className="flex items-center gap-1.5">
                              <CheckSquare className="w-3 h-3 shrink-0" />
                              {task.branch.name}
                            </div>
                          )}
                        </div>

                        {/* Status buttons */}
                        <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                          {statusKey !== 'PENDING' && (
                            <button onClick={() => updateTaskStatus(task.id, 'PENDING')}
                              className="flex-1 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors">
                              Todo
                            </button>
                          )}
                          {statusKey !== 'IN_PROGRESS' && (
                            <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="flex-1 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors">
                              Start
                            </button>
                          )}
                          {statusKey !== 'COMPLETED' && (
                            <button onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                              className="flex-1 py-1.5 text-[11px] font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors">
                              Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-300 font-medium select-none">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Task Title</label>
                <input required type="text" placeholder="What needs to be done?" className="input-base"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Assign to Branch</label>
                <select required className="input-base"
                  value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Priority</label>
                  <select className="input-base"
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">🔥 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Due Date</label>
                  <input type="date" className="input-base"
                    value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting || branches.length === 0} className="btn-primary">
                  {isSubmitting ? <><span className="spinner" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Task</>}
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

export default Workflow;
