import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Info, Compass, 
  ChevronLeft, Sparkles, Utensils, 
  Droplets, Target, Globe, Phone, Clock
} from 'lucide-react';

const HOTSPOTS = [
  { 
    id: 'villa-1', 
    name: 'Your Villa: Ethiopia', 
    type: 'villa', 
    x: '45%', y: '55%', 
    desc: 'The heart of your stay. A celebrating of Abyssinian heritage.',
    amenities: ['Private Garden', 'Traditional Art'],
    action: 'View Cultural Story'
  },
  { 
    id: 'dining-1', 
    name: '1963 Restaurant', 
    type: 'dining', 
    x: '62%', y: '42%', 
    desc: 'Commemorating the founding of the OAU. Fine Pan-African dining.',
    amenities: ['Regional Specials', 'Lagoon View'],
    action: 'Reserve Table'
  },
  { 
    id: 'spa-1', 
    name: 'Abyssinian Spa', 
    type: 'spa', 
    x: '28%', y: '35%', 
    desc: 'Signature Ethiopian and African wellness therapies.',
    amenities: ['Coffee Scrub', 'Steam Room'],
    action: 'Book Treatment'
  },
  { 
    id: 'lagoon-1', 
    name: 'The Central Lagoon', 
    type: 'leisure', 
    x: '50%', y: '48%', 
    desc: 'A serene waterway connecting the 54 nations of the village.',
    amenities: ['Boat Tours', 'Sunset Views'],
    action: 'Explore Activities'
  },
];

export default function ResortMap() {
  const [selected, setSelected] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Reveal animation delay
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAction = (spot) => {
    if (spot.type === 'spa') navigate('/services');
    if (spot.type === 'dining') navigate('/services');
    if (spot.type === 'villa') navigate('/portal');
    // More actions can be added here
  };

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900 flex flex-col overflow-hidden">
      
      {/* Dynamic Map Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.img 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: isLoaded ? 1.05 : 1.2, opacity: isLoaded ? 0.8 : 0 }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "reverse" }}
          src="/resort_map.png" 
          className="w-full h-full object-cover grayscale opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
      </div>

      {/* Header UI */}
      <header className="relative z-10 px-8 py-8 flex items-center justify-between pointer-events-none">
        <motion.button 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => navigate('/portal')}
          className="pointer-events-auto bg-white/10 backdrop-blur-3xl border border-white/10 p-4 rounded-full text-white hover:bg-white/20 transition-all shadow-2xl"
        >
          <ChevronLeft size={24} />
        </motion.button>

        <motion.div 
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="flex flex-col items-center gap-1"
        >
           <div className="flex items-center gap-3 text-amber-500 font-black text-xs uppercase tracking-[0.4em] mb-1">
             <Navigation size={14} className="animate-pulse" />
             <span>Resort Exploration</span>
           </div>
           <h2 className="text-white text-3xl font-heading font-black uppercase tracking-tighter mix-blend-difference">
             The African Village
           </h2>
        </motion.div>

        <div className="w-14 h-14" /> {/* Spacer */}
      </header>

      {/* Interactive Hub */}
      <div className="flex-1 relative">
        <AnimatePresence>
          {HOTSPOTS.map((spot) => (
            <motion.div
              key={spot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 + Math.random() * 0.5 }}
              style={{ left: spot.x, top: spot.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
            >
              <button 
                onClick={() => setSelected(spot)}
                className={`relative w-8 h-8 rounded-full border-2 bg-stone-950/80 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:scale-125 ${
                  selected?.id === spot.id ? 'border-amber-500 ring-8 ring-amber-500/20' : 'border-white/40 hover:border-amber-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selected?.id === spot.id ? 'bg-amber-500 animate-ping' : 'bg-white'}`} />
                {selected?.id === spot.id && (
                  <motion.div 
                    layoutId="pin-pulse"
                    className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse" 
                  />
                )}
              </button>
              
              {/* Tooltip Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-500 border border-white/10">
                   {spot.name}
                 </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Location Card */}
      <footer className="relative z-20 px-4 sm:px-8 pb-12">
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="max-w-4xl mx-auto glass-card p-10 rounded-[3rem] border-white/10 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
               {/* Background Glow */}
               <div className="absolute top-0 right-0 p-20 opacity-10 text-amber-500 pointer-events-none">
                  {selected.type === 'spa' && <Droplets size={120} />}
                  {selected.type === 'dining' && <Utensils size={120} />}
                  {selected.type === 'villa' && <Globe size={120} />}
               </div>

               <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-black mb-4 md:mb-0 shadow-2xl ${
                    selected.type === 'spa' ? 'bg-teal-500' : 
                    selected.type === 'dining' ? 'bg-orange-500' : 'bg-amber-500'
                  }`}>
                    {selected.type === 'spa' && <Droplets size={32} />}
                    {selected.type === 'dining' && <Utensils size={32} />}
                    {selected.type === 'villa' && <MapPin size={32} />}
                    {selected.type === 'leisure' && <Compass size={32} />}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <h3 className="text-white text-3xl font-heading font-black uppercase tracking-tighter">{selected.name}</h3>
                        <span className="hidden sm:inline bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                          {selected.type}
                        </span>
                     </div>
                     <p className="text-gray-400 font-bold text-sm mb-6 leading-relaxed max-w-xl">{selected.desc}</p>
                     
                     <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {selected.amenities.map(a => (
                          <div key={a} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-gray-300 border border-white/5">
                             <div className="w-1 h-1 rounded-full bg-amber-500" />
                             {a}
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-auto">
                     <button 
                       onClick={() => handleAction(selected)}
                       className="bg-white text-black px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-2xl group"
                     >
                        <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                        {selected.action}
                     </button>
                     <button 
                       onClick={() => setSelected(null)}
                       className="text-white/40 font-black uppercase tracking-[0.3em] text-[9px] hover:text-white transition-colors py-2 text-center"
                     >
                       Close Detail
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Instructions Overlay */}
        {!selected && isLoaded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            Tap a location pin to explore Kuriftu details
          </motion.div>
        )}
      </footer>

      {/* Radar Pulse UI Decoration */}
      <div className="fixed bottom-0 right-0 p-8 opacity-20 pointer-events-none">
         <div className="relative">
            <div className="w-40 h-40 rounded-full border border-white/10 animate-ping shadow-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Compass size={40} className="text-white animate-pulse" />
            </div>
         </div>
      </div>

    </div>
  );
}
