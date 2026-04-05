import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, ArrowRight, User, ShieldCheck, Briefcase, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const ROLES = [
  { id: 'guest',   label: 'Guest',   icon: User,        placeholder: 'Your phone number', hint: 'Phone' },
  { id: 'staff',   label: 'Staff',   icon: Briefcase,   placeholder: 'e.g. EMP-01',       hint: 'Employee ID' },
  { id: 'manager', label: 'Manager', icon: ShieldCheck, placeholder: 'e.g. ADMIN-01',     hint: 'Admin Code' },
];

const DEMO_ACCOUNTS = {
  guest:   { identifier: '+251911234567', password: 'guest123' },
  staff:   { identifier: 'EMP-01',        password: 'staff123' },
  manager: { identifier: 'ADMIN-01',      password: 'manager123' },
};

export default function Login({ onLogin }) {
  const [role,       setRole]       = useState('guest');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const activeRole = ROLES.find(r => r.id === role);

  const handleRoleChange = (r) => {
    setRole(r);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.login({
        identifier: identifier.trim(),
        password,
        role,
      });
      localStorage.setItem('selam_token', data.token);
      localStorage.setItem('selam_user',  JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/kuriftu_bg.png')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
      <div className="absolute inset-0 z-0 bg-amber-900/10 mix-blend-overlay" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">

        {/* Brand */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-2xl shadow-amber-500/20">
            <Leaf size={32} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-heading font-black text-white tracking-widest uppercase">Selam Stay</h1>
          <p className="text-amber-500/80 font-medium tracking-[0.2em] text-[10px] mt-2 uppercase">Kuriftu Enterprise</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
        >
          {/* Role tabs */}
          <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-black' : 'text-gray-500'} />
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Identifier */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">
                    {activeRole.hint}
                  </label>
                  <input
                    type={role === 'guest' ? 'tel' : 'text'}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={activeRole.placeholder}
                    className="w-full bg-[#18181b]/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-medium"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#18181b]/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold tracking-widest"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-xs font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                loading || !identifier.trim() || !password
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-white text-black hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
              }`}
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Demo Data Injection Button */}
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIdentifier(DEMO_ACCOUNTS[role].identifier);
                setPassword(DEMO_ACCOUNTS[role].password);
              }}
              className="text-amber-500/70 hover:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors border border-amber-500/20 hover:border-amber-500/50 bg-amber-500/5 px-4 py-2 rounded-lg"
            >
              Use {role} Demo Account
            </button>
          </div>

          {/* Register link — guests only */}
          {role === 'guest' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center border-t border-white/5 pt-5"
            >
              <p className="text-[11px] text-gray-500">
                New guest?{' '}
                <Link to="/register" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                  Create your account
                </Link>
              </p>
            </motion.div>
          )}

          <div className="mt-4 text-center">
            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">
              Powered by Selam Intelligence
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}