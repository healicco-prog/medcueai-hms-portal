import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Save, Check } from 'lucide-react';

const availableFeatures = [
  'Dashboard',
  'Pharmacovigilance',
  'Prescription Upload',
  'Prescription Audit',
  'Prescription Audit Report',
  'Medication Error Audit',
  'Digital Prescription System',
  'Patient Triage',
  'CDS tools',
  'Formulary Upload',
  'Formulary Check',
  'Data Upload'
];

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

      <div className="overflow-auto custom-scrollbar max-h-[65vh] border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[800px] relative">
          <thead>
            <tr>
              <th className="py-4 px-4 text-sm font-semibold text-slate-500 w-1/4 sticky left-0 top-0 bg-slate-50 z-30 border-b border-r border-slate-200 shadow-sm">Role Name</th>
              {availableFeatures.map(f => (
                <th key={f} className="px-2 text-xs font-semibold text-slate-500 align-bottom sticky top-0 bg-slate-50 z-20 border-b border-slate-200 shadow-sm h-[220px] min-w-[100px] w-[100px]">
                  <div className="relative w-full h-full">
                    <span className="absolute bottom-4 left-1/2 origin-bottom-left -rotate-45 whitespace-nowrap -translate-x-[5px]">
                      {f}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rolesList.map(role => (
              <tr key={role} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <td className="py-3 px-4 font-bold text-slate-700 sticky left-0 group-hover:bg-slate-50 bg-white transition-colors z-10 border-r border-slate-100 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  {role}
                </td>
                {availableFeatures.map(feature => {
                  const hasFeature = (permissions[role] || []).includes(feature);
                  
                  // Disable editing for master admins
                  const isMasterAdmin = role === 'MASTER_ADMIN';
                  // Disable editing for institution admins if current user is not master admin
                  const isInstAdmin = role === 'INSTITUTION_ADMIN';
                  const isDisabled = isMasterAdmin || (isInstAdmin && currentUserRole !== 'MASTER_ADMIN');
                  
                  return (
                    <td key={feature} className="py-3 px-2 text-center align-middle">
                      <label className={`inline-flex items-center justify-center w-6 h-6 rounded border cursor-pointer transition-colors ${
                        hasFeature ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500'}`}>
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
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolePermissionsManager;
