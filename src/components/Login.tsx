import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import { User } from '../types';

const Login = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email/username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 bg-emerald-500 text-white text-center">
          <h2 className="text-3xl font-bold">HMS Portal</h2>
          <p className="mt-2 opacity-80">Powered by MedCueAI</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center text-slate-600 mb-6">
            <p>Welcome to the MedCueAI <br/>Hospital Management System Portal</p>
            <p className="text-sm mt-1 opacity-70">Please sign in to continue.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>


          <div className="text-center mt-6 space-y-4">
            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              In case of any issues with login, contact your Institute Head/Admin for updating the same
            </p>
            <div className="pt-4 border-t border-slate-100">
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 text-sm font-bold block transition-colors">
                New user? Sign Up here
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
