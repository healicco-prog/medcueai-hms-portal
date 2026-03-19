import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Activity, Info, Loader2, Mic, StopCircle, Keyboard } from 'lucide-react';
import { SocialShareButton } from './SocialShareButton';
import { useDropzone } from 'react-dropzone';
import { performOCR, runCDSAnalysis } from '../services/geminiService';
import { toast, Toaster } from 'react-hot-toast';

interface User {
  id: number;
  name?: string;
  email: string;
  role: string;
}

export const CDSTool = ({ user }: { user: User }) => {
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [scenarioText, setScenarioText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cdsResults, setCdsResults] = useState<any>(null);
  const [activeAuditId, setActiveAuditId] = useState<number | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');

  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setScenarioText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error("Microphone error or permission denied.");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      } else {
        toast.error("Speech recognition is not supported in this browser.");
      }
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  } as any);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleProcess = async () => {
    if (inputMode === 'upload' && !file) {
      toast.error('Please upload a file first');
      return;
    }
    if (inputMode === 'text' && !scenarioText.trim()) {
      toast.error('Please enter a clinical scenario');
      return;
    }

    setIsProcessing(true);
    setCdsResults(null);
    setActiveAuditId(null);

    try {
      let extractedText = '';
      let base64 = null;

      if (inputMode === 'upload' && file) {
        // 1. Convert to base64 and extract raw text via OCR
        base64 = await getBase64(file);
        extractedText = await performOCR(base64);
      } else {
        extractedText = scenarioText;
      }

      // 2. Pass text to CDS AI model to get structured data & recommendations
      // If we are answering a pending prompt, append the additional context to the scenario text
      const isSecondPass = !!pendingPrompt;
      const textToAnalyze = isSecondPass && additionalContext.trim() 
        ? `${extractedText}\n\n[Additional Information Provided by User: ${additionalContext}]` 
        : extractedText;

      const analysisJson = await runCDSAnalysis(textToAnalyze, 3, isSecondPass);

      // Check if the AI needs more information
      if (!isSecondPass && analysisJson.requires_more_info) {
        setPendingPrompt(analysisJson.missing_info_prompt);
        // Do not save to backend yet, let the user fill in the details
        if (inputMode === 'text') {
           setScenarioText(textToAnalyze); // Keep accumulated history
        }
        setAdditionalContext(''); // Reset the input box for next round
        setIsProcessing(false);
        return; 
      }
      
      // If we got here, AI is satisfied with the data or it's the second pass.
      if (inputMode === 'text') {
         setScenarioText(textToAnalyze);
      }
      setPendingPrompt(null);
      setAdditionalContext('');

      // 3. Save initial "Pending Review" audit to backend
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cds-audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_data: base64,
          extracted_data: analysisJson.extracted_data,
          ai_recommendations: analysisJson.ai_recommendations
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAuditId(data.id);
        setCdsResults(analysisJson);
        toast.success("Analysis complete");
      } else {
        const text = await res.text();
        throw new Error(`[${res.status}] Failed: ${text.substring(0, 60)}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error processing document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecision = async (decision: string) => {
    if (!activeAuditId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cds-audits/${activeAuditId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_decision: decision,
          status: decision === 'Ignored' ? 'IGNORED' : 'ACCEPTED'
        })
      });

      if (res.ok) {
        toast.success(`Action recorded: ${decision}`);
        // Reset workflow
        setTimeout(() => {
          setFile(null);
          setCdsResults(null);
          setActiveAuditId(null);
        }, 2000);
      } else {
        toast.error("Failed to save decision");
      }
    } catch (error) {
      toast.error("Error recording decision");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          Clinical Decision Support System (CDS)
        </h1>
        <p className="text-slate-600 mt-2">
          AI-assisted patient data analysis, diagnosis recommendations, and real-time safety alerts.
        </p>
      </div>

      {!cdsResults ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 p-4">
            <div className="flex gap-4">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors \${
                  inputMode === 'upload' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Upload className="h-5 w-5" />
                Upload Document
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors \${
                  inputMode === 'text' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Keyboard className="h-5 w-5" />
                Type / Dictate
              </button>
            </div>
          </div>

          <div className="p-8">
            {inputMode === 'upload' ? (
              <>
                <h2 className="text-xl font-semibold mb-6">Upload Patient File</h2>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                    \${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-slate-600 mb-2 font-medium">Drag & drop patient document here, or click to select file</p>
                  <p className="text-slate-500 text-sm">Supports Image/PDF formats</p>
                </div>

                {file && (
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-4 py-2 rounded-lg">
                      <FileText className="h-5 w-5" />
                      {file.name}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Describe Clinical Scenario</h2>
                  <button
                    onClick={toggleListen}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all \${
                      isListening 
                        ? 'bg-red-100 text-red-700 animate-pulse' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <StopCircle className="h-5 w-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                        Start Dictation
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                  placeholder="Type or dictate the patient's demographics, symptoms, vitals, history, etc..."
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  disabled={!!pendingPrompt}
                ></textarea>

                {pendingPrompt && (
                  <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-600 p-2 rounded-full text-white mt-1">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">More Information Needed</h3>
                        <p className="text-blue-800 whitespace-pre-wrap">{pendingPrompt}</p>
                      </div>
                    </div>
                    <textarea
                      className="w-full h-32 p-4 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-white"
                      placeholder="Please provide the requested details to continue the analysis..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      autoFocus
                    ></textarea>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleProcess}
                disabled={isProcessing || (inputMode === 'upload' && !file) || (inputMode === 'text' && !scenarioText)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Patient Data...
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5" />
                    Run CDS Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Data Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="bg-slate-800 text-white px-6 py-4 rounded-t-xl">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Extracted Patient Data
                </h3>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Demographics:</span>
                  <span className="text-slate-600">{cdsResults.extracted_data.demographics || 'Not found'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Symptoms:</span>
                  <div className="flex flex-wrap gap-2">
                    {cdsResults.extracted_data.symptoms?.length > 0 ? (
                      cdsResults.extracted_data.symptoms.map((sym: string, i: number) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{sym}</span>
                      ))
                    ) : (
                      <span className="text-slate-500">None detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Current Diagnosis:</span>
                  <div className="flex flex-wrap gap-2">
                    {cdsResults.extracted_data.current_diagnosis?.length > 0 ? (
                      cdsResults.extracted_data.current_diagnosis.map((diag: string, i: number) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{diag}</span>
                      ))
                    ) : (
                      <span className="text-slate-500">None detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Vitals / Labs / Allergies / Meds:</span>
                  <ul className="list-disc pl-5 text-slate-600 space-y-1 mt-2">
                    {cdsResults.extracted_data.vital_signs?.map((item: string, i: number) => <li key={`vit-${i}`}>{item}</li>)}
                    {cdsResults.extracted_data.lab_values?.map((item: string, i: number) => <li key={`lab-${i}`}>{item}</li>)}
                    {cdsResults.extracted_data.allergies?.map((item: string, i: number) => (
                      <li key={`alg-${i}`} className="text-red-500 font-medium">Allergy: {item}</li>
                    ))}
                    {cdsResults.extracted_data.medication_history?.map((item: string, i: number) => <li key={`med-${i}`}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* AI Decision Analysis Column */}
          <div className="space-y-6">
            
            {/* Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-rose-200">
              <div className="bg-rose-50 text-rose-800 px-6 py-4 rounded-t-xl border-b border-rose-100">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  CDS Real-Time Alerts
                </h3>
              </div>
              <div className="p-6">
                {cdsResults.ai_recommendations.alerts?.length > 0 ? (
                  <div className="space-y-4">
                    {cdsResults.ai_recommendations.alerts.map((alert: any, i: number) => (
                      <div key={i} className={`p-4 rounded-lg border \${alert.severity === 'High' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-bold \${alert.severity === 'High' ? 'text-red-700' : 'text-orange-700'}`}>
                            {alert.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold \${alert.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {alert.severity} Severity
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{alert.description}</p>
                        <p className="text-sm font-medium text-slate-900 mt-2 bg-white px-3 py-2 rounded shadow-sm">
                          Action: {alert.action_required}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No critical alerts or interactions detected.</p>
                )}
              </div>
            </div>

            {/* Diagnoses & Treatments */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-200">
              <div className="bg-blue-50 text-blue-800 px-6 py-4 rounded-t-xl border-b border-blue-100">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  AI Clinical Inference
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-700 border-b pb-2 mb-3">Predicted Diagnoses</h4>
                  {cdsResults.ai_recommendations.possible_diagnoses?.map((diag: any, i: number) => (
                    <div key={i} className="mb-3 text-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-800">{diag.condition}</span>
                        <span className="text-blue-600">{diag.probability}</span>
                      </div>
                      <p className="text-slate-500 mt-1">{diag.reasoning}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 border-b pb-2 mb-3">Recommendations & Guidelines</h4>
                  {cdsResults.ai_recommendations.treatment_recommendations?.map((rec: any, i: number) => (
                    <div key={i} className="mb-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-semibold text-indigo-700 block mb-1">{rec.category}</span>
                      <p className="text-slate-700">{rec.suggestion}</p>
                      <p className="text-xs text-slate-500 mt-2 italic flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {rec.guideline_reference}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Disclaimer
                  </p>
                  <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                    Whatever suggestions are given is only informative. Whatever decision is taken, Dr. {user.name} is entirely responsible.
                  </p>
                </div>
              </div>
            </div>

            {/* Physician Action */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 shadow-indigo-100/50">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Physician Review & Audit</h3>
              <p className="text-sm text-slate-600 mb-4">Record your clinical decision to maintain NABH compliance audit trail.</p>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleDecision('Accepted')}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                >
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="font-medium">Accept AI<br/>Suggestion</span>
                </button>
                <button 
                  onClick={() => handleDecision('Modified')}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors"
                >
                  <Activity className="h-6 w-6 mb-2" />
                  <span className="font-medium">Modify<br/>Plan</span>
                </button>
                <button 
                  onClick={() => handleDecision('Ignored')}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <XCircle className="h-6 w-6 mb-2" />
                  <span className="font-medium">Ignore<br/>Alert</span>
                </button>
              </div>

              {/* Share on Social Media */}
              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Share your experience using MedCueAI</p>
                <SocialShareButton
                  shareText={`🏥 Just used AI-powered Clinical Decision Support from MedCueAI for smarter, evidence-based diagnosis & treatment recommendations!\n\n🤖 Features: Real-time alerts, drug interactions, guideline-matched recommendations.\n\n🔗 https://medcueai.com\n\n#MedCueAI #CDS #HealthcareAI #ClinicalDecisionSupport`}
                  emailSubject="Check out MedCueAI — AI Clinical Decision Support"
                />
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
