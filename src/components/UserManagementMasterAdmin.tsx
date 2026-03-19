import React, { useState, useEffect } from 'react';
import { Users, Check, X, Shield, User as UserIcon, Mail, Building, Link as LinkIcon, Edit2, Trash2, Loader2, Key } from 'lucide-react';
import { User } from '../types';
import RolePermissionsManager from './RolePermissionsManager';

const UserManagementMasterAdmin = ({ user: currentUser }: { user: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    designation: '',
    department: '',
    role: '',
    password: '',
    status: 'PENDING'
  });
  const initialNewUserForm = {
    name: '',
    username: '',
    email: '',
    mobile: '',
    designation: '',
    department: '',
    role: '',
    password: '',
    status: 'APPROVED'
  };
  const [newUserFormData, setNewUserFormData] = useState(initialNewUserForm);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/departments').then(res => res.json()).then(setDepartments).catch(console.error);
  }, []);

  const handleOpenEdit = (u: User) => {
    setIsEditing(u);
    setFormData({
      name: u.name,
      username: u.username || '',
      email: u.email,
      mobile: u.mobile || '',
      designation: u.designation || '',
      department: u.department,
      role: u.role,
      password: '',
      status: u.status
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${isEditing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditing(null);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUserFormData)
      });
      if (res.ok) {
        setIsAddingNewUser(false);
        setNewUserFormData(initialNewUserForm);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to add user');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: number, role: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, status }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const roles = [
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">User Management- Master Admin</h2>
            <p className="text-slate-500">Approve staff onboarding and assign roles</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAddingNewUser(true)}
              className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
            >
              <Users size={18} />
              <span>Add New User</span>
            </button>
            <button
              onClick={() => {
                const link = `${window.location.origin}/register`;
                navigator.clipboard.writeText(link);
                alert('Registration link copied to clipboard!');
              }}
              className="flex items-center space-x-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
            >
              <LinkIcon size={18} />
              <span>Share Registration Link</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center ${
              activeTab === 'users' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={18} className="mr-2" />
            Staff Accounts
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 flex items-center ${
              activeTab === 'roles' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Key size={18} className="mr-2" />
            Role Permissions
          </button>
        </div>

        {activeTab === 'users' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-sm font-semibold text-slate-500">Staff Info</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-500">Institution</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-500">Department</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-500">Role</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-500">Status</th>
                <th className="py-4 px-4 text-sm font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading users...</td></tr>
              ) : users.filter(u => u.role !== 'MASTER_ADMIN').length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users size={32} className="text-slate-300" />
                      <p className="font-medium text-lg text-slate-600">No staff accounts found</p>
                      <p className="text-sm text-slate-400 max-w-sm">To add staff to the portal, click the <strong className="text-emerald-600">"Share Registration Link"</strong> button above and have them register. They will appear here pending your approval.</p>
                    </div>
                  </td>
                </tr>
              ) : users.filter(u => u.role !== 'MASTER_ADMIN').map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-sm font-medium">{u.institution_name || '-'}</td>
                  <td className="py-4 px-4 text-slate-600 text-sm">{u.department}</td>
                  <td className="py-4 px-4">
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={u.role}
                      onChange={(e) => handleUpdateStatus(u.id, e.target.value, u.status)}
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {u.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleUpdateStatus(u.id, u.role, 'APPROVED')}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
                          title="Approve User"
                        >
                          <Check size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(u.id, u.role, 'PENDING')}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shrink-0"
                          title="Revoke Approval"
                        >
                          <X size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                        title="Edit User"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <RolePermissionsManager />
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">Edit User Details</h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser.role !== 'MASTER_ADMIN'}
                    className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 ${currentUser.role !== 'MASTER_ADMIN' ? 'opacity-60 cursor-not-allowed text-slate-500' : ''}`}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                {currentUser.role === 'MASTER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                      value={formData.password}
                      placeholder="Leave empty to keep current"
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Designation</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingNewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setIsAddingNewUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddNewUser} className="p-8 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.name}
                    onChange={(e) => setNewUserFormData({...newUserFormData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.username}
                    onChange={(e) => setNewUserFormData({...newUserFormData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.email}
                    onChange={(e) => setNewUserFormData({...newUserFormData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={newUserFormData.password}
                    onChange={(e) => setNewUserFormData({...newUserFormData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.mobile}
                    onChange={(e) => setNewUserFormData({...newUserFormData, mobile: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Designation</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.designation}
                    onChange={(e) => setNewUserFormData({...newUserFormData, designation: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.department}
                    onChange={(e) => setNewUserFormData({...newUserFormData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.role}
                    onChange={(e) => setNewUserFormData({...newUserFormData, role: e.target.value})}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserFormData.status}
                    onChange={(e) => setNewUserFormData({...newUserFormData, status: e.target.value})}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingNewUser(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementMasterAdmin;
