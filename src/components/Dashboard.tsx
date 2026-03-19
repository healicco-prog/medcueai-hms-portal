import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, FileText, AlertTriangle, TrendingUp, Activity, ShieldCheck, Pill, Building, Shield
} from 'lucide-react';
import { User } from '../types';

// ========================
// Pharmacology Dashboard
// ========================
const PharmacologyDashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    avgScore: 0,
    totalADRs: 0,
    pendingUsers: 0,
    totalDrugs: 0,
    drugsAddedThisMonth: 0
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const [pRes, aRes, uRes, fRes, dRes] = await Promise.all([
          fetch('/api/prescriptions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/adr', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/formulary', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const prescriptions = await pRes.json();
        const adrs = await aRes.json();
        const users = await uRes.json();
        const drugs = await fRes.json();
        const fetchedDepts = await dRes.json();

        setDepartments(fetchedDepts);
        setPrescriptionsData(prescriptions);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const drugsAddedThisMonth = drugs.filter((d: any) => {
          if (!d.created_at) return false;
          const dateStr = String(d.created_at).includes('T') ? d.created_at : String(d.created_at).replace(' ', 'T') + 'Z';
          const date = new Date(dateStr);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        setStats({
          totalPrescriptions: prescriptions.length,
          avgScore: prescriptions.reduce((acc: number, p: any) => acc + (p.evaluation_result ? JSON.parse(p.evaluation_result).overall_score : 0), 0) / (prescriptions.filter((p: any) => p.evaluation_result).length || 1),
          totalADRs: adrs.length,
          pendingUsers: users.filter((u: any) => u.status === 'PENDING').length,
          totalDrugs: drugs.length,
          drugsAddedThisMonth
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const getChartData = () => {
    const filteredPrescriptions = selectedDept === "All" 
      ? prescriptionsData 
      : prescriptionsData.filter(p => p.department === selectedDept);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: { [key: string]: { count: number, totalScore: number } } = {};
    
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      dataMap[months[m]] = { count: 0, totalScore: 0 };
    }

    filteredPrescriptions.forEach(p => {
      if (!p.created_at) return;
      
      const dateStr = String(p.created_at).includes('T') ? p.created_at : String(p.created_at).replace(' ', 'T') + 'Z';
      const date = new Date(dateStr);
      const monthName = months[date.getMonth()];
      
      if (dataMap[monthName]) {
        let score = 0;
        if (p.evaluation_result) {
          try {
            score = JSON.parse(p.evaluation_result).overall_score || 0;
          } catch (e) {}
        }
        dataMap[monthName].totalScore += score;
        dataMap[monthName].count += 1;
      }
    });

    return Object.keys(dataMap).map(name => ({
      name,
      avgScore: dataMap[name].count > 0 ? Number((dataMap[name].totalScore / dataMap[name].count).toFixed(1)) : 0
    }));
  };

  const chartData = getChartData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      <div className="mb-2">
         <h2 className="text-2xl font-bold text-slate-800">Pharmacology Admin Overview</h2>
         <p className="text-slate-500">Monitor clinical quality metrics and formulary</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Drugs" value={stats.totalDrugs} icon={Pill} color="bg-blue-500" trend={`+${stats.drugsAddedThisMonth} added this month`} />
        <StatCard title="Total Audits" value={stats.totalPrescriptions} icon={FileText} color="bg-indigo-500" trend="Active monitoring" />
        <StatCard title="Avg Quality Score" value={stats.avgScore.toFixed(1)} icon={Activity} color="bg-emerald-500" trend="WHO Standard: 8.5" />
        <StatCard title="ADR Reports" value={stats.totalADRs} icon={AlertTriangle} color="bg-amber-500" trend="Active vigilance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center">
              <TrendingUp className="mr-2 text-emerald-500" size={20} />
              Quality Score Trends
            </h3>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 outline-none flex-shrink-0"
            >
              <option value="All">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 10]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`${value} / 10`, 'Avg Score']} />
                <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center">
            <ShieldCheck className="mr-2 text-blue-500" size={20} />
            Quality Distribution (Demo)
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ name: 'Excellent', value: 40 }, { name: 'Good', value: 30 }, { name: 'Fair', value: 20 }, { name: 'Poor', value: 10 }]} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {[1, 2, 3, 4].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {['Excellent', 'Good', 'Fair', 'Poor'].map((label, i) => (
              <div key={label} className="flex items-center text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i] }}></div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================
// Institute Dashboard
// ========================
const InstituteDashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalDepts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const [uRes, dRes] = await Promise.all([
          fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const users = await uRes.json();
        const depts = await dRes.json();

        setStats({
          totalUsers: users.length,
          pendingUsers: users.filter((u: any) => u.status === 'PENDING').length,
          totalDepts: depts.length,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Cardiology', users: 12, triage: 45 },
    { name: 'Neurology', users: 8, triage: 30 },
    { name: 'Oncology', users: 15, triage: 55 },
    { name: 'Pediatrics', users: 20, triage: 80 }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-2">
         <h2 className="text-2xl font-bold text-slate-800">Institute Administration</h2>
         <p className="text-slate-500">Manage personnel and institutional overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Active Staff" value={stats.totalUsers - stats.pendingUsers} icon={Users} color="bg-blue-500" trend="Currently registered" />
        <StatCard title="Pending Approvals" value={stats.pendingUsers} icon={AlertTriangle} color="bg-amber-500" trend="Requires your attention" />
        <StatCard title="Departments" value={stats.totalDepts} icon={Building} color="bg-purple-500" trend="Active Data Sources" />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-8">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center">
          <Activity className="mr-2 text-purple-500" size={20} />
          Department Activity Overview (Triage & Personnel)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="triage" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Triage Volume" />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Staff Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ========================
// Master Dashboard
// ========================
const MasterDashboard = ({ user }: { user: User }) => {
  const chartData = [
    { name: 'Q1', institutes: 2, users: 15 },
    { name: 'Q2', institutes: 4, users: 32 },
    { name: 'Q3', institutes: 7, users: 48 },
    { name: 'Q4', institutes: 10, users: 70 }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-2">
         <h2 className="text-xl font-bold text-rose-500 uppercase tracking-widest mb-1 opacity-80">Global System View</h2>
         <h2 className="text-3xl font-bold text-slate-800">Master Administration</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Institutes" value="12" icon={Building} color="bg-rose-500" trend="Active organizations" />
        <StatCard title="Global Users" value="842" icon={Users} color="bg-indigo-500" trend="+12% this quarter" />
        <StatCard title="Aggregate Audits" value="24,103" icon={FileText} color="bg-emerald-500" trend="System-wide volume" />
        <StatCard title="System Health" value="99.9%" icon={Shield} color="bg-blue-500" trend="Uptime" />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-8">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center">
          <TrendingUp className="mr-2 text-rose-500" size={20} />
          Platform Adoption Over Time
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line yAxisId="left" type="monotone" dataKey="users" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48' }} name="Total Users" />
              <Line yAxisId="right" type="monotone" dataKey="institutes" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="Institutes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ========================
// Reusable Component
// ========================
const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white`}>
        <Icon size={24} />
      </div>
    </div>
    <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
    <div className="flex items-baseline space-x-2 mt-1">
      <span className="text-3xl font-bold text-slate-800">{value}</span>
    </div>
    <p className="text-xs text-slate-400 mt-2">{trend}</p>
  </div>
);

// ========================
// Main Export
// ========================
const Dashboard = ({ user }: { user: User }) => {
  if (user.role === 'MASTER_ADMIN') {
    return <MasterDashboard user={user} />;
  }
  
  if (user.role === 'INSTITUTION_ADMIN') {
    return <InstituteDashboard user={user} />;
  }

  // Pharmacology Admin and standard users fallback 
  return <PharmacologyDashboard user={user} />;
};

export default Dashboard;
