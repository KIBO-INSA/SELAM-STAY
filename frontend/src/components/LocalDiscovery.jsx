import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Coffee, Utensils, Camera, ChevronRight, Navigation, Sparkles, X } from 'lucide-react';

const RECOMMENDATIONS = [
  {
    id: 1,
    name: "Tomoca Coffee",
    category: "Cafe",
    rating: 4.9,
    distance: "0.5 km",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
    icon: Coffee,
    color: "from-amber-500 to-orange-600",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    desc: "Legendary Ethiopian coffee since 1953. Try the signature macchiato.",
    mapQuery: "Tomoca+Coffee+Addis+Ababa"
  },
  {
    id: 2,
    name: "National Museum",
    category: "Culture",
    rating: 4.7,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1518998053502-517e2681fe30?auto=format&fit=crop&q=80&w=800",
    icon: Camera,
    color: "from-blue-500 to-indigo-600",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    desc: "Home of Lucy — the 3.2 million-year-old hominid fossil.",
    mapQuery: "National+Museum+Addis+Ababa"
  },
  {
    id: 3,
    name: "Yod Abyssinia",
    category: "Restaurant",
    rating: 4.8,
    distance: "2.5 km",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
    icon: Utensils,
    color: "from-orange-500 to-red-600",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    desc: "Traditional cuisine with live Azmari music performances nightly.",
    mapQuery: "Yod+Abyssinia+Addis+Ababa"
  }
];

export default function LocalDiscovery() {
  const [activeCard, setActiveCard] = useState(null);

  return (
    <section className="mt-12 bg-white rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-amber-100 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 border-b border-amber-100/50 pb-8">
          <div className="flex items-center gap-5">
            <div className="bg-amber-500 p-4 rounded-[1.5rem] shadow-xl shadow-amber-500/20">
              <Navigation size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-heading font-black text-stone-900 uppercase tracking-tighter leading-none mb-2">
                Local Discovery
              </h2>
              <p className="text-stone-500 font-bold tracking-wide">Top attractions just minutes away</p>
            </div>
          </div>
          <button className="bg-stone-50 hover:bg-amber-500 hover:text-white text-stone-700 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-sm border border-stone-200">
            View Map
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Interactive Bright Map Panel */}
          <div className="relative rounded-[2rem] overflow-hidden bg-stone-100 h-[500px] group border-4 border-white shadow-xl">
            <iframe
              title="Addis Ababa Vibrant Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=38.74%2C9.01%2C38.78%2C9.04&layer=mapnik&marker=9.025%2C38.76"
              className="w-full h-full absolute inset-0 z-0 grayscale-[20%] contrast-125 saturate-150"
              style={{ border: 0 }}
              loading="lazy"
            />
            
            {/* Pulsing Pin Overlay on Map */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center">
              <div className="bg-amber-500 text-white p-3 rounded-full shadow-2xl shadow-amber-500 mb-2 relative">
                <MapPin size={32} />
                <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-50" />
              </div>
              <div className="bg-white px-4 py-2 rounded-xl text-stone-900 font-black text-xs shadow-xl border border-stone-200">
                You are here
              </div>
            </div>

            {/* Float Info Box */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex items-center justify-between border border-white/50 z-20">
               <div>
                 <div className="text-stone-900 font-black uppercase text-sm tracking-wide">Your Hub</div>
                 <div className="text-stone-500 text-xs font-bold mt-1">Addis Ababa City Center</div>
               </div>
               <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2">
                 <Sparkles size={14} /> 3 Curated Spots
               </div>
            </div>
          </div>

          {/* Cards Panel */}
          <div className="flex flex-col gap-6">
            {RECOMMENDATIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[1.5rem] p-4 flex gap-5 shadow-sm hover:shadow-2xl transition-all duration-300 border border-stone-100 hover:border-amber-400 group cursor-pointer h-full"
                >
                  <div className="w-32 sm:w-40 h-32 sm:h-40 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-110 contrast-110"
                    />
                    <div className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-black text-stone-900">{item.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center py-2 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-stone-200">
                         <Icon size={10} /> {item.category}
                      </span>
                      <span className="text-[10px] font-black text-amber-600 flex items-center gap-1">
                        <MapPin size={10} /> {item.distance}
                      </span>
                    </div>

                    <h3 className="font-black text-stone-900 text-2xl group-hover:text-amber-600 transition-colors tracking-tight leading-none mb-3">
                      {item.name}
                    </h3>
                    <p className="text-stone-500 text-sm font-medium leading-snug line-clamp-2 pr-4">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
