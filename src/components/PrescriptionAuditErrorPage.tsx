import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Edit3, 
  BarChart2,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  Search
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Prescription, User } from '../types';
import { performOCR, evaluatePrescription } from '../services/geminiService';

const PrescriptionAuditErrorPage = ({ user }: { user: User }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [filterDept, setFilterDept] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/med-error-prescriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPrescriptions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetch('/api/departments')
      .then(res => res.json())
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesDept = filterDept === 'All' || p.department === filterDept;
    const matchesDate = !filterDate || p.prescription_date === filterDate;
    return matchesDept && matchesDate;
  });

  const handleApproveImage = async (id: number) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const ocrText = await performOCR(selectedPrescription!.image_data);
      
      await fetch(`/api/med-error-prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ raw_text: ocrText, verified_text: ocrText, status: 'OCR_COMPLETED' }),
      });
      
      fetchPrescriptions();
      setSelectedPrescription(prev => prev ? {...prev, status: 'OCR_COMPLETED', raw_text: ocrText, verified_text: ocrText} : null);
      setEditingText(ocrText);
    } catch (e) {
      console.error(e);
      alert('Failed to process image. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEvaluate = async (id: number) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const evaluation = await evaluatePrescription(editingText);
      
      await fetch(`/api/med-error-prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified_text: editingText, evaluation_result: evaluation, status: 'EVALUATED' }),
      });

      fetchPrescriptions();
      setSelectedPrescription(prev => prev ? {...prev, status: 'EVALUATED', verified_text: editingText, evaluation_result: JSON.stringify(evaluation)} : null);
      setShowReport(true);
    } catch (e) {
      console.error(e);
      alert('Evaluation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Medication Error Audit</h2>
          <p className="text-slate-500 font-medium mt-1">AI-powered analysis and scoring of medication error prescriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* List Section */}
        <div className="lg:col-span-1 space-y-6 print:hidden">

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 flex items-center">
                <BarChart2 className="mr-2 text-blue-500" size={18} />
                Recent Audits
              </h4>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex flex-col xl:flex-row gap-2">
                <select 
                  className="w-full xl:w-1/2 text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="All">All Depts</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <input 
                  type="date" 
                  className="w-full xl:w-1/2 text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPrescriptions.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => {
                    setSelectedPrescription(p);
                    setEditingText(p.verified_text || p.raw_text || '');
                    setShowReport(p.status === 'EVALUATED');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPrescription?.id === p.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 w-full min-w-0 pr-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      p.status === 'EVALUATED' ? 'bg-emerald-500' : 
                      p.status === 'OCR_COMPLETED' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate mb-1">
                        {p.uploader_name || 'System User'} • {p.department || 'General'}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>{p.prescription_date || new Date(p.created_at).toLocaleDateString()}</span>
                        {p.status === 'EVALUATED' && p.evaluation_result ? (
                          <span className="text-emerald-500 font-bold shrink-0 ml-2">Score: {JSON.parse(p.evaluation_result).overall_score}/10</span>
                        ) : (
                          <span className="shrink-0 ml-2 uppercase">{p.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0 ml-2" />
                </div>
              ))}
              {filteredPrescriptions.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">No prescriptions found</p>
              )}
            </div>
          </div>
        </div>

        {/* Detail Section */}
        <div className="lg:col-span-3 print:col-span-4">
          {selectedPrescription ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
                <h3 className="font-bold text-slate-800">Prescription Details #{selectedPrescription.id}</h3>
                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedPrescription.status === 'EVALUATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {selectedPrescription.status}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-8 print:p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Original Image</h4>
                    <div className="aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                      <img src={selectedPrescription.image_data} alt="Prescription" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Extracted Text</h4>
                    <textarea 
                      className="w-full h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm leading-relaxed"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      disabled={selectedPrescription.status === 'EVALUATED'}
                    />
                    {selectedPrescription.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApproveImage(selectedPrescription.id)}
                        disabled={isProcessing}
                        className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center"
                      >
                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={20} className="mr-2" />}
                        Approve Image & Extract Text
                      </button>
                    )}
                    {selectedPrescription.status === 'OCR_COMPLETED' && (
                      <button 
                        onClick={() => handleEvaluate(selectedPrescription.id)}
                        disabled={isProcessing}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center"
                      >
                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={20} className="mr-2" />}
                        Approve Text & Evaluate
                      </button>
                    )}
                  </div>
                </div>

                {selectedPrescription.status === 'EVALUATED' && selectedPrescription.evaluation_result && (
                  <div className="mt-8 p-8 bg-slate-900 text-white rounded-3xl space-y-6 print:bg-white print:text-slate-900 print:mt-0 print:p-0">
                    <div className="flex justify-between items-center border-b border-white/10 print:border-slate-200 pb-4">
                      <h4 className="text-xl font-bold text-emerald-400 print:text-emerald-700">Prescription Audit Report</h4>
                      <div className="text-right flex items-center space-x-4">
                        <button 
                          onClick={handlePrint}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all print:hidden"
                        >
                          Print Report
                        </button>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest print:text-slate-500">Overall Score</p>
                          <p className="text-3xl font-black text-white print:text-slate-900">
                            {JSON.parse(selectedPrescription.evaluation_result).overall_score}/100 <span className="text-lg font-bold text-slate-400 print:text-slate-500">(in %)</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(JSON.parse(selectedPrescription.evaluation_result).scores).map(([key, val]: any) => (
                        <div key={key} className="bg-white/5 p-4 rounded-2xl border border-white/10 print:bg-slate-50 print:border-slate-200">
                          <p className="text-[10px] text-slate-400 uppercase truncate print:text-slate-500">{key.replace('_', ' ')}</p>
                          <p className="text-lg font-bold print:text-slate-900">{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h5 className="font-bold text-emerald-400 flex items-center text-sm mb-4 print:text-emerald-700">
                        <CheckCircle size={16} className="mr-2" />
                        WHO Critical Criteria Audit
                      </h5>
                      <div className="overflow-x-auto rounded-xl border border-white/10 print:border-slate-200">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs uppercase bg-white/5 border-b border-white/10 text-slate-400 print:bg-slate-50 print:border-slate-200 print:text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-medium">SN</th>
                              <th className="px-4 py-3 font-medium">Criteria</th>
                              <th className="px-4 py-3 font-medium text-center">Fulfilled</th>
                              <th className="px-4 py-3 font-medium">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {JSON.parse(selectedPrescription.evaluation_result).who_criteria_audit?.map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors print:border-b print:border-slate-100">
                                <td className="px-4 py-3 text-slate-400 print:text-slate-600">{item.sn || i + 1}</td>
                                <td className="px-4 py-3 text-slate-300 max-w-xs print:text-slate-800">{item.criterion}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold print:-mx-1 ${
                                    item.fulfilled === 'Y' ? 'bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-700' : 
                                    item.fulfilled === 'N' ? 'bg-red-500/20 text-red-400 print:bg-red-100 print:text-red-700' : 
                                    'bg-slate-500/20 text-slate-400 print:bg-slate-100 print:text-slate-600'
                                  }`}>
                                    {item.fulfilled}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs print:text-slate-600">{item.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4 print:mt-6">
                      <h5 className="font-bold text-emerald-400 flex items-center text-sm print:text-emerald-700">
                        <AlertCircle size={16} className="mr-2" />
                        Recommendations
                      </h5>
                      <ul className="space-y-2">
                        {JSON.parse(selectedPrescription.evaluation_result).recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start print:text-slate-700">
                            <span className="mr-2 text-emerald-500 print:text-emerald-600">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed p-20">
              <FileText size={64} className="mb-4 opacity-20" />
              <p>Select a prescription to view details or upload a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionAuditErrorPage;
