import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Thermometer, MessageCircle, Bell, Star, MapPin, 
  Leaf, Coffee, Sun, Wifi, ChevronRight, Sparkles,
  Key, Utensils, Calendar, Clock, Phone, Droplets
} from 'lucide-react';

const GUEST = { name: "Abebe", room: "201", type: "Deluxe Suite", loyalty: "Gold Member" };

const MAIN_SERVICES = [
  { to: '/room-controls', label: 'Room Controls',   icon: Thermometer,   desc: 'Climate & Lighting', color: 'bg-amber-500', shadow: 'shadow-amber-500/30' },
  { to: '/services',      label: 'Dining',          icon: Utensils,      desc: 'In-Room Menu',       color: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
  { to: '/',              label: 'Selam Concierge', icon: MessageCircle, desc: 'Chat & Assistance',  color: 'bg-coffee-700', shadow: 'shadow-coffee-700/30' },
  { to: '/services',      label: 'Housekeeping',    icon: Sparkles,      desc: 'Cleaning & Towels',  color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
  { to: '/services',      label: 'Spa & Wellness',  icon: Droplets,      desc: 'Book a Treatment',   color: 'bg-teal-500', shadow: 'shadow-teal-500/30' },
  { to: '/feedback',      label: 'Feedback',        icon: Star,          desc: 'Rate Your Stay',     color: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
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

export default function GuestPortal() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex-1 bg-gray-50 pb-20">
      
      {/* Premium Hero Section */}
      <div className="relative h-80 sm:h-96 w-full overflow-hidden">
        <div className="absolute inset-0 bg-coffee-900">
          <img 
            src="https://images.unsplash.com/photo-1542314831-c6a4d14faaf2?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Resort" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-900/40 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 w-full px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-white">
            <div className="flex items-center gap-2 text-amber-300 font-medium mb-2 text-sm">
              <Sparkles size={16} />
              <span>{GUEST.loyalty}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-2 shadow-sm drop-shadow-md">
              {greeting}, {GUEST.name}
            </h1>
            <p className="text-gray-200 text-lg flex items-center gap-2 drop-shadow">
              <Key size={18} className="text-amber-400" />
              Room {GUEST.room} • {GUEST.type}
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-white shadow-xl">
              <Sun size={20} className="text-amber-300" />
              <div>
                <div className="text-sm font-bold leading-none mb-0.5">28°C</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-200">Sunny</div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-white shadow-xl">
              <Clock size={20} className="text-blue-200" />
              <div>
                <div className="text-sm font-bold leading-none mb-0.5">Local Time</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-200">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-12">
        
        {/* Digital Key & Quick Action Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-2xl text-white shadow-lg shadow-amber-500/30">
              <Key size={28} />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-lg">Digital Key Active</h3>
              <p className="text-gray-500 text-sm">Hold near door lock to enter</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
             <button className="flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100 text-coffee-900 px-6 py-3 rounded-xl font-semibold border border-gray-200 flex items-center justify-center gap-2 transition-colors">
               <MapPin size={18} /> Resort Map
             </button>
             <button className="flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100 text-coffee-900 px-6 py-3 rounded-xl font-semibold border border-gray-200 flex items-center justify-center gap-2 transition-colors">
               <Phone size={18} /> Front Desk
             </button>
          </div>
        </motion.div>

        {/* Explore Resort Services */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Resort Services</h2>
            <Link to="/services" className="text-amber-600 font-semibold text-sm hover:text-amber-700 flex items-center">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MAIN_SERVICES.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.label} variants={item}>
                  <Link
                    to={action.to}
                    className="group flex flex-col items-center bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center h-full"
                  >
                    <div className={`${action.color} text-white p-4 rounded-2xl shadow-lg ${action.shadow} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{action.label}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{action.desc}</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Featured Experiences */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Leaf className="text-amber-600" /> Featured Experiences
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_OFFERS.map((offer, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="group relative rounded-3xl overflow-hidden bg-gray-900 aspect-[4/3] sm:aspect-auto sm:h-80 shadow-md hover:shadow-2xl transition-all cursor-pointer"
              >
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30 uppercase tracking-wider">
                    {offer.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 p-6 w-full">
                  <h3 className="text-white font-heading font-bold text-xl mb-1 group-hover:text-amber-300 transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-gray-300 text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-amber-400" />
                    {offer.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
