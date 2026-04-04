import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Bell, Star, MapPin, 
  Leaf, Coffee, Sun, ChevronRight, Sparkles,
  Key, Utensils, Calendar, Phone, Droplets,
  Languages, Zap, Smile, Mountain,
  Compass, Info, CloudRain, Map as MapIcon, Clock,
  Globe, Award, HelpCircle, History,
  Share2, ExternalLink, Link2
} from 'lucide-react';
import LocalDiscovery from '../components/LocalDiscovery';
import ExperienceFeedback from '../components/ExperienceFeedback';

const GUEST = { name: "Abebe", id: "guest-1", loyalty: "Gold Member" };

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
    resortMap: "Interactive Map",
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
    resortMap: "በይነተገናኝ ካርታ",
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
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [selectedMood, setSelectedMood] = useState(null);
  const [villaTheme, setVillaTheme] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/guest/villa-theme/${GUEST.id}`)
      .then(res => res.json())
      .then(data => setVillaTheme(data))
      .catch(err => console.error("Could not fetch villa theme", err));
  }, []);

  const handleMoodSelect = (moodId) => {
    setSelectedMood(moodId);
    if (setGlobalMood) setGlobalMood(moodId);
  };
  
  const hour = new Date().getHours();
  const greetingIdx = hour < 12 ? 0 : hour < 17 ? 1 : 2;
  const t = CONTENT[lang];

  return (
    <div className="flex-1 bg-stone-50 overflow-x-hidden pt-20">
      
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-stone-900">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "reverse" }}
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600" 
            alt="Kuriftu Luxury Discovery" 
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-black/50" />
        </div>
        
        <div className="absolute bottom-16 w-full px-6 max-w-7xl mx-auto left-0 right-0 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-white relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 text-amber-400 font-black mb-6 text-[10px] tracking-[0.3em] uppercase">
              <Award size={18} className="animate-pulse" />
              <span>{GUEST.loyalty} Reward</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-heading font-black mb-6 text-glow leading-[1] tracking-tighter">
              {t.greeting[greetingIdx]},<br />{GUEST.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-6">
               <div className="glass-dark px-6 py-3 rounded-[1.5rem] flex items-center gap-3 text-white">
                  <Sun size={24} className="text-amber-400" />
                  <div>
                    <div className="text-xl font-black leading-none">28°C</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200 mt-1">Addis Ababa</div>
                  </div>
               </div>
               {villaTheme && (
                <div className="glass-dark px-6 py-3 rounded-[1.5rem] flex items-center gap-3 text-white group cursor-pointer hover:bg-amber-500/10 transition-all border border-white/10"
                     onClick={() => setIsStoryOpen(true)}>
                   <History size={24} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                   <div>
                     <div className="text-xl font-black leading-none">{villaTheme.region}</div>
                     <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200 mt-1">Discover Heritage</div>
                   </div>
                </div>
               )}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }} 
            className="glass-dark p-8 rounded-[3rem] lg:w-80 backdrop-blur-3xl"
          >
            <h3 className="text-white font-black text-[9px] mb-6 uppercase tracking-[0.3em] opacity-60 text-center">{t.moodPrompt}</h3>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map(mood => {
                const MoodIcon = mood.icon;
                const isActive = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] transition-all duration-500 group ${
                      isActive ? `${mood.bg} ${mood.color} scale-105 shadow-2xl` : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`${isActive ? '' : 'text-white/40 group-hover:text-amber-400'} transition-colors`}>
                      <MoodIcon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 space-y-20 pb-40">
        
        {/* Planner and Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            onClick={() => navigate('/?intent=Plan+my+day')}
            className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-8 group cursor-pointer overflow-hidden relative border border-gray-100"
          >
            <div className="absolute top-0 right-0 p-12 text-amber-500/5 group-hover:text-amber-500/10 transition-colors pointer-events-none">
               <Globe size={200} strokeWidth={1} />
            </div>
            <div className="flex items-center gap-8 relative z-10 w-full sm:w-auto">
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-amber-500/30 group-hover:scale-105 transition-all duration-700">
                <Sparkles size={40} />
              </div>
              <div>
                <h3 className="text-stone-900 font-black text-3xl mb-2 uppercase tracking-tighter">{t.aiPlanner}</h3>
                <p className="text-stone-400 font-bold text-base leading-tight">Masterplan your discovery</p>
              </div>
            </div>
            <div className="w-full sm:w-auto bg-stone-900 hover:bg-amber-500 text-white hover:text-black px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-4 transition-all shadow-2xl relative z-10 uppercase tracking-[0.2em] text-[10px]">
               Ask Selam <ChevronRight size={18} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }} 
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => navigate('/map')}
            className="bg-stone-900 rounded-[3.5rem] p-10 text-white shadow-xl flex flex-col justify-between group overflow-hidden relative cursor-pointer"
          >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-white/10 p-5 rounded-3xl border border-white/10 group-hover:bg-amber-500/20 transition-all duration-500">
                  <MapIcon size={28} className="text-amber-400" />
                </div>
                <span className="bg-amber-500/10 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-amber-500/20 text-amber-500">Village Hub</span>
              </div>
              <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-none">{t.resortMap}</h3>
              <p className="text-stone-400 font-bold text-sm leading-tight">Explore 54 Nations & Dining Hubs</p>
            </div>
            <div className="mt-10 self-start text-amber-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 group-hover:gap-5 transition-all">
               Open Explorer <ChevronRight size={18} />
            </div>
          </motion.div>
        </div>

        {/* Services Section */}
        <section>
          <div className="flex items-center justify-between mb-12 px-4">
            <h2 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 uppercase tracking-tighter">Resort Catalog</h2>
            <Link to="/services" className="text-amber-600 font-black text-[10px] uppercase tracking-widest hover:text-amber-700 flex items-center gap-3 group">
              {t.viewAll} <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 px-4">
            {MAIN_SERVICES.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.label} variants={item}>
                  <Link
                    to={action.to}
                    className="group flex flex-col items-center bg-white rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 text-center h-full border border-stone-50"
                  >
                    <div className={`${action.color} text-white p-6 rounded-[1.5rem] shadow-xl ${action.shadow} mb-8 group-hover:scale-110 transition-all duration-700`}>
                      <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-black text-stone-900 text-lg mb-2 uppercase tracking-tight leading-tight">{action.label}</h3>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest leading-tight">{action.desc}</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Featured Offers */}
        <section className="py-10">
          <h2 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 mb-12 flex items-center gap-4 uppercase tracking-tighter px-4">
            <Leaf className="text-amber-600" /> {t.featured}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {FEATURED_OFFERS.map((offer, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                onClick={() => navigate(`/?intent=Book+${encodeURIComponent(offer.title)}`)}
                className="group relative rounded-[4rem] overflow-hidden bg-stone-950 h-[500px] shadow-2xl hover:shadow-amber-500/20 transition-all cursor-pointer"
              >
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                <div className="absolute top-10 left-10">
                  <span className="bg-black/60 backdrop-blur-xl text-white text-[9px] font-black px-6 py-3 rounded-full border border-white/20 uppercase tracking-[0.3em]">
                    {offer.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 p-12 w-full">
                  <h3 className="text-white font-heading font-black text-3xl mb-6 group-hover:text-amber-400 transition-colors uppercase tracking-tight leading-none">
                    {offer.title}
                  </h3>
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <p className="text-stone-300 text-xs font-black flex items-center gap-3 uppercase tracking-[0.2em]">
                      <Clock size={16} className="text-amber-500 font-black" />
                      {offer.time}
                    </p>
                    <div className="w-14 h-14 rounded-3xl bg-amber-500 text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                      <ChevronRight size={28} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* UTILITY & SERVICE QUICK BOOKING */}
        <section className="py-10">
          <div className="flex items-center justify-between mb-12 px-4 shadow-sm pb-4">
            <h2 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 uppercase tracking-tighter">Utility Hub</h2>
            <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full text-amber-600 font-black text-[10px] uppercase tracking-widest border border-amber-500/20">
               <Zap size={14} /> Instant AI Action
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
             <UtilityCard 
                title="Abyssinian Spa" 
                desc="Coffee Scrub & Wellness" 
                icon={Droplets} 
                color="bg-teal-500 shadow-teal-500/20" 
                action="Book Treatment"
                navigate={navigate}
             />
             <UtilityCard 
                title="Lakeside 1963" 
                desc="Reserve Prime Dining" 
                icon={Utensils} 
                color="bg-orange-500 shadow-orange-500/20" 
                action="Reserve Table"
                navigate={navigate}
             />
             <UtilityCard 
                title="Room Refresh" 
                desc="Request Housekeeping" 
                icon={Sparkles} 
                color="bg-emerald-500 shadow-emerald-500/20" 
                action="Request Service"
                navigate={navigate}
             />
          </div>
        </section>

        <LocalDiscovery />

      </div>

      {/* FOOTER */}
      <footer className="bg-stone-900 pt-20 pb-40 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black text-xl">K</div>
                <h3 className="text-xl font-heading font-black uppercase tracking-tighter">Kuriftu Stay</h3>
             </div>
             <p className="text-stone-400 text-xs leading-relaxed">
               An immersive 54-nation sanctuary where African heritage meets high-performance luxury.
             </p>
             <div className="flex items-center gap-4 pt-4">
                <Share2 className="text-stone-500 hover:text-amber-500 cursor-pointer transition-colors" size={20} />
                <ExternalLink className="text-stone-500 hover:text-amber-500 cursor-pointer transition-colors" size={20} />
                <Link2 className="text-stone-500 hover:text-amber-500 cursor-pointer transition-colors" size={20} />
             </div>
          </div>

          <div>
             <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-6">Sanctuary</h4>
             <ul className="space-y-4 text-xs font-bold text-stone-400">
                <li className="hover:text-white cursor-pointer transition-colors">Abyssinian Spa</li>
                <li className="hover:text-white cursor-pointer transition-colors">1963 Restaurant</li>
                <li className="hover:text-white cursor-pointer transition-colors">Digital Concierge</li>
             </ul>
          </div>

          <div>
             <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-6">Resort</h4>
             <ul className="space-y-4 text-xs font-bold text-stone-400">
                <li className="hover:text-white cursor-pointer transition-colors">The 54 Villas</li>
                <li className="hover:text-white cursor-pointer transition-colors">Activity Hub</li>
                <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
             </ul>
          </div>

          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
             <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-4">Membership</h4>
             <p className="text-stone-300 text-[10px] font-bold leading-relaxed mb-6">Join Gold Elite for 20% off all services.</p>
             <button className="w-full bg-amber-500 text-black py-3 rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all">Join Program</button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom UI (Feedback & Story Only) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
        <div className="bg-black/90 backdrop-blur-3xl border border-white/10 p-2 rounded-[3.5rem] shadow-2xl flex items-center justify-center gap-4">
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-[2.5rem] py-4 flex flex-col items-center gap-1 transition-all group"
          >
            <Smile size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Mood</span>
          </button>
          
          <button 
            onClick={() => setIsStoryOpen(true)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-[2.5rem] py-4 flex flex-col items-center gap-1 transition-all group"
          >
            <History size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Story</span>
          </button>
        </div>
      </div>

      <ExperienceFeedback isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      <AnimatePresence>
        {isStoryOpen && villaTheme && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStoryOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120]" />
            <motion.div 
              initial={{ y: 200, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 200, opacity: 0 }} 
              className="fixed inset-x-6 top-20 bottom-20 max-w-5xl mx-auto bg-stone-900 border border-white/10 rounded-[4rem] z-[130] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
            >
              <div className="lg:w-2/5 h-64 lg:h-full relative overflow-hidden">
                <img src="/kuriftu_luxury_sunset_hero.png" className="w-full h-full object-cover" alt="Villa" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-10 left-10 z-10">
                  <div className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">{villaTheme.region}</div>
                </div>
              </div>
              <div className="lg:w-3/5 p-12 lg:p-20 overflow-y-auto bg-stone-900 text-white flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-6">
                    <Globe className="text-amber-500" size={24} />
                    <span className="text-amber-500 font-black uppercase tracking-[0.3em] text-xs">{villaTheme.country} heritage</span>
                 </div>
                 <h2 className="text-4xl lg:text-7xl font-heading font-black mb-6 leading-none tracking-tighter uppercase">{villaTheme.country}</h2>
                 <p className="text-lg text-gray-300 font-medium mb-10 leading-relaxed italic opacity-80">"{villaTheme.story}"</p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest mb-4 flex items-center gap-2">
                         <Info size={12} /> Room Artifacts
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {villaTheme.artifacts?.map(a => (
                            <span key={a} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold">{a}</span>
                          ))}
                       </div>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest mb-4 flex items-center gap-2">
                         <Utensils size={12} /> Heritage Cuisine
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {villaTheme.cuisine?.map(c => (
                            <span key={c} className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tight">{c}</span>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <button onClick={() => setIsStoryOpen(false)} className="mt-16 bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 transition-colors w-full sm:w-auto px-12 self-start">Close Discovery</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function UtilityCard({ title, desc, icon: Icon, color, action, navigate }) {
  return (
    <motion.button 
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white p-10 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all border border-gray-100 flex flex-col items-center text-center group"
      onClick={() => {
        navigate(`/?intent=Book+${encodeURIComponent(title)}`);
      }}
    >
      <div className={`${color} text-white p-7 rounded-[2rem] mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl`}>
         <Icon size={36} />
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight leading-none">{title}</h3>
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-10 leading-tight">{desc}</p>
      <div className="w-full bg-stone-50 group-hover:bg-amber-500 group-hover:text-black py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500">
         {action}
      </div>
    </motion.button>
  );
}
