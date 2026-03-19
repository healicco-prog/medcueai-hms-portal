import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ShieldAlert, Loader2, Search, Edit2, Trash2, Plus, Upload, X as LucideX } from 'lucide-react';
import { EssentialMedicine } from '../types';

const InstituteMedicinesManager = () => {
  const [medicines, setMedicines] = useState<EssentialMedicine[]>([]);
  const [searchMedicine, setSearchMedicine] = useState('');
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<EssentialMedicine | null>(null);
  const [isSubmittingMedicine, setIsSubmittingMedicine] = useState(false);
  const [formData, setFormData] = useState({
    section_no: '',
    section_name: '',
    sub_section_no: '',
    medicine: '',
    level_of_healthcare: '',
    dosage_form: ''
  });

  const fetchMedicines = async (query = '') => {
    setLoadingMedicines(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/institute-essential-medicines?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMedicines(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMedicines(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines(searchMedicine);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchMedicine]);

  const handleOpenModal = (drug: EssentialMedicine | null = null) => {
    if (drug) {
      setEditingMedicine(drug);
      setFormData({
        section_no: drug.section_no,
        section_name: drug.section_name,
        sub_section_no: drug.sub_section_no,
        medicine: drug.medicine,
        level_of_healthcare: drug.level_of_healthcare,
        dosage_form: drug.dosage_form
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        section_no: '',
        section_name: '',
        sub_section_no: '',
        medicine: '',
        level_of_healthcare: '',
        dosage_form: ''
      });
    }
    setShowModal(true);
  };

  const handleMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMedicine(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingMedicine 
        ? `/api/institute-essential-medicines/${editingMedicine.id}` 
        : '/api/institute-essential-medicines';
      const method = editingMedicine ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchMedicines(searchMedicine);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMedicine(false);
    }
  };

  const handleMedicineDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/institute-essential-medicines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMedicines(searchMedicine);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-8">
      <div className="flex items-center space-x-4 mb-2">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Akash Institute Essential Medicine List</h2>
          <p className="text-slate-500">Upload and manage the institute's essential medicine list</p>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-700">Bulk Upload Medicines</h3>
          <p className="text-sm text-slate-500 mt-1">Upload an Excel file containing the essential medicines list.</p>
        </div>
        <label className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center cursor-pointer shrink-0">
          <Upload size={20} className="mr-2" />
          Upload File
          <input 
            type="file" 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = async (evt) => {
                try {
                  const bstr = evt.target?.result;
                  const wb = XLSX.read(bstr, { type: 'binary' });
                  const wsname = wb.SheetNames[0];
                  const ws = wb.Sheets[wsname];
                  const rawData: any[] = XLSX.utils.sheet_to_json(ws);
                  
                  let currentGroup = '';
                  const mappedData = rawData.map(item => {
                    const group = item['SECTION NO'] || item['section_no'];
                    if (group) {
                      currentGroup = group;
                    }
                    
                    return {
                      section_no: currentGroup,
                      section_name: item['SECTION NAME'] || item['section_name'] || '',
                      sub_section_no: item['SUB SECTION NO'] || item['sub_section_no'] || '',
                      medicine: item['MEDICINE'] || item['medicine'] || '',
                      level_of_healthcare: item['LEVEL OF HEALTHCARE'] || item['level_of_healthcare'] || '',
                      dosage_form: item['DOSAGE FORM(S) AND STRENGTH(S)'] || item['dosage_form'] || ''
                    };
                  }).filter(item => item.medicine);

                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/institute-essential-medicines/upload', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ medicines: mappedData }),
                  });
                  
                  if (res.ok) {
                     alert('Institute medicines uploaded successfully!');
                     fetchMedicines();
                  } else {
                     alert('Failed to upload institute medicines.');
                  }
                } catch(err) {
                  alert('Failed to parse file');
                }
              };
              reader.readAsBinaryString(file);
              e.target.value = ''; // Reset input
            }} 
          />
        </label>
      </div>

      <div className="mt-6 flex gap-2">
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add Medicine
        </button>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); fetchMedicines(searchMedicine); }} className="relative mt-4 mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {loadingMedicines ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          placeholder="Type drug name, category or generic name..."
          value={searchMedicine}
          onChange={(e) => setSearchMedicine(e.target.value)}
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium">
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pb-4">
        {loadingMedicines ? (
          <div className="col-span-full py-8 text-center text-slate-400">Loading medicines...</div>
        ) : medicines.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl text-slate-400 border border-dashed border-slate-200">
            <ShieldAlert size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-slate-500">No medicines found</p>
            <p className="text-sm mt-1">Try adjusting your search or add a new medicine.</p>
          </div>
        ) : medicines.map((drug) => (
          <div 
            key={drug.id} 
            onClick={() => handleOpenModal(drug)}
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all cursor-pointer group flex flex-col relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col items-start gap-1">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm max-w-[200px] truncate" title={drug.section_name}>
                  {drug.section_no} {drug.section_name}
                </span>
                {drug.sub_section_no && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Sub: {drug.sub_section_no}
                  </span>
                )}
              </div>
              
              <div className="flex bg-slate-800/90 backdrop-blur shadow-sm border border-slate-700 rounded-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all absolute top-4 right-4 z-10 overflow-hidden">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(drug); }}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Edit Medicine"
                >
                  <Edit2 size={16} />
                </button>
                <div className="w-px bg-slate-700"></div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleMedicineDelete(drug.id); }}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                  title="Delete Medicine"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h4 className="text-xl font-bold text-slate-800 mb-4 pr-12 leading-tight">{drug.medicine}</h4>
            
            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 relative mb-4">
                  <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Dosage form(s) and strength(s)</span>
                  <span className="block text-slate-700 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{drug.dosage_form || 'N/A'}</span>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-3">
                  <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Level of Healthcare</span>
                  <div className="flex gap-2">
                     {drug.level_of_healthcare ? drug.level_of_healthcare.split(',').map(level => (
                       <span key={level} className="flex font-mono items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200 shadow-sm">{level.trim()}</span>
                     )) : <span className="text-slate-400 italic">None specified</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <LucideX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleMedicineSubmit} className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section No</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1, 2.1"
                    value={formData.section_no}
                    onChange={(e) => setFormData({...formData, section_no: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Section Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Anaesthetics"
                    value={formData.section_name}
                    onChange={(e) => setFormData({...formData, section_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sub Section No</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 1.1"
                    value={formData.sub_section_no}
                    onChange={(e) => setFormData({...formData, sub_section_no: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Medicine</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Halothane"
                    value={formData.medicine}
                    onChange={(e) => setFormData({...formData, medicine: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Level of Healthcare</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. P, S, T"
                    value={formData.level_of_healthcare}
                    onChange={(e) => setFormData({...formData, level_of_healthcare: e.target.value})}
                  />
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dosage form(s) and strength(s)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Liquid for inhalation"
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({...formData, dosage_form: e.target.value})}
                  />
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
                  disabled={isSubmittingMedicine}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center"
                >
                  {isSubmittingMedicine ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteMedicinesManager;
