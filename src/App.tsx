import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  AlertTriangle, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Plus,
  CheckCircle,
  Clock,
  ClipboardList,
  Building,
  Upload,
  Activity,
  Stethoscope,
  MonitorPlay,
  Tablet,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from './types';

// Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import FormularyCheck from './components/FormularyCheck';
import FormularyCheckView from './components/FormularyCheckView';
import Pharmacovigilance from './components/Pharmacovigilance';
import PrescriptionAudit from './components/PrescriptionAudit';
import PrescriptionAuditErrorPage from './components/PrescriptionAuditErrorPage';
import PreAuditReport from './components/PreAuditReport';
import MedErrorAuditReport from './components/MedErrorAuditReport';
import { CDSTool } from './components/CDSTool';
import PrescriptionUploadPage from './components/PrescriptionUploadPage';
import PrescriptionUploadErrorPage from './components/PrescriptionUploadErrorPage';
import UserManagement from './components/UserManagement';
import UserManagementMasterAdmin from './components/UserManagementMasterAdmin';
import UserManagementInstituteAdmin from './components/UserManagementInstituteAdmin';
import DepartmentManagement from './components/DepartmentManagement';
import PatientTriage from './components/PatientTriage';
import DigitalPrescription from './components/DigitalPrescription';
import MedicalCollegesList from './components/MedicalCollegesList';
import { SocialShareButton } from './components/SocialShareButton';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/*" element={user ? <MainLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="formulary" element={<FormularyCheck user={user} />} />
          <Route path="formulary-check" element={<FormularyCheckView user={user} />} />
          <Route path="pharmacovigilance" element={<Pharmacovigilance user={user} />} />
          <Route path="prescription-upload" element={<PrescriptionUploadPage user={user} />} />
          <Route path="prescription-upload-error" element={<PrescriptionUploadErrorPage user={user} />} />
          <Route path="prescription-audit-error" element={<PrescriptionAuditErrorPage user={user} />} />
          <Route path="med-error-audit" element={<MedErrorAuditReport user={user} />} />
          <Route path="prescription-audit" element={<PrescriptionAudit user={user} />} />
          <Route path="pre-audit-report" element={<PreAuditReport user={user} />} />
          <Route path="users" element={<UserManagement user={user} />} />
          <Route path="users-institute" element={<UserManagementInstituteAdmin user={user} />} />
          <Route path="users-master" element={<UserManagementMasterAdmin user={user} />} />
          <Route path="medical-colleges" element={<MedicalCollegesList user={user} />} />
          <Route path="departments" element={<DepartmentManagement user={user} />} />
          <Route path="cds-tools" element={<CDSTool user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
};

const MainLayout = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const location = useLocation();

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/role-permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPermissions(data);
        }
      } catch (e) {
        console.error("Failed to fetch permissions");
      }
    };
    fetchPerms();
  }, []);

  if (!user) return null;

  const isAdmin = ['MASTER_ADMIN', 'INSTITUTION_ADMIN', 'Pharmacology Admin'].includes(user.role);
  const userPerms = permissions[user.role] || [];
  
  const hasFeature = (featureName: string) => {
    if (isAdmin) return true;
    return userPerms.includes(featureName);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, isVisible: hasFeature('Dashboard') },
    
    // --- Pharmacology Admin Features ---
    { name: 'Pharmacovigilance features', isHeader: true, color: 'text-blue-400', isVisible: ['Pharmacology Admin', 'INSTITUTION_ADMIN', 'MASTER_ADMIN'].includes(user.role) },
    
    { name: 'Pharma Vigi: Pharmacovigilance System', path: '/pharmacovigilance', icon: AlertTriangle, isVisible: hasFeature('Pharmacovigilance'), isIndented: true },
    
    { name: 'Presc Audit: Prescription Audit System', isHeader: true,  isVisible: hasFeature('Prescription Upload') || hasFeature('Prescription Audit') || hasFeature('Prescription Audit Report') },
    { name: 'Prescription Upload', path: '/prescription-upload', icon: Upload, isVisible: hasFeature('Prescription Upload'), isIndented: true },
    { name: 'Prescription Audit', path: '/prescription-audit', icon: ClipboardList, isVisible: hasFeature('Prescription Audit'), isIndented: true },
    { name: 'Prescription Audit Report- Consolidated', path: '/pre-audit-report', icon: FileText, isVisible: hasFeature('Prescription Audit Report'), isIndented: true },
    
    { name: 'Med Error: Medication Error Audit tool', isHeader: true, isVisible: hasFeature('Med Error Prescription Upload') || hasFeature('Med Error Prescription Audit') || hasFeature('Medication Error Audit') },
    { name: 'Prescription Upload', path: '/prescription-upload-error', icon: Upload, isVisible: hasFeature('Med Error Prescription Upload'), isIndented: true },
    { name: 'Prescription Audit', path: '/prescription-audit-error', icon: ClipboardList, isVisible: hasFeature('Med Error Prescription Audit'), isIndented: true },
    { name: 'Medication Error Audit', path: '/med-error-audit', icon: Activity, isVisible: hasFeature('Medication Error Audit'), isIndented: true },
    
    { name: 'Practice Management System', isHeader: true, isVisible: hasFeature('Digital Prescription System') || hasFeature('Patient Triage') || hasFeature('CDS tools') },
    { name: 'Digi Presc: Digital Prescription System', path: '/digi-presc', icon: Tablet, isVisible: hasFeature('Digital Prescription System'), isIndented: true },
    { name: 'Patient Triage: Automated Patient Triage System', path: '/patient-triage', icon: Stethoscope, isVisible: hasFeature('Patient Triage'), isIndented: true },
    { name: 'CDS tools: Clinical decision support tools', path: '/cds-tools', icon: MonitorPlay, isVisible: hasFeature('CDS tools'), isIndented: true },
    
    { name: 'Pharmacy MS', isHeader: true, isVisible: hasFeature('Formulary Upload') || hasFeature('Formulary Check') },
    { name: 'Formulary Upload', path: '/formulary', icon: Upload, isVisible: hasFeature('Formulary Upload'), isIndented: true },
    { name: 'Formulary Check', path: '/formulary-check', icon: Search, isVisible: hasFeature('Formulary Check'), isIndented: true },
    
    // --- Institute Admin Features ---
    { name: 'Institute Admin Features', isHeader: true, color: 'text-purple-400', isVisible: hasFeature('Data Upload') || hasFeature('Institute Admin User Management') },
    
    { name: 'Data Upload', path: '/departments', icon: Building, isVisible: hasFeature('Data Upload'), isIndented: true },
    { name: 'Institute Admin User Management', path: '/users-institute', icon: Building, isVisible: hasFeature('Institute Admin User Management'), isIndented: true },

    // --- Master Admin Features ---
    { name: 'Master Admin Features', isHeader: true, color: 'text-rose-400', isVisible: user.role === 'MASTER_ADMIN' },
    { name: 'Master Admin User Management', path: '/users-master', icon: Shield, isVisible: user.role === 'MASTER_ADMIN', isIndented: true },
  ];

  const filteredNavItems = navItems.filter(item => item.isVisible);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:h-auto print:block print:overflow-visible">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 print:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        className="fixed top-0 left-0 w-[280px] h-full bg-slate-900 text-white flex flex-col shadow-2xl z-50 print:hidden"
      >
        <div className="p-6 flex items-start justify-between border-b border-slate-800">
          <div className="flex flex-col">
            <div className="font-bold text-[17px] tracking-tight text-white leading-tight break-words max-w-[190px]">
              {user.institution_name || 'AIMSARC'}
            </div>
            <div className="text-[12px] text-slate-400 mt-1.5 leading-none">
              Powered by
            </div>
            <div className="text-[14px] font-bold text-emerald-400 leading-tight">
              MedCueAI
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded -mr-2">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item, index) => {
            if (item.isHeader) {
              return (
                <div key={`header-${index}`} className="pt-4 pb-1 px-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${item.color || 'text-slate-500'}`}>{item.name}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.path || `item-${index}`}
                to={item.path || '#'}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.path 
                    ? item.path === '/pharmacovigilance' 
                      ? 'bg-[#E34A42]/10 text-[#E34A42]' 
                      : 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${item.isIndented ? 'ml-6' : ''}`}
              >
                {item.icon && <item.icon size={22} className="min-w-[22px]" />}
                <span className={`${item.icon ? 'ml-4' : ''} font-medium text-sm`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white">
              {user.name === 'Pharmacology Admin' ? 'M' : user.name[0]}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold truncate">
                {user.name === 'Pharmacology Admin' ? 'MedCueAI' : user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user.role === 'MASTER_ADMIN' ? 'Super Admin' : user.role}
              </p>
            </div>
          </div>
          
          {['Pharmacology Admin', 'INSTITUTION_ADMIN', 'MASTER_ADMIN'].includes(user.role) && (
            <Link
              to="/users"
              className={`w-full flex items-center p-3 mb-2 rounded-xl transition-all duration-200 ${
                location.pathname === '/users' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users size={20} className="min-w-[20px]" />
              <span className="ml-4 font-medium text-sm">SuperAdmin User Management</span>
            </Link>
          )}

          {user.role === 'MASTER_ADMIN' && (
            <Link
              to="/medical-colleges"
              className={`w-full flex items-center p-3 mb-2 rounded-xl transition-all duration-200 ${
                location.pathname === '/medical-colleges'
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building size={20} className="min-w-[20px]" />
              <span className="ml-4 font-medium text-sm">List of Medical Colleges</span>
            </Link>
          )}

          <button 
            onClick={onLogout}
            className="w-full flex items-center p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-4 font-medium text-sm">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative print:overflow-visible print:h-auto print:block w-full">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 px-8 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mr-6 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Menu size={18} />
              <span className="font-medium text-sm">Categories</span>
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <SocialShareButton compact />
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route index element={<Dashboard user={user} />} />
                <Route path="formulary" element={<FormularyCheck user={user} />} />
                <Route path="formulary-check" element={<FormularyCheckView user={user} />} />
                <Route path="pharmacovigilance" element={<Pharmacovigilance user={user} />} />
                <Route path="prescription-upload" element={<PrescriptionUploadPage user={user} />} />
                <Route path="prescription-upload-error" element={<PrescriptionUploadErrorPage user={user} />} />
                <Route path="prescription-audit-error" element={<PrescriptionAuditErrorPage user={user} />} />
                <Route path="med-error-audit" element={<MedErrorAuditReport user={user} />} />
                <Route path="prescription-audit" element={<PrescriptionAudit user={user} />} />
                <Route path="pre-audit-report" element={<PreAuditReport user={user} />} />
                <Route path="users" element={<UserManagement user={user} />} />
                <Route path="users-institute" element={<UserManagementInstituteAdmin user={user} />} />
                <Route path="users-master" element={<UserManagementMasterAdmin user={user} />} />
                <Route path="medical-colleges" element={<MedicalCollegesList user={user} />} />
                <Route path="departments" element={<DepartmentManagement user={user} />} />
                <Route path="cds-tools" element={<CDSTool user={user} />} />
                <Route path="patient-triage" element={<PatientTriage user={user} />} />
                <Route path="digi-presc" element={<DigitalPrescription user={user} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
