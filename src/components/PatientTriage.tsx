import React, { useState, useEffect } from 'react';
import { runPatientTriageAnalysis } from '../services/geminiService';
import { Stethoscope, Mic, StopCircle, Upload, Loader2, AlertTriangle, Building, Languages, FileText, CheckCircle2 } from 'lucide-react';

interface TriageResult {
  detectedLanguage: string;
  translatedText: string;
  symptoms: string[];
  primaryDepartment: string;
  secondaryDepartment: string;
  triagePriority: string;
  reasoning: string;
}

const PatientTriage = ({ user }: { user: any }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState('');
  // Web Speech API
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      
      // Let it automatically detect language or we can leave it to the browser's default.
      // Usually, it's better to leave it to the OS default if the user might speak multiple regional languages, 
      // or we can set it to 'hi-IN' etc if selected. We'll leave it default for maximum compatibility.

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
      setError("Please describe the symptoms first.");
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await runPatientTriageAnalysis(inputText);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze symptoms.');
    } finally {
      setLoading(false);
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('emergency')) return 'bg-red-100 border-red-200 text-red-700';
    if (p.includes('urgent') && !p.includes('semi')) return 'bg-orange-100 border-orange-200 text-orange-700';
    if (p.includes('semi-urgent')) return 'bg-yellow-100 border-yellow-200 text-yellow-700';
    return 'bg-emerald-100 border-emerald-200 text-emerald-700';
  };

  const getPriorityIcon = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes('emergency')) return <AlertTriangle className="text-red-500" size={24} />;
    if (p.includes('urgent') && !p.includes('semi')) return <AlertTriangle className="text-orange-500" size={24} />;
    if (p.includes('semi-urgent')) return <Upload className="text-yellow-500" size={24} />; // Placeholder
    return <CheckCircle2 className="text-emerald-500" size={24} />;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Stethoscope className="mr-3 text-blue-500" size={28} />
            AI-Powered Hospital Triage Assistant
          </h2>
          <p className="text-slate-500 mt-2">Route patients to the correct department based on symptoms in any language.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">1. Patient Input</h3>
            <button
              onClick={toggleListen}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
              <span>{isListening ? 'Recording...' : 'Voice Dictation'}</span>
            </button>
          </div>

          <p className="text-sm text-slate-500">Type symptoms or use voice dictation in English, Hindi, Kannada, Tamil, Telugu, etc.</p>

          <textarea
            className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700 leading-relaxed custom-scrollbar"
            placeholder="E.g., The patient complains of severe chest pain that radiates to the left arm for the past 2 hours. Accompanied by sweating and shortness of breath..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <button
            onClick={handleProcess}
            disabled={loading || !inputText.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Stethoscope />}
            <span>{loading ? 'Analyzing Symptoms...' : 'Analyze & Triage'}</span>
          </button>
        </div>

        {/* Output Column */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <h3 className="text-lg font-bold text-white relative z-10">2. Clinical Triage Results</h3>
          
          {!result && !loading && (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 relative z-10">
              <Upload size={48} className="mb-4 opacity-50" />
              <p>Enter symptoms and run analysis to see triage results.</p>
            </div>
          )}

          {loading && (
            <div className="h-48 flex flex-col items-center justify-center text-blue-400 relative z-10">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="animate-pulse font-medium">Processing Natural Language...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 relative z-10 animate-in fade-in duration-500">
              {/* Priority Banner */}
              <div className={`p-4 rounded-2xl border flex items-center shadow-lg ${getPriorityColor(result.triagePriority)}`}>
                <div className="bg-white/90 p-3 rounded-xl mr-4 shadow-sm">
                  {getPriorityIcon(result.triagePriority)}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">Triage Urgency</p>
                  <p className="text-xl font-bold">{result.triagePriority}</p>
                </div>
              </div>

              {/* Departments */}
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center space-x-2 mb-4">
                  <Building size={18} className="text-blue-400" />
                  <h4 className="font-bold text-blue-100">Suggested Departments</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Primary Route</p>
                    <p className="font-bold text-white">{result.primaryDepartment}</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Secondary Consult</p>
                    <p className="font-bold text-white">{result.secondaryDepartment || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Extracted Symptoms */}
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
                <h4 className="font-bold text-blue-100 mb-3 text-sm">Extracted Findings</h4>
                <ul className="space-y-2">
                  {result.symptoms.map((sym, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 mr-2 shrink-0" />
                      <span className="text-slate-200 text-sm leading-relaxed">{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Language & Reasoning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center mb-2">
                    <Languages size={15} className="text-slate-400 mr-2" />
                    <span className="text-xs font-bold text-slate-400">Translation</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <span className="font-medium text-white">{result.detectedLanguage}:</span> {result.translatedText}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center mb-2">
                    <FileText size={15} className="text-slate-400 mr-2" />
                    <span className="text-xs font-bold text-slate-400">Clinical Reasoning</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-[10px] text-red-200/80 uppercase tracking-widest font-bold">Safety Notice</p>
                <p className="text-xs text-red-200 mt-1">This system provides triage guidance only and does not replace evaluation by a qualified medical professional.</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientTriage;
