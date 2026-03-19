import React, { useState, useEffect } from 'react';
import { Search, Pill, Check, X, Info, Upload, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Drug } from '../types';

const FormularyCheck = ({ user }: { user: User }) => {
  const [search, setSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin] = useState(user.role === 'Pharmacology Admin' || user.role === 'MASTER_ADMIN');
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    group_description: '',
    generic_description: '',
    dosage_form: '',
    item_description: '',
    manufacturer_name: '',
    unit_mrp: '',
    availability: 'Available'
  });

  const fetchDrugs = async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/formulary?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDrugs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrugs(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrugs(search);
  };

  const handleOpenModal = (drug: Drug | null = null) => {
    if (drug) {
      setEditingDrug(drug);
      setFormData({
        group_description: drug.group_description,
        generic_description: drug.generic_description,
        dosage_form: drug.dosage_form,
        item_description: drug.item_description,
        manufacturer_name: drug.manufacturer_name,
        unit_mrp: drug.unit_mrp.toString(),
        availability: drug.availability
      });
    } else {
      setEditingDrug(null);
      setFormData({
        group_description: '',
        generic_description: '',
        dosage_form: '',
        item_description: '',
        manufacturer_name: '',
        unit_mrp: '',
        availability: 'Available'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingDrug ? `/api/formulary/${editingDrug.id}` : '/api/formulary';
      const method = editingDrug ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          unit_mrp: parseFloat(formData.unit_mrp)
        })
      });

      if (res.ok) {
        setShowModal(false);
        fetchDrugs(search);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this drug?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/formulary/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDrugs(search);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);
      
      // Map Excel columns to Drug interface with "forward fill" for group_description
      let currentGroup = '';
      const mappedData = rawData.map(item => {
        const group = item['GROUP DESCRIPTION'] || item['group_description'];
        if (group) {
          currentGroup = group;
        }
        
        return {
          group_description: currentGroup,
          generic_description: item['GENERIC DESCRIPTION'] || item['generic_description'],
          dosage_form: item['FORM'] || item['dosage_form'],
          item_description: item['ITEM DESCRIPTION'] || item['item_description'],
          manufacturer_name: item['MANUFACTURER NAME'] || item['manufacturer_name'],
          unit_mrp: item['UnitMRP'] || item['unit_mrp'],
          availability: 'Available'
        };
      });

      // Upload to server
      const token = localStorage.getItem('token');
      await fetch('/api/formulary/upload', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ drugs: mappedData }),
      });
      fetchDrugs();
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Hospital Formulary</h2>
            <p className="text-slate-500">Search for available drugs in the AIMSRC Pharmacy</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Add Drug
              </button>
              <label className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl cursor-pointer hover:bg-emerald-600 transition-colors">
                <Upload size={18} className="mr-2" />
                <span>Upload Excel</span>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="Type drug name, category or generic name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium">
            Search
          </button>
        </form>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] -mx-4 md:mx-0 border rounded-2xl border-slate-100 custom-scrollbar">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-[1000px] w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Section (No)</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Generic Description</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Form</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Item Description</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Manufacturer</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">MRP</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">Status</th>
                  {isAdmin && <th className="py-4 px-4 text-sm font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400">Loading drugs...</td></tr>
                ) : drugs.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-400">No drugs found</td></tr>
                ) : drugs.map((drug) => (
                  <tr 
                    key={drug.id} 
                    onClick={() => isAdmin && handleOpenModal(drug)}
                    className={`border-b border-slate-50 transition-colors ${isAdmin ? 'cursor-pointer hover:bg-emerald-50/50 group' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-4 px-4 border-b border-slate-50">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {drug.group_description}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800 border-b border-slate-50">{drug.generic_description}</td>
                    <td className="py-4 px-4 text-slate-600 border-b border-slate-50">{drug.dosage_form}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm border-b border-slate-50">{drug.item_description}</td>
                    <td className="py-4 px-4 text-slate-500 text-xs border-b border-slate-50">{drug.manufacturer_name}</td>
                    <td className="py-4 px-4 text-slate-800 font-mono text-sm border-b border-slate-50">₹{drug.unit_mrp}</td>
                    <td className="py-4 px-4 border-b border-slate-50">
                      {drug.availability === 'Available' ? (
                        <span className="flex items-center text-emerald-600 text-sm font-medium">
                          <Check size={16} className="mr-1" /> In Stock
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500 text-sm font-medium">
                          <X size={16} className="mr-1" /> Out of Stock
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4 text-right border-b border-slate-50">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(drug); }}
                            className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Edit Drug"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(drug.id); }}
                            className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete Drug"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingDrug ? 'Edit Drug' : 'Add New Drug'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section (No)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. VITAMINS & MINERALS"
                    value={formData.group_description}
                    onChange={(e) => setFormData({...formData, group_description: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Generic Description</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. VITAMIN C"
                    value={formData.generic_description}
                    onChange={(e) => setFormData({...formData, generic_description: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dosage Form</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. TABLET"
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({...formData, dosage_form: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Item Description</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. LIMCEE TAB 15 PS"
                    value={formData.item_description}
                    onChange={(e) => setFormData({...formData, item_description: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Manufacturer</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. ABBOTT HEALTHCARE"
                    value={formData.manufacturer_name}
                    onChange={(e) => setFormData({...formData, manufacturer_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    value={formData.unit_mrp}
                    onChange={(e) => setFormData({...formData, unit_mrp: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Availability</label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                  >
                    <option value="Available">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  {editingDrug ? 'Update Drug' : 'Add Drug'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormularyCheck;
