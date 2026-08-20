import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import { useToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import { Plus, Building2, Globe, DollarSign, Check, X, Layers, Briefcase, Trash2 } from 'lucide-react';

const Businesses = () => {
  const { token } = useContext(AuthContext);
  const { businesses, selectedBusiness, setSelectedBusiness, fetchBusinesses, loading } = useContext(BusinessContext);
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData]       = useState({ name: '', type: '', currency: 'USD' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this business? This action cannot be undone.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBusinesses();
      if (selectedBusiness?.id === id) setSelectedBusiness(null);
      toast.success('Business deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete business');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/businesses`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchBusinesses();
      setIsModalOpen(false);
      setFormData({ name: '', type: '', currency: 'USD' });
      toast.success('Business created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-blue-600" />
            Businesses
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your company entities, brand profiles and currency settings
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Business
        </button>
      </div>

      {loading ? (
        <SkeletonCard count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business, i) => {
            const isCurrent = selectedBusiness?.id === business.id;
            return (
              <div
                key={business.id}
                onClick={() => setSelectedBusiness(business)}
                className={`bg-white rounded-2xl border p-6 cursor-pointer transition-all duration-200 relative group hover:shadow-xl hover:-translate-y-1 ${
                  isCurrent
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-100'
                    : 'border-gray-100 shadow-sm hover:border-blue-200'
                }`}
                style={{ animation: `fadeInUp 0.35s ease ${i * 0.08}s both` }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, business.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 z-10"
                  title="Delete business"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {/* Active Indicator Chip */}
                {isCurrent && (
                  <span className="absolute top-4 right-12 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20 shrink-0">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{business.name}</h3>
                    <span className="badge-violet mt-1 inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {business.type || 'General'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Default Currency</span>
                  <span className="font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {business.currency}
                  </span>
                </div>
              </div>
            );
          })}

          {businesses.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800">No businesses found</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                Get started by creating your first business entity to begin organizing branches and clients.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary mx-auto mt-4"
              >
                <Plus className="w-4 h-4" /> Create First Business
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
              <h2 className="text-xl font-bold text-gray-900">Add New Business</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Business Name</label>
                <input 
                  type="text" required placeholder="e.g. Acme Corporation"
                  className="input-base"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Industry / Type</label>
                <input 
                  type="text" required placeholder="e.g. Retail, Tech, Hospitality, Salon"
                  className="input-base"
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Primary Currency</label>
                <select 
                  className="input-base"
                  value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
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
                  {isSubmitting ? <><span className="spinner" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Business</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Businesses;
