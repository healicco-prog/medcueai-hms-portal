import React, { useState, useEffect, useRef } from 'react';
import { runDigitalPrescriptionAnalysis } from '../services/geminiService';
import { Tablet, Mic, StopCircle, FileText, Loader2, AlertTriangle, Printer, MessageCircle, Info } from 'lucide-react';
import { User } from '../types';

interface Medication {
  genericName: string;
  strength?: string;
  dosageForm?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  route?: string;
}

interface PrescriptionResult {
  patientDetails: {
    name?: string;
    age?: string;
    gender?: string;
    phone?: string;
  };
  clinicalInformation: {
    chiefComplaint?: string;
    findings?: string;
    provisionalDiagnosis?: string;
  };
  medications: Medication[];
  instructions: {
    dietaryAdvice?: string;
    lifestyleAdvice?: string;
    specialPrecautions?: string;
  };
  followUpDate?: string;
  validationAlerts: string[];
}

const DigitalPrescription = ({ user }: { user: User }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [error, setError] = useState('');
  // Web Speech API
  const [recognition, setRecognition] = useState<any>(null);
  
  const prescriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;

      recog.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + ' ' + finalTranscript.trim());
        }
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      if (recognition) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Speech Recognition is not supported in this browser. Please use Chrome.");
      }
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError("Please describe the patient and prescription details first.");
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await runDigitalPrescriptionAnalysis(inputText);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to process prescription.');
    } finally {
      setLoading(false);
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!result?.patientDetails?.phone) {
      alert("No patient phone number detected in the prescription to share via WhatsApp.");
      return;
    }
    
    const phone = result.patientDetails.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Dear ${result.patientDetails.name || 'Patient'}, this is your digital prescription from ${user.name}. Please follow the instructions and contact the clinic if needed.`);
    
    // Simulate opening WhatsApp web / deep link
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header (Hidden in Print) */}
      <div className="print:hidden bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Tablet className="mr-3 text-emerald-500" size={28} />
            Digital Prescription System (Digi Presc)
          </h2>
          <p className="text-slate-500 mt-2">Generate WHO-standardized digital prescriptions using voice or text.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Input Column (Hidden in print) */}
        <div className="print:hidden xl:col-span-5 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 flex flex-col h-[calc(100vh-14rem)] sticky top-28">
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold text-slate-800">1. Draft Prescription</h3>
            <button
              onClick={toggleListen}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
              <span>{isListening ? 'Recording...' : 'Voice Dictation'}</span>
            </button>
          </div>

          <p className="text-sm text-slate-500 shrink-0">Type or dictate patient details, diagnosis, and medications.</p>

          <textarea
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-slate-700 leading-relaxed custom-scrollbar"
            placeholder="E.g., Patient Ram Kumar, 45 year old male, phone 9876543210. Fever for 2 days. Diagnosis: Viral Fever. Rx Tab Paracetamol 500mg Oral 3 times a day for 5 days. Next visit after 5 days."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {error && <div className="text-red-500 text-sm font-medium shrink-0">{error}</div>}

          <button
            onClick={handleProcess}
            disabled={loading || !inputText.trim()}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" /> : <FileText />}
            <span>{loading ? 'Processing Prescription...' : 'Extract & Format Prescription'}</span>
          </button>
        </div>

        {/* Output Column - This part is what prints */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Validation Alerts (Hidden in print) */}
          {result?.validationAlerts && result.validationAlerts.length > 0 && (
            <div className="print:hidden bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm">
              <h4 className="flex items-center font-bold text-amber-800 mb-3">
                <AlertTriangle className="mr-2" size={20} />
                Validation Alerts (Please Review)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                {result.validationAlerts.map((alert, i) => (
                  <li key={i}>{alert}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-600 font-medium">Please update your draft on the left and extract again to fix these issues.</p>
            </div>
          )}

          {!result && !loading && (
            <div className="print:hidden bg-slate-50 border border-slate-200 border-dashed rounded-3xl h-[30rem] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Tablet size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-slate-500 mb-2">No Prescription Generated</p>
              <p className="max-w-md">Input details on the left and click Extract to generate a highly formatted, printable WHO-standard prescription.</p>
            </div>
          )}

          {loading && (
            <div className="print:hidden bg-slate-50 border border-slate-200 border-dashed rounded-3xl h-[30rem] flex flex-col items-center justify-center text-emerald-500 p-8 text-center">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="animate-pulse font-medium">Using AI to parse medical entities...</p>
            </div>
          )}

          {result && (
            <div className="relative">
              {/* Action Buttons Overlay (Hidden in print) */}
              <div className="print:hidden absolute -top-4 -right-4 flex space-x-2 z-10">
                <button 
                  onClick={handlePrint}
                  className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition"
                  title="Print to PDF"
                >
                  <Printer size={20} />
                </button>
                <button 
                  onClick={handleWhatsAppShare}
                  className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition"
                  title="Share via WhatsApp"
                >
                  <MessageCircle size={20} />
                </button>
              </div>

              {/* The Prescription Document */}
              <div ref={prescriptionRef} className="bg-white p-10 print:p-0 rounded-3xl shadow-xl border border-slate-200 print:shadow-none print:border-none w-full max-w-[210mm] mx-auto min-h-[297mm]">
                
                {/* Header */}
                <header className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">AIMSRC Hospital</h1>
                    <p className="text-sm text-slate-600">Devanahalli, Bangalore</p>
                    <p className="text-sm text-slate-600">Contact: +91 9876543210</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-800">Dr. {user.name}</h2>
                    <p className="text-sm text-slate-600">{user.designation || 'Doctor'}</p>
                    <p className="text-sm text-slate-600">Reg No: {user.id ? `KMC-${user.id}089` : 'Pending'}</p>
                  </div>
                </header>

                {/* Patient Details */}
                <section className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Patient Name</span>
                      <strong className="text-slate-800">{result.patientDetails.name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Age</span>
                      <strong className="text-slate-800">{result.patientDetails.age || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Gender</span>
                      <strong className="text-slate-800">{result.patientDetails.gender || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold">Date</span>
                      <strong className="text-slate-800">{new Date().toLocaleDateString()}</strong>
                    </div>
                  </div>
                </section>

                {/* Clinical Findings */}
                <section className="mb-8">
                  <div className="flex border-b border-slate-200 pb-2 mb-3">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest bg-white pr-4">Clinical Notes</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {result.clinicalInformation.chiefComplaint && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Chief Complaint:</span>
                        <p className="text-slate-600 leading-relaxed">{result.clinicalInformation.chiefComplaint}</p>
                      </div>
                    )}
                    {result.clinicalInformation.provisionalDiagnosis && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Diagnosis:</span>
                        <p className="text-slate-600 leading-relaxed">{result.clinicalInformation.provisionalDiagnosis}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Rx Section */}
                <section className="mb-10">
                  <div className="text-5xl text-slate-300 font-serif italic mb-4">Rx</div>
                  {result.medications.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">No medications prescribed.</p>
                  ) : (
                    <div className="space-y-6">
                      {result.medications.map((med, i) => (
                        <div key={i} className="flex flex-col border-b border-slate-100 pb-4 last:border-0 pl-4 border-l-2 border-l-emerald-200">
                          <div className="flex items-baseline space-x-2 mb-1">
                            <span className="font-bold text-lg text-slate-800">{med.genericName}</span>
                            {med.strength && <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-sm">{med.strength}</span>}
                            {med.dosageForm && <span className="text-slate-500 text-sm">({med.dosageForm})</span>}
                          </div>
                          <div className="text-sm text-slate-700 mt-1 flex flex-wrap gap-y-1 gap-x-4">
                            <span className="flex items-center"><strong className="mr-1 text-slate-500">Dose & Freq:</strong> {med.dose || '?'} • {med.frequency || '?'}</span>
                            <span className="flex items-center"><strong className="mr-1 text-slate-500">Route:</strong> {med.route || 'Oral'}</span>
                            <span className="flex items-center"><strong className="mr-1 text-slate-500">Duration:</strong> {med.duration || '?'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Advise & Follow-up */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 text-sm">
                  <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">Advice</h3>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {result.instructions.dietaryAdvice && <li>{result.instructions.dietaryAdvice}</li>}
                      {result.instructions.lifestyleAdvice && <li>{result.instructions.lifestyleAdvice}</li>}
                      {result.instructions.specialPrecautions && <li><span className="font-medium text-amber-700">Caution:</span> {result.instructions.specialPrecautions}</li>}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">Follow-up</h3>
                    <p className="text-slate-600">{result.followUpDate || 'As needed'}</p>
                  </div>
                </section>

                {/* Footer Signature */}
                <footer className="mt-auto pt-10 flex justify-between items-end border-t border-slate-200 text-slate-500 text-sm">
                  <div>
                    <p className="flex items-center"><Info size={14} className="mr-1" /> This is a digitally generated prescription.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-48 h-12 border-b border-slate-300 mb-2 border-dashed mx-auto"></div>
                    <p className="font-bold text-slate-700">Dr. {user.name}</p>
                    <p className="text-xs">Digital Signature</p>
                  </div>
                </footer>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalPrescription;
