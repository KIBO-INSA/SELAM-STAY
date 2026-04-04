import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, ArrowRight, User, ShieldCheck, Briefcase } from 'lucide-react';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('guest');
  const [identifier, setIdentifier] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!identifier) return;
    
    setIsAuthenticating(true);
    
    // Simulate network delay for premium feel
    setTimeout(() => {
      onLogin(role);
      setIsAuthenticating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url('/kuriftu_bg.png')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent mix-blend-multiply" />
      <div className="absolute inset-0 z-0 bg-amber-900/10 mix-blend-overlay" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-2xl shadow-amber-500/20">
            <Leaf size={32} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-heading font-black text-white tracking-widest uppercase">Selam Stay</h1>
          <p className="text-amber-500/80 font-medium tracking-[0.2em] text-[10px] mt-2 uppercase">Kuriftu Enterprise</p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
        >
          {/* Role Selector */}
          <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5">
            {[ 
              { id: 'guest', label: 'Guest', icon: User },
              { id: 'staff', label: 'Staff', icon: Briefcase },
              { id: 'manager', label: 'Manager', icon: ShieldCheck }
            ].map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    isActive 
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-black" : "text-gray-500"} />
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">
                  {role === 'guest' && 'Reservation Number or Pin'}
                  {role === 'staff' && 'Employee ID'}
                  {role === 'manager' && 'Admin Access Code'}
                </label>
                <input
                  type="password"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'guest' ? 'e.g. KS-8492' : 
                    role === 'staff' ? 'e.g. EMP-202' : '••••••••'
                  }
                  className="w-full bg-[#18181b]/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold tracking-widest"
                />
              </motion.div>
            </AnimatePresence>

            <button
              type="submit"
              disabled={isAuthenticating || !identifier}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                isAuthenticating || !identifier
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-white text-black hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer'
              }`}
            >
              {isAuthenticating ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-white/5 pt-6">
             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Powered by Selam Intelligence</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}