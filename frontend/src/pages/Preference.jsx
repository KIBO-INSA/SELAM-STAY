import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Briefcase, Users, Flame, Coffee, Utensils, WheatOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { guestAPI } from '../services/api';

export default function Preference({ guestId, preferences, setPreferences, onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Question 1: The Occasion
  const occasions = [
    { id: 'leisure',    label: 'Deep Relaxation', icon: Heart,      desc: 'Spa, wellness, and quiet time.' },
    { id: 'business',   label: 'Executive Stay',  icon: Briefcase,  desc: 'Fast Wi-Fi, workspace, efficiency.' },
    { id: 'family',     label: 'Family Escape',   icon: Users,      desc: 'Activities, pools, and large spaces.' },
    { id: 'honeymoon',  label: 'Romantic Getaway', icon: Flame,      desc: 'Privacy, champagne, fine dining.' },
  ];

  // Question 2: Dining Vibe
  const diningVibes = [
    { id: 'cultural',   label: 'Cultural Immersion', icon: Coffee, desc: 'Local spices, traditional coffee ceremonies.' },
    { id: 'premium',    label: 'Premium Dining',     icon: Utensils, desc: 'High-end culinary experiences.' }
  ];

  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsSaving(true);
      try {
        await guestAPI.updatePreferences({
          guest_id: guestId, 
          food: preferences.food,
          drink: preferences.drink,
          activity: preferences.activity
        });
        onComplete();
      } catch (error) {
        console.error("Failed to save preferences:", error);
        // Ensure they still get to the portal in demo mode if the backend crashes
        onComplete();
      }
    }
  };

  const OptionCard = ({ icon: Icon, label, desc, isSelected, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full text-left p-6 rounded-3xl border transition-all duration-300 ${
        isSelected 
          ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
          : 'bg-[#18181b]/50 border-white/5 hover:bg-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-4 rounded-2xl ${isSelected ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-amber-500' : 'text-white'}`}>{label}</h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header & Progress */}
        <div className="mb-12 text-center">
          <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4">Curating Your Stay</p>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden max-w-md mx-auto mb-8">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="obj1" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">What brings you to Kuriftu?</h1>
                <p className="text-gray-400">Help the AI tailor your room environment and activity recommendations.</p>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="obj2" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">How do you prefer to dine?</h1>
                <p className="text-gray-400">We'll adjust your room service menu and restaurant displays.</p>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="obj3" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}>
                <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">Any dietary requirements?</h1>
                <p className="text-gray-400">Our chefs and your AI Concierge will ensure a safe Culinary experience.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {occasions.map(occ => (
                  <OptionCard 
                    key={occ.id} icon={occ.icon} label={occ.label} desc={occ.desc}
                    isSelected={preferences.food === occ.id} 
                    onClick={() => setPreferences({ ...preferences, food: occ.id })} 
                  />
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
                {diningVibes.map(vibe => (
                  <OptionCard 
                    key={vibe.id} icon={vibe.icon} label={vibe.label} desc={vibe.desc}
                    isSelected={preferences.drink === vibe.id} 
                    onClick={() => setPreferences({ ...preferences, drink: vibe.id })} 
                  />
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-6 max-w-lg mx-auto bg-white/5 p-8 border border-white/10 rounded-[2.5rem]">
                <div className="flex items-center gap-4 p-4 bg-[#18181b] rounded-2xl border border-rose-500/20">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><WheatOff size={24} /></div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Allergies & Restrictions</p>
                    <p className="text-xs text-gray-500">Vegan, Gluten-Free, Nut Allergy, etc.</p>
                  </div>
                </div>
                <textarea 
                  className="w-full bg-[#18181b] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[120px] resize-none"
                  placeholder="Tell us what you can't eat..."
                  value={preferences.activity}
                  onChange={(e) => setPreferences({ ...preferences, activity: e.target.value })}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          <button 
            onClick={handleNext}
            disabled={isSaving}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
              (step === 1 && !preferences.food) || (step === 2 && !preferences.drink) || isSaving
                ? 'bg-white/10 text-gray-600 cursor-not-allowed'
                : 'bg-white text-black hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105'
            }`}
          >
            {isSaving ? "Saving..." : (step === totalSteps ? 'Complete Profile' : 'Next Step')} 
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}