import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import { Plus, MapPin, Building2, Phone, User, X, CheckCircle2, Trash2 } from 'lucide-react';

const Branches = () => {
  const { token } = useContext(AuthContext);
  const { selectedBusiness } = useContext(BusinessContext);
  const toast = useToast();
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', contact: '', status: 'ACTIVE' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    if (!token || !selectedBusiness) return;
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/branches?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [selectedBusiness, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/branches`, { ...formData, businessId: selectedBusiness.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBranches();
      setIsModalOpen(false);
      setFormData({ name: '', address: '', contact: '', status: 'ACTIVE' });
      toast.success('Branch added successfully!');
    } catch {
      toast.error('Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch? This cannot be undone.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'}/branches/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(prev => prev.filter(b => b.id !== id));
      toast.success('Branch deleted');
    } catch {
      toast.error('Failed to delete branch');
    }
  };

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-gray-200">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Business Selected</h2>
        <p className="text-gray-500 mt-2">Please select a business from the top dropdown to view its branches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-indigo-600" />
            Branches
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Managing operating locations for <span className="font-semibold text-blue-600">{selectedBusiness.name}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {branches.map((branch, i) => (
            <div 
              key={branch.id} 
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-200 relative group flex gap-5 hover:-translate-y-0.5"
              style={{ animation: `fadeInUp 0.35s ease ${i * 0.08}s both` }}
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteBranch(branch.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 z-10"
                title="Delete branch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
                <MapPin className="w-7 h-7" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{branch.name}</h3>
                  <span className={branch.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}>
                    <span className={`w-1.5 h-1.5 rounded-full ${branch.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {branch.status}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-start gap-2.5 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium">{branch.address}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium">{branch.contact}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-gray-600">
                    <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="flex-1 font-medium text-blue-600">{branch.manager?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {branches.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800">No branches found</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                Get started by adding an operational location or branch office for this business.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary mx-auto mt-4"
              >
                <Plus className="w-4 h-4" /> Add First Branch
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Branch Name</label>
                <input 
                  type="text" required placeholder="e.g. Downtown Flagship Hub"
                  className="input-base"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Physical Address</label>
                <input 
                  type="text" required placeholder="e.g. 123 Main Street, Suite 400"
                  className="input-base"
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contact Details</label>
                <input 
                  type="text" required placeholder="Phone number or direct email"
                  className="input-base"
                  value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                <select 
                  className="input-base"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="pt-3 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? <><span className="spinner" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Branch</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
