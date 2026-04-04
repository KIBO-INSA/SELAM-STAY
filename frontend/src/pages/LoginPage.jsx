import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ChevronRight, Globe, Award, Sparkles } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'manager' && password === 'kuriftu2024') {
      onLogin(true);
      navigate('/dashboard');
    } else {
      setError('Invalid signature or access code.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-40">
        <motion.img 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            src="/artifacts/kuriftu_hero_luxury_village_1775250162842.png" 
            className="w-full h-full object-cover grayscale opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-950/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 relative z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-[2rem] text-white shadow-2xl mb-8 transform -rotate-6 animate-float">
            <Award size={40} />
          </div>
          <h1 className="text-4xl font-heading font-black text-white tracking-tighter uppercase mb-2 leading-none">
            Manager Intelligence
          </h1>
          <p className="text-amber-500/60 font-black text-[10px] uppercase tracking-[0.3em]">
            Kuriftu African Village
          </p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-white/10 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
               <label className="text-white/40 text-[10px] font-black uppercase tracking-widest px-2">Manager ID</label>
               <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors">
                   <User size={20} />
                 </div>
                 <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="manager"
                  className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white placeholder:text-white/10 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                 />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-white/40 text-[10px] font-black uppercase tracking-widest px-2">Access Key</label>
               <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors">
                   <Lock size={20} />
                 </div>
                 <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 pl-16 pr-6 text-white placeholder:text-white/10 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                 />
               </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-bold text-center px-2">
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95"
            >
              Authorize Access <ChevronRight size={18} />
            </button>
          </form>
        </div>

        <div className="mt-12 text-center text-white/20 space-y-4">
           <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1"><Globe size={12} /> Global Portfolio</span>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-1"><Sparkles size={12} /> Cultural HQ</span>
           </div>
           <p className="text-[8px] font-medium leading-relaxed opacity-50 uppercase tracking-widest max-w-[250px] mx-auto">
             Encrypted connection established. Unauthorized access is strictly logged by Selam Intelligence.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
