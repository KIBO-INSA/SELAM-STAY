import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, ArrowRight, ArrowLeft, User, Phone, Lock, Eye, EyeOff,
  BedDouble, Calendar, Globe, StickyNote, Coffee, Wine, Sparkles, Check
} from 'lucide-react';
import { authAPI } from '../services/api';

const STEPS = ['Identity', 'Stay Details'];

const LANGUAGE_OPTIONS = [{ value: 'en', label: '🇺🇸 English' }, { value: 'am', label: '🇪🇹 Amharic' }];

export default function Register({ onLogin }) {
  const navigate  = useNavigate();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    room_number: '', check_in: '', check_out: '', language: 'en',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!form.name.trim())           return setError('Please enter your full name.'),     false;
      if (!form.phone.trim())          return setError('Please enter your phone number.'),  false;
      if (form.password.length < 6)    return setError('Password must be at least 6 characters.'), false;
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.'), false;
    }
    if (step === 1) {
      if (!form.room_number.trim()) return setError('Please enter your room number.'), false;
      if (!form.check_in)           return setError('Please select your check-in date.'), false;
      if (!form.check_out)          return setError('Please select your check-out date.'), false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setError(''); setStep(s => s - 1); };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.register({
        name:          form.name.trim(),
        phone:         form.phone.trim(),
        password:      form.password,
        room_number:   form.room_number.trim(),
        check_in:      form.check_in,
        check_out:     form.check_out,
        language:      form.language,
        preferences:   '{}',
        special_notes: '',
      });
      localStorage.setItem('selam_token', data.token);
      localStorage.setItem('selam_user',  JSON.stringify(data.user));
      onLogin(data.user, true); // true indicates it's a new registration and needs preferences
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0a0a0b]">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
           style={{ backgroundImage: `url('/kuriftu_bg.png')` }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/85 to-[#0a0a0b]/40" />

      <div className="relative z-10 w-full max-w-lg px-4 py-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-2xl shadow-amber-500/20">
            <Leaf size={28} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-heading font-black text-white tracking-widest uppercase">Selam Stay</h1>
          <p className="text-amber-500/70 text-[10px] font-medium tracking-[0.25em] uppercase mt-1">Guest Registration</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                i < step  ? 'bg-amber-500 text-black' :
                i === step ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400' :
                             'bg-white/5 border border-white/10 text-gray-600'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-px transition-all duration-500 ${i < step ? 'bg-amber-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-5">
            Step {step + 1} — {STEPS[step]}
          </p>

          <AnimatePresence mode="wait">
            {/* ── Step 0: Identity ─────────────────────────────────────── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <Field icon={User} label="Full Name" type="text" value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="e.g. Abebe Girma" />
                <Field icon={Phone} label="Phone Number" type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="e.g. +251 912 345 678" />
                <div className="relative">
                  <Field icon={Lock} label="Password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-[38px] text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Field icon={Lock} label="Confirm Password" type="password" value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat your password" />
              </motion.div>
            )}

            {/* ── Step 1: Stay Details ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <Field icon={BedDouble} label="Room Number" type="text" value={form.room_number}
                  onChange={e => set('room_number', e.target.value)} placeholder="e.g. 101" />
                <Field icon={Calendar} label="Check-in Date" type="date" value={form.check_in}
                  onChange={e => set('check_in', e.target.value)} />
                <Field icon={Calendar} label="Check-out Date" type="date" value={form.check_out}
                  onChange={e => set('check_out', e.target.value)} />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2 flex items-center gap-2">
                    <Globe size={12} /> Language
                  </label>
                  <div className="flex gap-3">
                    {LANGUAGE_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => set('language', opt.value)}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                          form.language === opt.value
                            ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                            : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/20'
                        }`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 text-red-400 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              {error}
            </motion.p>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button onClick={back}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-xs font-black uppercase tracking-widest">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 1 ? (
              <button onClick={next}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-black hover:bg-amber-500 transition-all duration-300 text-xs font-black uppercase tracking-widest">
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={submit} disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  loading ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                }`}>
                {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Complete Registration</>}
              </button>
            )}
          </div>

          {/* Link to login */}
          <p className="mt-6 text-center text-[10px] text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Reusable input field ──────────────────────────────────────────────────────
function Field({ icon: Icon, label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2 flex items-center gap-2">
        <Icon size={12} /> {label}
      </label>
      <input {...props}
        className="w-full bg-[#18181b]/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-medium" />
    </div>
  );
}

// Removed PrefGroup component as it's no longer used within Register
