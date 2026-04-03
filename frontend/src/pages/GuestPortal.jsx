import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Bell, Star, MapPin, 
  Leaf, Coffee, Sun, ChevronRight, Sparkles,
  Key, Utensils, Calendar, Phone, Droplets,
  Languages, Zap, Smile, Coffee as Cup, Mountain,
  Compass, Info, CloudRain, Map as MapIcon, Clock
} from 'lucide-react';
import LocalDiscovery from '../components/LocalDiscovery';

const GUEST = { name: "Abebe", room: "201", type: "Deluxe Suite", loyalty: "Gold Member" };

const MOODS = [
  { id: 'lazy', icon: Smile, label: 'Lazy', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'energetic', icon: Zap, label: 'Energetic', color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'hungry', icon: Utensils, label: 'Hungry', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'explorer', icon: Compass, label: 'Explorer', color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const CONTENT = {
  en: {
    greeting: ["Good Morning", "Good Afternoon", "Good Evening"],
    services: "Resort Services",
    viewAll: "View All",
    digitalKey: "Digital Key Active",
    digitalKeyDesc: "Hold near door lock to enter",
    resortMap: "Interactive Map",
    frontDesk: "Front Desk",
    featured: "Featured Experiences",
    aiPlanner: "AI Itinerary Planner",
    aiPlannerDesc: "What should I do today?",
    moodPrompt: "How are you feeling?",
  },
  am: {
    greeting: ["እንደምን አደሩ", "እንደምን ዋሉ", "እንደምን አመሹ"],
    services: "የሪዞርት አገልግሎቶች",
    viewAll: "ሁሉንም ይመልከቱ",
    digitalKey: "ዲጂታል ቁልፍ ስራ ላይ ነው",
    digitalKeyDesc: "ለመግባት በሩ አጠገብ ይያዙ",
    resortMap: "በይነተገናኝ ካርታ",
    frontDesk: "የፊት ጠረጴዛ",
    featured: "ልዩ ተሞክሮዎች",
    aiPlanner: "ሰው ሰራሽ አስተዋይ ዕቅድ አውጪ",
    aiPlannerDesc: "ዛሬ ምን ላድርግ?",
    moodPrompt: "እንዴት ነዎት?",
  }
};

const MAIN_SERVICES = [
  { to: '/',              label: 'AI Concierge',    icon: MessageCircle, desc: 'Chat & Assistance',  color: 'bg-coffee-700', shadow: 'shadow-coffee-700/30' },
  { to: '/services',      label: 'Dining',          icon: Utensils,      desc: 'In-Room Menu',       color: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
  { to: '/services',      label: 'Housekeeping',    icon: Sparkles,      desc: 'Cleaning & Towels',  color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
  { to: '/services',      label: 'Spa & Wellness',  icon: Droplets,      desc: 'Book a Treatment',   color: 'bg-teal-500', shadow: 'shadow-teal-500/30' },
  { to: '/feedback',      label: 'Feedback',        icon: Star,          desc: 'Rate Your Stay',     color: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
  { to: '/services',      label: 'Excursions',      icon: Mountain,      desc: 'Local Tours',        color: 'bg-amber-600', shadow: 'shadow-amber-600/30' },
];

const FEATURED_OFFERS = [
  {
    title: "Traditional Coffee Ceremony",
    time: "Today at 5:00 PM",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e010bf?auto=format&fit=crop&q=80&w=800",
    tag: "Cultural Experience"
  },
  {
    title: "Abyssinian Spa Retreat",
    time: "20% off for Gold Members",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800",
    tag: "Wellness"
  },
  {
    title: "Candlelight Dinner at Tibeb",
    time: "Reserve your table",
    image: "https://images.unsplash.com/photo-1414235077428-33898bd0285f?auto=format&fit=crop&q=80&w=800",
    tag: "Dining"
  }
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function GuestPortal({ setGlobalMood }) {
  const [lang, setLang] = useState('en');
  const [selectedMood, setSelectedMood] = useState(null);

  const handleMoodSelect = (moodId) => {
    setSelectedMood(moodId);
    if (setGlobalMood) setGlobalMood(moodId);
  };
  
  const hour = new Date().getHours();
  const greetingIdx = hour < 12 ? 0 : hour < 17 ? 1 : 2;
  const t = CONTENT[lang];

  return (
    <div className="flex-1 bg-stone-100 pb-20">
      
      {/* Premium Hero Section */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-coffee-950">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            src="https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Resort" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-black/20 to-black/40" />
        </div>

        {/* Top Navbar */}
        <div className="absolute top-0 w-full px-4 py-8 flex justify-between items-center z-20 max-w-7xl mx-auto left-0 right-0">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl animate-float">S</div>
             <span className="text-white font-heading font-black tracking-tighter text-2xl hidden sm:block uppercase">Selam Stay</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
              className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all font-bold shadow-lg"
            >
              <Languages size={20} />
              {lang === 'en' ? 'አማርኛ' : 'English'}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-16 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto left-0 right-0 flex flex-col sm:flex-row sm:items-end justify-between gap-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="text-white relative z-10">
            <div className="flex items-center gap-2 text-amber-400 font-black mb-4 text-sm tracking-[0.2em] uppercase">
              <Sparkles size={18} className="animate-pulse" />
              <span>{GUEST.loyalty}</span>
            </div>
            <h1 className="text-6xl sm:text-8xl font-heading font-black mb-6 text-glow leading-[0.9] tracking-tighter">
              {t.greeting[greetingIdx]},<br />{GUEST.name}
            </h1>
            <div className="flex items-center gap-6 mt-8">
               <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 text-white border-white/20">
                  <Sun size={24} className="text-amber-400" />
                  <div>
                    <div className="text-xl font-black leading-none">28°C</div>
                    <div className="text-[10px] uppercase tracking-widest text-amber-200">Sunny Addis</div>
                  </div>
               </div>
               <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 text-white border-white/20">
                  <Clock size={24} className="text-blue-400" />
                  <div>
                    <div className="text-xl font-black leading-none">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div className="text-[10px] uppercase tracking-widest text-blue-200">Local Time</div>
                  </div>
               </div>
            </div>
          </motion.div>
          
          {/* Mood Selector - Outside the Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }} 
            className="glass-card p-6 rounded-[2.5rem] border-white/20 sm:w-80"
          >
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest opacity-80">{t.moodPrompt}</h3>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map(mood => {
                const MoodIcon = mood.icon;
                const isActive = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
                      isActive ? `${mood.bg} ${mood.color} scale-105 shadow-xl` : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <MoodIcon size={18} />
                    <span className="text-xs font-bold uppercase tracking-tight">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 space-y-16">
        
        {/* Quick Access Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* AI Planner Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-10 premium-shadow card-border group cursor-pointer overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 text-amber-100 opacity-20 group-hover:opacity-40 transition-opacity">
               <Compass size={120} strokeWidth={1} />
            </div>
            <div className="flex items-center gap-8 relative z-10">
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 rounded-[2rem] text-white shadow-2xl shadow-amber-500/40 group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={40} />
              </div>
              <div>
                <h3 className="text-gray-900 font-black text-3xl mb-2 uppercase tracking-tight">{t.aiPlanner}</h3>
                <p className="text-gray-500 font-medium text-lg">{t.aiPlannerDesc}</p>
              </div>
            </div>
            <Link to="/" className="w-full sm:w-auto bg-coffee-900 hover:bg-coffee-950 text-white px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:gap-5 shadow-xl relative z-10 uppercase tracking-widest text-sm">
               Plan My Day <ChevronRight size={20} />
            </Link>
          </motion.div>

          {/* Resort Map Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }} 
            className="bg-coffee-900 rounded-[3rem] p-10 text-white shadow-2xl premium-shadow flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/20 transition-colors">
                  <MapIcon size={32} className="text-amber-400" />
                </div>
                <div className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">3D Interactive</div>
              </div>
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-none">{t.resortMap}</h3>
              <p className="text-gray-400 font-medium text-sm">Locate restaurants, pool, and spa</p>
            </div>
            <button className="mt-10 self-start text-amber-400 font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-4 transition-all">
               Explore <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Local Discovery Integration */}
        <LocalDiscovery />

        {/* Resort Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-10 px-1">
            <h2 className="text-4xl font-heading font-black text-gray-900 uppercase tracking-tighter">{t.services}</h2>
            <Link to="/services" className="text-amber-600 font-black text-base hover:text-amber-700 flex items-center gap-2 group">
              {t.viewAll} <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
            {MAIN_SERVICES.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.label} variants={item}>
                  <Link
                    to={action.to}
                    className="group flex flex-col items-center bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-center h-full premium-shadow card-border"
                  >
                    <div className={`${action.color} text-white p-6 rounded-[1.5rem] shadow-xl ${action.shadow} mb-8 group-hover:scale-110 transition-transform duration-500`}>
                      <Icon size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 uppercase tracking-tight">{action.label}</h3>
                    <p className="text-[11px] text-gray-400 font-bold leading-tight uppercase tracking-wider">{action.desc}</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Featured Experiences Slider (Simulated) */}
        <div className="pb-10">
          <h2 className="text-4xl font-heading font-black text-gray-900 mb-10 flex items-center gap-4 uppercase tracking-tighter">
            <Leaf className="text-amber-600" /> {t.featured}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {FEATURED_OFFERS.map((offer, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="group relative rounded-[3rem] overflow-hidden bg-gray-900 h-[450px] shadow-2xl hover:shadow-amber-500/10 transition-all cursor-pointer"
              >
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/10 to-transparent" />
                <div className="absolute top-8 left-8">
                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-5 py-2.5 rounded-full border border-white/30 uppercase tracking-[0.2em]">
                    {offer.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 p-10 w-full">
                  <h3 className="text-white font-heading font-black text-3xl mb-4 group-hover:text-amber-300 transition-colors uppercase tracking-tight leading-none">
                    {offer.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300 text-sm font-black flex items-center gap-3 uppercase tracking-widest">
                      <Calendar size={18} className="text-amber-400" />
                      {offer.time}
                    </p>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
