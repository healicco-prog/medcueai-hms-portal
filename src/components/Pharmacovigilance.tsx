import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Send, 
  Filter, 
  CheckCircle, 
  Clock,
  ChevronRight,
  X,
  Trash2,
  Check,
  Camera,
  Edit,
  Printer
} from 'lucide-react';
import { User, ADRReport, SuspectedMedication, ConcomitantMedication } from '../types';
import { PharmacovigilancePrint } from './PharmacovigilancePrint';

const Pharmacovigilance = ({ user }: { user: User }) => {
  const [reports, setReports] = useState<ADRReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [printReport, setPrintReport] = useState<ADRReport | null>(null);
  
  const [formData, setFormData] = useState({
    id: null as number | null,
    patient_name: '',
    patient_initials: '',
    age: '',
    dob: '',
    gender: 'Male',
    weight: '',
    reaction_details: '',
    reaction_start_date: '',
    reaction_stop_date: '',
    reaction_management: '',
    suspected_drug: '',
    suspected_meds: [{
      name: '',
      manufacturer: '',
      batch_no: '',
      expiry_date: '',
      dose: '',
      route: '',
      frequency: '',
      date_started: '',
      date_stopped: '',
      indication: '',
      causality: '',
      action_taken: '',
      reintroduction_result: '',
      reintroduction_dose: ''
    }] as SuspectedMedication[],
    seriousness: 'No',
    outcome: 'Recovering',
    amc_reg_no: '',
    amc_report_no: '',
    worldwide_unique_no: '',
    concomitant_meds: [{
      name: '',
      dose: '',
      route: '',
      frequency: '',
      date_started: '',
      date_stopped: '',
      indication: ''
    }] as ConcomitantMedication[],
    relevant_investigations: '',
    medical_history: '',
    reporter_name: user.name,
    reporter_address: '',
    reporter_pin: '',
    reporter_email: user.email,
    reporter_contact: '',
    reporter_occupation: user.designation || '',
    reporter_department: user.department || '',
    death_date: '',
    reporter_signature: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/adr', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/adr/${formData.id}` : '/api/adr';
      
      await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setStep(1);
      setFormData({
        id: null,
        patient_name: '',
        patient_initials: '',
        age: '',
        dob: '',
        gender: 'Male',
        weight: '',
        reaction_details: '',
        reaction_start_date: '',
        reaction_stop_date: '',
        reaction_management: '',
        suspected_drug: '',
        suspected_meds: [{
          name: '',
          manufacturer: '',
          batch_no: '',
          expiry_date: '',
          dose: '',
          route: '',
          frequency: '',
          date_started: '',
          date_stopped: '',
          indication: '',
          causality: '',
          action_taken: '',
          reintroduction_result: '',
          reintroduction_dose: ''
        }],
        seriousness: 'No',
        outcome: 'Recovering',
        amc_reg_no: '',
        amc_report_no: '',
        worldwide_unique_no: '',
        concomitant_meds: [{
          name: '',
          dose: '',
          route: '',
          frequency: '',
          date_started: '',
          date_stopped: '',
          indication: ''
        }],
        relevant_investigations: '',
        medical_history: '',
        reporter_name: user.name,
        reporter_address: '',
        reporter_pin: '',
        reporter_email: user.email,
        reporter_contact: '',
        reporter_occupation: user.designation || '',
        reporter_department: user.department || '',
        death_date: '',
        reporter_signature: '',
        report_date: new Date().toISOString().split('T')[0]
      });
      fetchReports();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Remove white/light background
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          if (r > 200 && g > 200 && b > 200) {
            data[i+3] = 0; // Set alpha to 0 for light pixels
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const processedImage = canvas.toDataURL('image/png');
        setFormData(prev => ({ ...prev, reporter_signature: processedImage }));
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const addMedication = () => {
    const newMed: SuspectedMedication = {
      name: '',
      manufacturer: '',
      batch_no: '',
      expiry_date: '',
      dose: '',
      route: '',
      frequency: '',
      date_started: '',
      date_stopped: '',
      indication: '',
      causality: '',
      action_taken: '',
      reintroduction_result: '',
      reintroduction_dose: ''
    };
    setFormData({
      ...formData,
      suspected_meds: [...formData.suspected_meds, newMed]
    });
  };

  const removeMedication = (index: number) => {
    const newMeds = [...formData.suspected_meds];
    newMeds.splice(index, 1);
    setFormData({ ...formData, suspected_meds: newMeds });
  };

  const updateMedication = (index: number, field: keyof SuspectedMedication, value: string) => {
    const newMeds = [...formData.suspected_meds];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setFormData({ ...formData, suspected_meds: newMeds });
  };

  const addConcomitantMedication = () => {
    const newMed: ConcomitantMedication = {
      name: '',
      dose: '',
      route: '',
      frequency: '',
      date_started: '',
      date_stopped: '',
      indication: ''
    };
    setFormData({
      ...formData,
      concomitant_meds: [...formData.concomitant_meds, newMed]
    });
  };

  const removeConcomitantMedication = (index: number) => {
    const newMeds = [...formData.concomitant_meds];
    newMeds.splice(index, 1);
    setFormData({ ...formData, concomitant_meds: newMeds });
  };

  const updateConcomitantMedication = (index: number, field: keyof ConcomitantMedication, value: string) => {
    const newMeds = [...formData.concomitant_meds];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setFormData({ ...formData, concomitant_meds: newMeds });
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="font-bold bg-[#A61E1A] text-white p-2 mt-2">A. PATIENT INFORMATION *</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Patient Name</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Patient Initials</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.patient_initials} onChange={(e) => setFormData({ ...formData, patient_initials: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Age</label>
                <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Weight (kg)</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-bold bg-[#A61E1A] text-white p-2 mt-2">B. SUSPECTED ADVERSE EVENT/ REACTION *</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-normal text-black"><strong>5.</strong> Event / Reaction start date (dd/mm/yyyy)</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reaction_start_date} onChange={(e) => setFormData({ ...formData, reaction_start_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-normal text-black"><strong>6.</strong> Event / Reaction stop date (dd/mm/yyyy)</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reaction_stop_date} onChange={(e) => setFormData({ ...formData, reaction_stop_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-normal text-black"><strong>7.</strong> Describe Event/Reaction management with details , if any</label>
              <textarea rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reaction_management} onChange={(e) => setFormData({ ...formData, reaction_management: e.target.value })} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#A61E1A] text-white p-2 mt-2 mb-4">
              <h4 className="font-bold">C. SUSPECTED MEDICATION(S) *</h4>
              <button 
                type="button"
                onClick={addMedication}
                className="text-xs bg-white text-[#A61E1A] px-3 py-1 rounded-full font-bold hover:bg-slate-100 transition-colors flex items-center"
              >
                <Plus size={14} className="mr-1" /> Add Medication
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-2 border border-slate-200 w-10 text-center">S.No</th>
                    <th className="p-2 border border-slate-200 min-w-[150px]">8. Name (Brand/Generic)</th>
                    <th className="p-2 border border-slate-200">Manufacturer</th>
                    <th className="p-2 border border-slate-200">Batch/Lot No</th>
                    <th className="p-2 border border-slate-200">Expiry Date</th>
                    <th className="p-2 border border-slate-200">Dose</th>
                    <th className="p-2 border border-slate-200">Route</th>
                    <th className="p-2 border border-slate-200">Frequency</th>
                    <th className="p-2 border border-slate-200">Date Started</th>
                    <th className="p-2 border border-slate-200">Date Stopped</th>
                    <th className="p-2 border border-slate-200">Indication</th>
                    <th className="p-2 border border-slate-200">Causality</th>
                    <th className="p-2 border border-slate-200 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.suspected_meds.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-4 text-center text-slate-400 italic">No medications added. Click "Add Medication" to start.</td>
                    </tr>
                  ) : formData.suspected_meds.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                        {['i', 'ii', 'iii', 'iv', 'v', 'vi'][idx] || idx + 1}
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.name} onChange={(e) => updateMedication(idx, 'name', e.target.value)} placeholder="Drug Name" />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.manufacturer} onChange={(e) => updateMedication(idx, 'manufacturer', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.batch_no} onChange={(e) => updateMedication(idx, 'batch_no', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.expiry_date} onChange={(e) => updateMedication(idx, 'expiry_date', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.dose} onChange={(e) => updateMedication(idx, 'dose', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.route} onChange={(e) => updateMedication(idx, 'route', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.frequency} onChange={(e) => updateMedication(idx, 'frequency', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="date" className="w-full p-1 outline-none focus:bg-red-50" value={med.date_started} onChange={(e) => updateMedication(idx, 'date_started', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="date" className="w-full p-1 outline-none focus:bg-red-50" value={med.date_stopped} onChange={(e) => updateMedication(idx, 'date_stopped', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.indication} onChange={(e) => updateMedication(idx, 'indication', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200">
                        <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.causality} onChange={(e) => updateMedication(idx, 'causality', e.target.value)} />
                      </td>
                      <td className="p-1 border border-slate-200 text-center">
                        <button type="button" onClick={() => removeMedication(idx)} className="text-red-400 hover:text-[#C13F38]"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 mt-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">9. Action taken after event/ reaction (please tick)</label>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 border border-slate-200 w-16 text-center">S. No. as per C</th>
                      <th className="p-2 border border-slate-200">Drug withdrawn</th>
                      <th className="p-2 border border-slate-200">Dose increased</th>
                      <th className="p-2 border border-slate-200">Dose reduced</th>
                      <th className="p-2 border border-slate-200">Dose not changed</th>
                      <th className="p-2 border border-slate-200">Not applicable</th>
                      <th className="p-2 border border-slate-200">Unknown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.suspected_meds.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                          {['i', 'ii', 'iii', 'iv', 'v', 'vi'][idx] || idx + 1}
                        </td>
                        {['Drug withdrawn', 'Dose increased', 'Dose reduced', 'Dose not changed', 'Not applicable', 'Unknown'].map((action) => (
                          <td key={action} className="p-2 border border-slate-200 text-center">
                            <input 
                              type="radio" 
                              name={`action_${idx}`} 
                              checked={med.action_taken === action}
                              onChange={() => updateMedication(idx, 'action_taken', action)}
                              className="w-4 h-4 accent-red-500 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">10. Event/ Reaction reappeared after reintroduction of suspected medication (please tick)</label>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 border border-slate-200 w-16 text-center">S. No. as per C</th>
                      <th className="p-2 border border-slate-200">Yes</th>
                      <th className="p-2 border border-slate-200">No</th>
                      <th className="p-2 border border-slate-200">Effect unknown</th>
                      <th className="p-2 border border-slate-200">Dose (if re-introduced)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.suspected_meds.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-400">
                          {['i', 'ii', 'iii', 'iv', 'v', 'vi'][idx] || idx + 1}
                        </td>
                        {['Yes', 'No', 'Effect unknown'].map((result) => (
                          <td key={result} className="p-2 border border-slate-200 text-center">
                            <input 
                              type="radio" 
                              name={`reintro_${idx}`} 
                              checked={med.reintroduction_result === result}
                              onChange={() => updateMedication(idx, 'reintroduction_result', result)}
                              className="w-4 h-4 accent-red-500 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="p-1 border border-slate-200">
                          <input 
                            type="text" 
                            className="w-full p-1 outline-none focus:bg-red-50 text-center" 
                            value={med.reintroduction_dose} 
                            onChange={(e) => updateMedication(idx, 'reintroduction_dose', e.target.value)}
                            placeholder="Dose..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase">11. Concomitant medical product including self-medication and herbal remedies with therapy dates (Exclude those used to treat event/ reaction)</label>
                <button type="button" onClick={addConcomitantMedication} className="flex items-center gap-1 text-[10px] bg-red-50 text-[#C13F38] px-2 py-1 rounded border border-red-200 hover:bg-red-100">
                  <Plus size={12} /> Add Concomitant
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 border border-slate-200 w-12 text-center" rowSpan={2}>S. No.</th>
                      <th className="p-2 border border-slate-200" rowSpan={2}>Name (Brand / Generic)</th>
                      <th className="p-2 border border-slate-200" rowSpan={2}>Dose</th>
                      <th className="p-2 border border-slate-200" rowSpan={2}>Route</th>
                      <th className="p-2 border border-slate-200" rowSpan={2}>Frequency (OD, BD, etc.)</th>
                      <th className="p-2 border border-slate-200 text-center" colSpan={2}>Therapy Dates</th>
                      <th className="p-2 border border-slate-200" rowSpan={2}>Indication</th>
                      <th className="p-2 border border-slate-200 w-10" rowSpan={2}></th>
                    </tr>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-2 border border-slate-200 text-center">Date Started</th>
                      <th className="p-2 border border-slate-200 text-center">Date Stopped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.concomitant_meds.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1 border border-slate-200 text-center font-bold text-slate-400">
                          {['i', 'ii', 'iii', 'iv', 'v', 'vi'][idx] || idx + 1}
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.name} onChange={(e) => updateConcomitantMedication(idx, 'name', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.dose} onChange={(e) => updateConcomitantMedication(idx, 'dose', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.route} onChange={(e) => updateConcomitantMedication(idx, 'route', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.frequency} onChange={(e) => updateConcomitantMedication(idx, 'frequency', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="date" className="w-full p-1 outline-none focus:bg-red-50" value={med.date_started} onChange={(e) => updateConcomitantMedication(idx, 'date_started', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="date" className="w-full p-1 outline-none focus:bg-red-50" value={med.date_stopped} onChange={(e) => updateConcomitantMedication(idx, 'date_stopped', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200">
                          <input type="text" className="w-full p-1 outline-none focus:bg-red-50" value={med.indication} onChange={(e) => updateConcomitantMedication(idx, 'indication', e.target.value)} />
                        </td>
                        <td className="p-1 border border-slate-200 text-center">
                          <button type="button" onClick={() => removeConcomitantMedication(idx)} className="text-red-400 hover:text-[#C13F38]"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 font-sans text-black">
            <div className="border-2 border-black bg-white select-none shadow-sm">
              <div className="bg-[#460100] text-white text-center font-bold py-1.5 text-[15px] uppercase tracking-wider border-b-2 border-black">
                FOR AMC / NCC USE ONLY
              </div>
              
              {/* Reg No */}
              <div className="border-b-2 border-black flex items-center min-h-[36px]">
                <div className="font-bold text-[14px] pl-2 pr-1 whitespace-nowrap">
                  Reg. No. / IPD No. / OPD No. / CR No. :
                </div>
                <input type="text" className="flex-1 px-2 outline-none bg-transparent font-medium" value={formData.amc_reg_no} onChange={(e) => setFormData({ ...formData, amc_reg_no: e.target.value })} />
              </div>

              {/* AMC Report No */}
              <div className="border-b-2 border-black flex items-center min-h-[36px]">
                <div className="font-bold text-[14px] pl-2 pr-1 whitespace-nowrap min-w-[280px] flex justify-between">
                  <span>AMC Report No.</span>
                  <span>:</span>
                </div>
                <input type="text" className="flex-1 px-2 outline-none bg-transparent font-medium" value={formData.amc_report_no} onChange={(e) => setFormData({ ...formData, amc_report_no: e.target.value })} />
              </div>

              {/* Worldwide Unique No */}
              <div className="border-b-2 border-black flex items-center min-h-[36px]">
                <div className="font-bold text-[14px] pl-2 pr-1 whitespace-nowrap min-w-[280px] flex justify-between">
                  <span>Worldwide Unique No.</span>
                  <span>:</span>
                </div>
                <input type="text" className="flex-1 px-2 outline-none bg-transparent font-medium" value={formData.worldwide_unique_no} onChange={(e) => setFormData({ ...formData, worldwide_unique_no: e.target.value })} />
              </div>
              
              {/* 12. Relevant investigations */}
              <div className="border-b-2 border-black p-1.5 min-h-[160px] flex flex-col">
                <div className="text-[15px]">
                  <span className="font-bold">12. </span> Relevant investigations with dates :
                </div>
                <textarea className="flex-1 w-full outline-none bg-transparent resize-none mt-1 text-[15px] px-6 font-medium" value={formData.relevant_investigations} onChange={(e) => setFormData({ ...formData, relevant_investigations: e.target.value })} />
              </div>

              {/* 13. Relevant medical */}
              <div className="border-b-2 border-black p-1.5 min-h-[160px] flex flex-col">
                <div className="text-[15px]">
                  <span className="font-bold">13. </span> Relevant medical / medication history (e.g. allergies,
                  <br/>
                  pregnancy, addiction, hepatic, renal dysfunction etc.)
                </div>
                <textarea className="flex-1 w-full outline-none bg-transparent resize-none mt-1 text-[15px] px-6 font-medium" value={formData.medical_history} onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })} />
              </div>

              {/* 14. Seriousness */}
              <div className="border-b-2 border-black p-1.5 text-[15px] pb-3">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="font-bold">14. </span> Seriousness of the reaction : 
                  <span>No</span>
                  <div 
                    className="w-[28px] h-[28px] border-[3px] border-black flex items-center justify-center cursor-pointer transition-all hover:bg-slate-100"
                    onClick={() => setFormData({...formData, seriousness: 'No'})}
                  >
                    {formData.seriousness === 'No' && <Check size={22} strokeWidth={4} color="black" />}
                  </div>
                  <span className="ml-[2px] tracking-tight">If Yes</span>
                  <div 
                    className="w-[28px] h-[28px] border-[3px] border-black flex items-center justify-center cursor-pointer transition-all hover:bg-slate-100"
                    onClick={() => setFormData({...formData, seriousness: 'Yes'})}
                  >
                    {formData.seriousness !== 'No' && formData.seriousness !== '' && <Check size={22} strokeWidth={4} color="black" />}
                  </div>
                  <span className="italic tracking-tight">(please tick anyone)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 ml-[8px] max-w-2xl font-medium tracking-tight">
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, seriousness: 'Death'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Death' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span className="flex items-center gap-1 flex-wrap">
                      Death 
                      <input 
                        type="date" 
                        title="Death Date"
                        className={`outline-none border-b border-black/30 bg-transparent text-sm max-w-[125px] pl-1 transition-opacity ${formData.seriousness === 'Death' ? 'opacity-100 border-black' : 'opacity-40 pointer-events-none'}`}
                        value={formData.death_date || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setFormData({...formData, death_date: e.target.value})}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer ml-4 group" onClick={() => setFormData({...formData, seriousness: 'Congenital-anomaly'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Congenital-anomaly' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Congenital-anomaly</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, seriousness: 'Life threatening'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Life threatening' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Life threatening</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer ml-4 group" onClick={() => setFormData({...formData, seriousness: 'Disability'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Disability' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Disability</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, seriousness: 'Hospitalization'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Hospitalization' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Hospitalization-Initial/Prolonged</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer ml-4 group" onClick={() => setFormData({...formData, seriousness: 'Other Medically important'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.seriousness === 'Other Medically important' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Other Medically important</span>
                  </div>
                </div>
              </div>

              {/* 15. Outcome */}
              <div className="p-1.5 text-[15px] pb-3">
                <div className="mb-2">
                  <span className="font-bold">15. </span> Outcome:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 ml-[8px] max-w-3xl font-medium tracking-tight gap-x-1">
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Recovered'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Recovered' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Recovered</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Recovering'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Recovering' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Recovering</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Not Recovered'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Not Recovered' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span className="whitespace-nowrap">Not Recovered</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Fatal'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Fatal' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Fatal</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Recovered with sequelae'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Recovered with sequelae' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span className="whitespace-nowrap">Recovered with sequelae</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setFormData({...formData, outcome: 'Unknown'})}>
                    <div className="w-[28px] h-[28px] border-[3px] border-black flex shrink-0 items-center justify-center group-hover:bg-slate-100">
                      {formData.outcome === 'Unknown' && <Check size={22} strokeWidth={4} color="black" />}
                    </div>
                    <span>Unknown</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h4 className="font-bold bg-[#A61E1A] text-white p-2 mt-2 mb-4">E. REPORTER DETAILS *</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Reporter Name</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_name} onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Designation</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_occupation} onChange={(e) => setFormData({ ...formData, reporter_occupation: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_department || ''} onChange={(e) => setFormData({ ...formData, reporter_department: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_email} onChange={(e) => setFormData({ ...formData, reporter_email: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_address} onChange={(e) => setFormData({ ...formData, reporter_address: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">PIN Code</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_pin} onChange={(e) => setFormData({ ...formData, reporter_pin: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Contact No</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.reporter_contact} onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date of Report</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#E34A42]" value={formData.report_date} onChange={(e) => setFormData({ ...formData, report_date: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Signature</label>
                {formData.reporter_signature ? (
                  <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 inline-block w-full">
                    <img src={formData.reporter_signature} alt="Signature" className="h-20 w-full object-contain mix-blend-multiply" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, reporter_signature: ''})} 
                      className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 hover:bg-slate-900 shadow transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 hover:border-[#E34A42] transition-all group">
                    <div className="flex flex-col items-center">
                      <Camera size={26} className="text-slate-400 group-hover:text-[#E34A42] mb-1.5" />
                      <span className="text-sm text-slate-500 font-medium group-hover:text-slate-700 text-center leading-tight">Capture or Upload Signature<br/><span className="text-[10px] text-slate-400 font-normal">Background will be removed seamlessly</span></span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleSignatureUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pharmacovigilance MS</h2>
          <p className="text-slate-500">Monitor and report Adverse Drug Events/ Reactions (ADR)</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setStep(1); }}
          className="flex items-center px-6 py-3 bg-[#E34A42] text-white rounded-2xl font-bold shadow-lg shadow-[#E34A42]/20 hover:bg-[#C13F38] transition-all"
        >
          <Plus size={20} className="mr-2" />
          Report ADR
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white p-4 md:p-6 relative border-b-4 border-[#A61E1A] flex flex-col items-center shrink-0">
              <button 
                onClick={() => setShowForm(false)} 
                className="absolute top-2 right-2 md:top-4 md:right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors z-10"
              >
                <X size={24} />
              </button>
              <div className="absolute top-4 right-12 md:top-6 md:right-16 text-[10px] md:text-sm font-bold text-black font-serif z-10">
                Version 1.4
              </div>
              
              <div className="flex flex-col md:flex-row w-full items-center justify-center mt-8 md:mt-2 mx-auto md:space-x-4">
                <div className="flex flex-col items-center justify-center shrink-0 w-20 md:w-28 mb-4 md:mb-0">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="h-12 md:h-16 mb-1" />
                  <div className="text-[7px] md:text-[9px] leading-none text-center font-bold text-slate-800">सत्यमेव जयते</div>
                  <div className="text-2xl md:text-3xl font-black text-[#56B5E8] tracking-tighter mt-1" style={{ fontFamily: "serif", WebkitTextStroke: "1px #888" }}>IPC</div>
                </div>
                
                <div className="flex-1 text-center font-serif px-2 md:px-0">
                  <h2 className="text-base md:text-[22px] leading-tight md:leading-normal font-black uppercase text-black mb-2 md:mb-1 tracking-tight" style={{wordSpacing: '0.1em'}}>
                    Suspected Adverse Drug Reaction Reporting Form
                  </h2>
                  <p className="text-xs md:text-sm font-medium text-black mb-1">
                    For <span className="font-bold">VOLUNTARY</span> reporting of ADRs by Healthcare Professionals
                  </p>
                  <p className="text-xs md:text-sm font-medium text-black mb-1 flex flex-col md:block">
                    <span className="font-bold">INDIAN PHARMACOPOEIA COMMISSION</span>{' '}
                    <span className="text-slate-700">(National Coordination Centre-Pharmacovigilance Programme of India)</span>
                  </p>
                  <p className="text-[10px] md:text-sm text-slate-800 mb-1">
                    Ministry of Health &amp; Family Welfare, Government of India, Sector-23, Raj Nagar, Ghaziabad-201002
                  </p>
                  <p className="text-xs md:text-sm text-black flex flex-col md:block">
                    <span className="font-bold">PvPI Helpline (Toll Free) : 1800-180-3024</span>{' '}
                    <span className="text-slate-700">(9:00 AM to 5:30 PM, Monday-Friday)</span>
                  </p>
                </div>

                {/* Empty div on desktop to precisely center the text relative to the logo */}
                <div className="hidden md:block w-20 md:w-28 shrink-0"></div>
              </div>
            </div>
            
            <div className="overflow-y-auto p-8 flex-1">
              <div className="mb-8 flex justify-between">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-[#E34A42] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {s}
                  </div>
                ))}
              </div>
              
              {renderStep()}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between shrink-0">
              <button 
                type="button"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Previous
              </button>
              {step < 5 ? (
                <button 
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-8 py-3 bg-[#E34A42] text-white font-bold rounded-xl shadow-lg shadow-[#E34A42]/20 hover:bg-[#C13F38] transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center"
                >
                  <Send size={20} className="mr-2" />
                  Submit Official Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {reports.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p>No ADR reports found. Start by reporting a new event/ reaction.</p>
          </div>
        ) : reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 text-[#C13F38] rounded-2xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{report.patient_name || report.patient_initials} ({report.age}y {report.dob ? `/ ${report.dob}` : ''}, {report.gender})</h4>
                <p className="text-sm text-slate-500">Suspected: <span className="font-medium text-slate-700">
                  {report.suspected_meds?.map((m: any) => m.name).join(', ') || report.suspected_drug}
                </span></p>
                <div className="flex items-center mt-1 space-x-3">
                  <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.seriousness !== 'No' ? 'bg-red-100 text-[#C13F38]' : 'bg-slate-100 text-slate-500'}`}>
                    {report.seriousness !== 'No' ? 'Serious' : 'Non-Serious'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <button 
                onClick={() => setPrintReport(report)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                title="View/Print PDF"
              >
                <Printer size={16} /> <span className="hidden md:inline">Print</span>
              </button>
              <button 
                onClick={() => {
                  setFormData({
                    ...report,
                    suspected_meds: Array.isArray(report.suspected_meds) && report.suspected_meds.length > 0 ? report.suspected_meds : [{ name: '', manufacturer: '', batch_no: '', expiry_date: '', dose: '', route: '', frequency: '', date_started: '', date_stopped: '', indication: '', causality: '', action_taken: '', reintroduction_result: '', reintroduction_dose: '' }],
                    concomitant_meds: Array.isArray(report.concomitant_meds) && report.concomitant_meds.length > 0 ? report.concomitant_meds : [{ name: '', dose: '', route: '', frequency: '', date_started: '', date_stopped: '', indication: '' }]
                  } as any);
                  setStep(1);
                  setShowForm(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold transition-colors"
                title="Edit Report"
              >
                <Edit size={16} /> <span className="hidden md:inline">Edit</span>
              </button>
              <div className="text-right hidden md:block">
                <span className="px-3 py-1 bg-red-50 text-[#C13F38] rounded-full text-xs font-bold uppercase tracking-wider">
                  {report.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {printReport && (
        <PharmacovigilancePrint report={printReport} onClose={() => setPrintReport(null)} />
      )}
    </div>
  );
};

export default Pharmacovigilance;

