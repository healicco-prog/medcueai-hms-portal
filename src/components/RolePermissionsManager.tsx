import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Save, Check, ChevronRight } from 'lucide-react';

// Categorized feature structure matching sidebar navigation
const featureCategories = [
  { category: null, features: ['Dashboard'] },
  { 
    category: 'Pharma Vigi', 
    color: 'text-red-500 bg-red-50 border-red-200',
    features: ['Pharmacovigilance'] 
  },
  { 
    category: 'Presc Audit', 
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    features: ['Prescription Upload', 'Prescription Audit', 'Prescription Audit Report'] 
  },
  { 
    category: 'Med Error', 
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    features: ['Med Error Prescription Upload', 'Med Error Prescription Audit', 'Medication Error Audit'] 
  },
  { 
    category: 'Practice Management System', 
    color: 'text-purple-500 bg-purple-50 border-purple-200',
    features: ['Digital Prescription System', 'Patient Triage', 'CDS tools'] 
  },
  { 
    category: 'Pharmacy MS', 
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    features: ['Formulary Upload', 'Formulary Check'] 
  },
  { 
    category: 'Institute Admin Features', 
    color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
    features: ['Data Upload', 'Institute Admin User Management'] 
  },
];

// Flat list of all feature keys (used for permission storage)
const allFeatureKeys = featureCategories.flatMap(c => c.features);

// Display labels for features (short names for table)
const featureDisplayLabels: Record<string, string> = {
  'Dashboard': 'Dashboard',
  'Pharmacovigilance': 'Pharmacovigilance System',
  'Prescription Upload': 'Prescription Upload',
  'Prescription Audit': 'Prescription Audit',
  'Prescription Audit Report': 'Prescription Audit Report',
  'Med Error Prescription Upload': 'Prescription Upload',
  'Med Error Prescription Audit': 'Prescription Audit',
  'Medication Error Audit': 'Medication Error Audit',
  'Digital Prescription System': 'Digi Presc',
  'Patient Triage': 'Patient Triage',
  'CDS tools': 'CDS Tools',
  'Formulary Upload': 'Formulary Upload',
  'Formulary Check': 'Formulary Check',
  'Data Upload': 'Data Upload',
  'Institute Admin User Management': 'Institute Admin User Mgmt',
};

const rolesList = [
  'MASTER_ADMIN',
  'INSTITUTION_ADMIN',
  'Pharmacology Admin',
  'Institute Admin',
  'Medical Superintendent',
  'Department Head',
  'Department In-charge',
  'Doctor/ Staff',
  'Pharmacy Manager',
  'Pharmacist',
  'Clinical Pharmacologist',
  'Nursing In-charge',
  'Nurse',
  'Reception'
];

const RolePermissionsManager = () => {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  let currentUserRole = '';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUserRole = JSON.parse(userStr).role;
    }
  } catch (e) {}

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/role-permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPermissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (role: string, feature: string) => {
    setPermissions(prev => {
      const currentRolePerms = prev[role] || [];
      const hasPerm = currentRolePerms.includes(feature);
      const newPerms = hasPerm 
        ? currentRolePerms.filter(f => f !== feature)
        : [...currentRolePerms, feature];
      return { ...prev, [role]: newPerms };
    });
  };

  const handleToggleCategory = (role: string, categoryFeatures: string[]) => {
    setPermissions(prev => {
      const currentRolePerms = prev[role] || [];
      const allEnabled = categoryFeatures.every(f => currentRolePerms.includes(f));
      let newPerms: string[];
      if (allEnabled) {
        newPerms = currentRolePerms.filter(f => !categoryFeatures.includes(f));
      } else {
        newPerms = [...new Set([...currentRolePerms, ...categoryFeatures])];
      }
      return { ...prev, [role]: newPerms };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/role-permissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rolePermissions: permissions })
      });
      if (res.ok) {
        alert('Role permissions saved successfully! Application menus will update upon next refresh.');
      } else {
        alert('Failed to save role permissions.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading permissions...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center"><Shield className="text-emerald-500 mr-2" /> Role Permissions Setup</h2>
          <p className="text-slate-500">Enable or disable specific features for each user role in the system.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          Save Configuration
        </button>
      </div>

      <div className="overflow-auto custom-scrollbar max-h-[70vh] border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse relative">
          {/* Column-grouped header */}
          <thead>
            {/* Category header row */}
            <tr className="sticky top-0 z-20">
              <th rowSpan={2} className="py-4 px-4 text-sm font-semibold text-slate-500 w-[200px] min-w-[200px] sticky left-0 top-0 bg-slate-50 z-30 border-b border-r border-slate-200 shadow-sm align-bottom">
                Role Name
              </th>
              {featureCategories.map((cat, catIdx) => (
                <th 
                  key={catIdx}
                  colSpan={cat.features.length}
                  className={`py-2 px-2 text-center text-xs font-bold uppercase tracking-wider border-b border-slate-200 ${
                    cat.category ? (cat.color || 'text-slate-600 bg-slate-50') : 'bg-slate-50 text-slate-600'
                  } ${catIdx > 0 ? 'border-l-2 border-l-slate-300' : ''}`}
                >
                  {cat.category || 'General'}
                </th>
              ))}
            </tr>
            {/* Feature sub-header row */}
            <tr className="sticky top-[37px] z-20">
              {featureCategories.map((cat, catIdx) => 
                cat.features.map((f, fIdx) => (
                  <th 
                    key={f} 
                    className={`px-1 py-2 text-[10px] font-semibold text-slate-500 text-center bg-slate-50 border-b border-slate-200 min-w-[90px] w-[90px] ${
                      catIdx > 0 && fIdx === 0 ? 'border-l-2 border-l-slate-300' : fIdx > 0 ? 'border-l border-l-slate-100' : ''
                    }`}
                  >
                    <div className="leading-tight">{featureDisplayLabels[f] || f}</div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rolesList.map(role => {
              const isMasterAdmin = role === 'MASTER_ADMIN';
              const isInstAdmin = role === 'INSTITUTION_ADMIN';
              const isDisabled = isMasterAdmin || (isInstAdmin && currentUserRole !== 'MASTER_ADMIN');

              return (
                <tr key={role} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-4 font-bold text-slate-700 text-sm sticky left-0 group-hover:bg-slate-50 bg-white transition-colors z-10 border-r border-slate-100 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] whitespace-nowrap">
                    {role === 'MASTER_ADMIN' ? '🛡️ MASTER ADMIN' : role === 'INSTITUTION_ADMIN' ? '🏛️ INSTITUTION ADMIN' : role}
                  </td>
                  {featureCategories.map((cat, catIdx) => 
                    cat.features.map((feature, fIdx) => {
                      const hasFeature = (permissions[role] || []).includes(feature);
                      return (
                        <td 
                          key={feature} 
                          className={`py-3 px-1 text-center align-middle ${
                            catIdx > 0 && fIdx === 0 ? 'border-l-2 border-l-slate-200' : fIdx > 0 ? 'border-l border-l-slate-50' : ''
                          }`}
                        >
                          <label className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            (hasFeature || isMasterAdmin) 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                              : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={hasFeature || isMasterAdmin}
                              disabled={isDisabled}
                              onChange={() => handleToggle(role, feature)}
                            />
                            {(hasFeature || isMasterAdmin) && <Check size={14} strokeWidth={3} />}
                          </label>
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {featureCategories.filter(c => c.category).map((cat) => (
          <span key={cat.category} className={`px-2 py-1 rounded-lg border ${cat.color}`}>
            {cat.category}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RolePermissionsManager;
