import React, { useState, useEffect } from 'react';
import { Search, Loader2, Check, X } from 'lucide-react';
import { User, Drug } from '../types';

const FormularyCheckView = ({ user }: { user: User }) => {
  const [search, setSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Formulary Check</h2>
          <p className="text-slate-500">Search for available drugs in the AIMSRC Pharmacy</p>
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
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading drugs...</td></tr>
                ) : drugs.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">No drugs found</td></tr>
                ) : drugs.map((drug) => (
                  <tr 
                    key={drug.id} 
                    onClick={() => setSelectedDrug(drug)}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDrug(null)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">Drug Details</h3>
              <button onClick={() => setSelectedDrug(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section (No)</label>
                  <p className="font-medium text-slate-800">{selectedDrug.group_description}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Generic Description</label>
                  <p className="font-medium text-slate-800">{selectedDrug.generic_description}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dosage Form</label>
                  <p className="text-slate-700">{selectedDrug.dosage_form}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Item Description</label>
                  <p className="text-slate-700">{selectedDrug.item_description}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Manufacturer</label>
                  <p className="text-slate-700">{selectedDrug.manufacturer_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">MRP (₹)</label>
                  <p className="font-mono font-medium text-slate-800">₹{selectedDrug.unit_mrp}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Availability</label>
                  <div>
                    {selectedDrug.availability === 'Available' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                        <Check size={16} className="mr-1" /> In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                        <X size={16} className="mr-1" /> Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormularyCheckView;
