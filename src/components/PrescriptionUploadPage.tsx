import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User as UserIcon,
  Search
} from 'lucide-react';
import { Prescription, User } from '../types';
import PrescriptionUploader from './PrescriptionUploader';

const PrescriptionUploadPage = ({ user }: { user: User }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/prescriptions', {
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
  }, []);

  // Ensure we only show prescriptions uploaded by this specific user
  // We use user.name here or uploader_id if available, depending on the backend response.
  // The backend currently returns uploader_name and uploader_id.
  const myPrescriptions = Array.isArray(prescriptions) ? prescriptions.filter(p => {
    return p.uploader_id === user.id || p.uploader_name === user.name;
  }) : [];

  const parseScore = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] pt-8 max-w-5xl mx-auto space-y-10 px-4">
      {/* Header Info Banner */}
      <div className="bg-white px-8 py-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Prescription Upload</h2>
          <p className="text-slate-500 font-medium mt-1">Securely upload and crop prescription images</p>
        </div>
        <div className="flex flex-col items-end space-y-1 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
          <div className="flex items-center text-slate-700 font-bold">
            <UserIcon size={16} className="mr-2 text-emerald-500" />
            {user.name}
          </div>
          <div className="flex items-center text-slate-500 text-sm font-medium">
            <Calendar size={14} className="mr-2" />
            {currentDate}
          </div>
        </div>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <PrescriptionUploader onUploadComplete={fetchPrescriptions} />
      </div>

      {/* My Uploaded Prescriptions Gallery */}
      <div className="pt-4">
        <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center">
          <FileText className="mr-3 text-emerald-500" />
          My Saved Prescriptions
          <span className="ml-3 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
            {myPrescriptions.length} Total
          </span>
        </h3>

        {myPrescriptions.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 border-dashed p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search size={32} className="text-slate-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-700">No Prescriptions Yet</h4>
            <p className="text-slate-400 mt-2 max-w-sm">
              Any prescriptions you upload will be securely saved and displayed here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPrescriptions.map(p => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img src={p.image_data} alt="Prescription" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${
                      p.status === 'EVALUATED' ? 'bg-emerald-500/90 text-white' : 
                      p.status === 'APPROVED' ? 'bg-blue-500/90 text-white' : 
                      'bg-amber-500/90 text-white'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{p.department || 'General'}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {p.prescription_date || new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {p.status === 'EVALUATED' && p.evaluation_result && parseScore(p.evaluation_result) && (
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</div>
                        <div className="text-2xl font-black text-emerald-500 leading-none">
                          {parseScore(p.evaluation_result)?.overall_score}<span className="text-sm text-slate-300">/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionUploadPage;
