import React, { useState, useEffect } from 'react';
import { Building, Search, Edit2, Trash2, X, Plus, Save } from 'lucide-react';
import { User } from '../types';

export const MedicalCollegesList = ({ user }: { user: User }) => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingInst, setEditingInst] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchInstitutions = () => {
    setLoading(true);
    fetch('/api/institutions')
      .then(res => res.json())
      .then(data => {
        setInstitutions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch institutions", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this institution?")) return;
    try {
      const res = await fetch(`/api/institutions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        fetchInstitutions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleEdit = (inst: any) => {
    setEditingInst({ ...inst });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    try {
      const res = await fetch(`/api/institutions/${editingInst.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingInst)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingInst(null);
        fetchInstitutions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const filtered = institutions.filter(inst => 
    inst.name?.toLowerCase().includes(search.toLowerCase()) || 
    inst.location?.toLowerCase().includes(search.toLowerCase()) ||
    inst.state?.toLowerCase().includes(search.toLowerCase()) ||
    inst.university?.toLowerCase().includes(search.toLowerCase()) ||
    inst.ownership?.toLowerCase().includes(search.toLowerCase()) ||
    inst.head_name?.toLowerCase().includes(search.toLowerCase()) ||
    inst.head_mobile?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">List of Medical Colleges</h2>
          <p className="text-slate-500">View all registered institutions within the system.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search colleges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar w-full md:block hidden relative">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm backdrop-blur-sm shadow-slate-200/50">
              <tr>
                <th className="p-4 font-semibold text-slate-600">ID</th>
                <th className="p-4 font-semibold text-slate-600">Name of the Institute</th>
                <th className="p-4 font-semibold text-slate-600">Location</th>
                <th className="p-4 font-semibold text-slate-600">State</th>
                <th className="p-4 font-semibold text-slate-600">Established</th>
                <th className="p-4 font-semibold text-slate-600">University / Affiliation</th>
                <th className="p-4 font-semibold text-slate-600">Ownership</th>
                <th className="p-4 font-semibold text-slate-600">Principal / Incharge</th>
                <th className="p-4 font-semibold text-slate-600">Mobile Number</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Loading colleges...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">No medical colleges found.</td>
                </tr>
              ) : (
                filtered.map((inst, idx) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">#{inst.id}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm shrink-0">
                          <Building size={20} />
                        </div>
                        <span className="font-semibold text-slate-800 break-words whitespace-normal max-w-xs">{inst.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 whitespace-normal min-w-[120px]">{inst.location || '-'}</td>
                    <td className="p-4 text-slate-600">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium whitespace-nowrap">
                        {inst.state || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{inst.established || '-'}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate whitespace-normal min-w-[150px]" title={inst.university}>{inst.university || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded inline-flex text-xs font-semibold ${
                        inst.ownership?.toLowerCase().includes('govt') || inst.ownership?.toLowerCase().includes('government')
                          ? 'bg-blue-100 text-blue-700'
                          : inst.ownership?.toLowerCase().includes('private') || inst.ownership?.toLowerCase().includes('trust')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inst.ownership || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium whitespace-nowrap">{inst.head_name || '-'}</td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">{inst.head_mobile || '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleEdit(inst)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(inst.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden block divide-y divide-slate-100">
          {loading ? (
             <div className="p-8 text-center text-slate-500">Loading colleges...</div>
          ) : filtered.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No medical colleges found.</div>
          ) : (
             filtered.map((inst) => (
               <div key={inst.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3 relative">
                 <div className="flex items-start space-x-3 pr-16 bg-white">
                   <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-sm shrink-0 mt-1">
                     <Building size={20} />
                   </div>
                   <div>
                     <span className="font-semibold text-slate-800 block text-lg">{inst.name}</span>
                     <span className="text-xs text-slate-500 block mb-2">ID: #{inst.id} &bull; Est. {inst.established || '-'}</span>
                     
                     <div className="flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          State: {inst.state || '-'}
                        </span>
                        <span className={`px-2 py-1 rounded inline-flex text-xs font-semibold ${
                          inst.ownership?.toLowerCase().includes('govt') || inst.ownership?.toLowerCase().includes('government')
                            ? 'bg-blue-100 text-blue-700'
                            : inst.ownership?.toLowerCase().includes('private') || inst.ownership?.toLowerCase().includes('trust')
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {inst.ownership || 'Unknown'}
                        </span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                    <div><span className="font-semibold">City/Location:</span> {inst.location || '-'}</div>
                    <div className="truncate" title={inst.university}><span className="font-semibold">University:</span> {inst.university || '-'}</div>
                    <div><span className="font-semibold">Principal/Incharge:</span> {inst.head_name || '-'}</div>
                    <div><span className="font-semibold">Mobile Number:</span> {inst.head_mobile || '-'}</div>
                 </div>

                 <div className="absolute top-5 right-5 flex flex-col space-y-2">
                    <button onClick={() => handleEdit(inst)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(inst.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Delete">
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

      {showModal && editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Edit Medical College</h3>
              <button 
                onClick={() => { setShowModal(false); setEditingInst(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  value={editingInst.name || ''}
                  onChange={(e) => setEditingInst({...editingInst, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    value={editingInst.location || ''}
                    onChange={(e) => setEditingInst({...editingInst, location: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editingInst.state || ''}
                    onChange={(e) => setEditingInst({...editingInst, state: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year Established</label>
                  <input
                    type="text"
                    value={editingInst.established || ''}
                    onChange={(e) => setEditingInst({...editingInst, established: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ownership</label>
                  <input
                    type="text"
                    value={editingInst.ownership || ''}
                    onChange={(e) => setEditingInst({...editingInst, ownership: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Govt, Private, Trust"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">University / Affiliation</label>
                <input
                  type="text"
                  value={editingInst.university || ''}
                  onChange={(e) => setEditingInst({...editingInst, university: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal / Incharge Name</label>
                  <input
                    type="text"
                    value={editingInst.head_name || ''}
                    onChange={(e) => setEditingInst({...editingInst, head_name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Dr. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingInst.head_mobile || ''}
                    onChange={(e) => setEditingInst({...editingInst, head_mobile: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingInst(null); }}
                  className="px-5 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center space-x-2 transition-colors"
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalCollegesList;
