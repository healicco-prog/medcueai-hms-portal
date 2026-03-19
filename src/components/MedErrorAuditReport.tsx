import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FileText, Calendar, Download, Building, BarChart3, TrendingUp, TrendingDown, ClipboardList, Save, Clock, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MedErrorAuditReport = ({ user }: { user: User }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default to current month string YYYY-MM
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/med-error-consolidated-reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedReports(data);
      }
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/med-error-prescriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    // Parse the selected month (YYYY-MM)
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // Previous month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    const currentMonthFilter = `${year}-${String(month).padStart(2, '0')}`;
    const prevMonthFilter = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // Helper to extract data from a month string 'YYYY-MM'
    const getStats = (monthString: string) => {
      const monthPrescriptions = prescriptions.filter(p => {
        if (p.status !== 'EVALUATED' || !p.evaluation_result) return false;
        const pDate = new Date(p.created_at);
        const pMonthString = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
        return pMonthString === monthString;
      });

      let totalScore = 0;
      let totalCompliance = 0;
      let allStrengths: string[] = [];
      let allDeficiencies: string[] = [];
      const deptStats: Record<string, { count: number, totalScore: number }> = {};

      monthPrescriptions.forEach(p => {
        try {
          const evalResult = JSON.parse(p.evaluation_result);
          totalScore += evalResult.overall_score || 0;
          totalCompliance += evalResult.who_compliance_percentage || 0;

          if (evalResult.strengths) allStrengths.push(...evalResult.strengths);
          if (evalResult.major_deficiencies) allDeficiencies.push(...evalResult.major_deficiencies);

          const dept = p.department || 'General';
          if (!deptStats[dept]) deptStats[dept] = { count: 0, totalScore: 0 };
          deptStats[dept].count += 1;
          deptStats[dept].totalScore += (evalResult.overall_score || 0);
        } catch(e) { /* ignore parse error */ }
      });

      const count = monthPrescriptions.length;
      return {
        count,
        avgScore: count > 0 ? totalScore / count : 0,
        avgCompliance: count > 0 ? totalCompliance / count : 0,
        strengths: [...new Set(allStrengths)].slice(0, 5),
        deficiencies: [...new Set(allDeficiencies)].slice(0, 5),
        deptStats
      };
    };

    const currentStats = getStats(currentMonthFilter);
    const prevStats = getStats(prevMonthFilter);

    // Merge departments
    const allDepts = new Set([...Object.keys(currentStats.deptStats), ...Object.keys(prevStats.deptStats)]);
    const departmentReports = Array.from(allDepts).map(dept => {
      const curr = currentStats.deptStats[dept] || { count: 0, totalScore: 0 };
      const prev = prevStats.deptStats[dept] || { count: 0, totalScore: 0 };
      
      const currAvg = curr.count > 0 ? curr.totalScore / curr.count : 0;
      const prevAvg = prev.count > 0 ? prev.totalScore / prev.count : 0;

      return {
        name: dept,
        count: curr.count,
        avgScore: currAvg,
        progression: prevAvg > 0 ? currAvg - prevAvg : 0,
      };
    }).sort((a, b) => b.count - a.count);

    setReportData({
      month: currentMonthFilter,
      institute: currentStats,
      departments: departmentReports
    });
    setReportGenerated(true);
  };

  const handleSaveReport = async () => {
    if (!reportData) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/med-error-consolidated-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: reportData.month,
          report_data: reportData
        })
      });
      if (res.ok) {
        alert('Report saved successfully!');
        fetchSavedReports();
      } else {
        alert('Failed to save report.');
      }
    } catch (error) {
      console.error('Error saving report', error);
      alert('Error saving report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/med-error-consolidated-reports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSavedReports();
        alert('Report deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting report', error);
    }
  };

  const viewSavedReport = (report: any) => {
    setReportData(JSON.parse(report.report_data));
    setReportGenerated(true);
    setActiveTab('generate');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMonthName = (monthString: string) => {
    try {
      const [year, month] = monthString.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return monthString;
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION (Hidden during print if we want, or adjust for print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center print:hidden border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medication Error Audit Report- Consolidated</h2>
          <p className="text-slate-500">View all Medication Error Reports - Monthly</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl mt-4 md:mt-0">
          <button 
            onClick={() => { setActiveTab('generate'); setReportGenerated(false); }}
            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'generate' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Generate New
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 font-bold text-sm rounded-lg transition-all flex items-center ${activeTab === 'saved' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Saved Reports History
          </button>
        </div>
      </div>

      {activeTab === 'saved' ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Clock className="mr-2 text-slate-400" size={20} />
            Saved Reports
          </h3>
          
          {savedReports.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
              <FileText size={48} className="mb-4 text-slate-200" />
              <p className="text-lg font-medium text-slate-500">No saved reports yet</p>
              <p className="text-sm">Generate and save a report to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedReports.map((report) => (
                <div key={report.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                      <FileText size={24} />
                    </div>
                    <button onClick={() => handleDeleteReport(report.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-1">{formatMonthName(report.month)}</h4>
                  <p className="text-sm text-slate-500 mb-6">Saved on {new Date(report.created_at).toLocaleDateString()}</p>
                  
                  <button 
                    onClick={() => viewSavedReport(report)}
                    className="w-full flex items-center justify-center py-2 bg-slate-50 hover:bg-emerald-50 text-emerald-600 font-bold rounded-xl transition-colors border border-slate-200 hover:border-emerald-200"
                  >
                    <Eye size={18} className="mr-2" />
                    View Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0">
        
        {/* CONTROLS (Hidden during print) */}
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8 border-b border-slate-100 pb-8 print:hidden">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Month</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          
          <button 
            onClick={generateReport}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center min-w-[300px]"
          >
            <ClipboardList className="mr-2" size={20} />
            Generate consolidated report based on WHO
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading && !reportGenerated && (
          <div className="py-20 text-center text-slate-400 print:hidden">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p>Loading audit data...</p>
          </div>
        )}

        {/* EMPTY STATE BEFORE GENERATING */}
        {!isLoading && !reportGenerated && (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center print:hidden">
            <BarChart3 size={48} className="mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-500">Select a month and generate the report</p>
            <p className="text-sm">Consolidates data from all evaluated Prescription Audits.</p>
          </div>
        )}

        {/* REPORT CONTENT */}
        {reportGenerated && reportData && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header / Actions */}
            <div className="flex justify-between items-start print:items-center">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-800 print:text-emerald-800">Overall Report for the Institute</h3>
                <p className="text-lg font-medium text-emerald-600 print:text-slate-600 flex items-center">
                  <Building size={20} className="mr-2" />
                  AIMSRC - Devanahalli
                </p>
                <p className="text-slate-500 font-medium">
                  {formatMonthName(reportData.month)}
                </p>
              </div>
              
              <div className="flex space-x-3 print:hidden">
                <button 
                  onClick={handleSaveReport}
                  disabled={isSaving}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center"
                >
                  <Save size={20} className="mr-2" />
                  {isSaving ? 'Saving...' : 'Save Report'}
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center"
                >
                  <Download size={20} className="mr-2" />
                  Share in PDF
                </button>
              </div>
            </div>

            {/* Institute Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl print:bg-white print:border-slate-300">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Total Prescriptions Audited</p>
                <p className="text-4xl font-black text-slate-800">{reportData.institute.count}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl print:bg-white print:border-emerald-300">
                <p className="text-xs uppercase tracking-widest text-emerald-600 font-bold mb-2">Average Overall Score</p>
                <p className="text-4xl font-black text-emerald-700">
                  {reportData.institute.avgScore.toFixed(1)} <span className="text-lg font-bold opacity-70">/ 100</span>
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl print:bg-white print:border-blue-300">
                <p className="text-xs uppercase tracking-widest text-blue-600 font-bold mb-2">WHO Compliance</p>
                <p className="text-4xl font-black text-blue-700">
                  {reportData.institute.avgCompliance.toFixed(1)}<span className="text-lg font-bold opacity-70">%</span>
                </p>
              </div>
            </div>

            {/* Strengths & Deficiencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 print:page-break-inside-avoid">
              {reportData.institute.strengths.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Common Strengths</h4>
                  <ul className="space-y-3">
                    {reportData.institute.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-slate-600 print:text-slate-800">
                        <span className="text-emerald-500 mr-2 font-bold">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.institute.deficiencies.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Common Deficiencies</h4>
                  <ul className="space-y-3">
                    {reportData.institute.deficiencies.map((d: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-slate-600 print:text-slate-800">
                        <span className="text-red-500 mr-2 font-bold">•</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            <div className="space-y-6 pt-8 border-t border-slate-100 print:border-slate-300 print:break-before-auto">
              <div>
                <h3 className="text-2xl font-black text-slate-800 print:text-slate-900">Department Report</h3>
                <p className="text-slate-500 print:text-slate-600 mt-1">Comparing progression from the previous month.</p>
              </div>

              {reportData.departments.length === 0 ? (
                <p className="text-slate-400 italic">No departmental data available for this month.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {reportData.departments.map((dept: any) => (
                    <div key={dept.name} className="bg-white border text-left border-slate-200 rounded-2xl p-6 shadow-sm print:shadow-none print:border-slate-300 print:page-break-inside-avoid">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">{dept.name}</h4>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-slate-50 pb-3 print:border-slate-100">
                          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Audited</span>
                          <span className="font-bold text-slate-700">{dept.count} <span className="text-xs font-normal text-slate-400">Rx</span></span>
                        </div>
                        
                        <div className="flex justify-between items-end border-b border-slate-50 pb-3 print:border-slate-100">
                          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Avg Score</span>
                          <span className="font-bold text-slate-800 text-xl">{dept.avgScore.toFixed(1)}<span className="text-xs font-normal text-slate-400">/100</span></span>
                        </div>

                        <div className="flex justify-between items-end">
                          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Progression</span>
                          <div className={`flex items-center font-bold px-2 py-1 rounded-md text-sm ${
                            dept.progression > 0 ? 'bg-emerald-50 text-emerald-600 print:bg-transparent' : 
                            dept.progression < 0 ? 'bg-red-50 text-red-600 print:bg-transparent' : 
                            'bg-slate-50 text-slate-600 print:bg-transparent'
                          }`}>
                            {dept.progression > 0 ? <TrendingUp size={16} className="mr-1" /> : 
                             dept.progression < 0 ? <TrendingDown size={16} className="mr-1" /> : null}
                            {dept.progression > 0 ? '+' : ''}
                            {dept.progression.toFixed(1)} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
      )}
    </div>
  );
};
export default MedErrorAuditReport;
