import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Coffee, Utensils, Camera, ChevronRight } from 'lucide-react';

const RECOMMENDATIONS = [
  {
    id: 1,
    name: "Tomoca Coffee",
    category: "Cafe",
    rating: 4.9,
    distance: "0.5 km",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
    icon: Coffee,
    color: "text-amber-600"
  },
  {
    id: 2,
    name: "National Museum",
    category: "Culture",
    rating: 4.7,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1518998053502-517e2681fe30?auto=format&fit=crop&q=80&w=800",
    icon: Camera,
    color: "text-blue-600"
  },
  {
    id: 3,
    name: "Yod Abyssinia",
    category: "Restaurant",
    rating: 4.8,
    distance: "2.5 km",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
    icon: Utensils,
    color: "text-orange-600"
  }
];

export default function LocalDiscovery() {
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 leading-tight">AI Local Discovery</h2>
          <p className="text-sm text-gray-500">Hand-picked gems near your stay</p>
        </div>
        <button className="text-amber-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
          Explore All <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {RECOMMENDATIONS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex-none w-72 group cursor-pointer"
          >
            <div className="relative h-48 rounded-3xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 text-xs font-bold text-gray-900">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                {item.rating}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>
                  {item.category}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin size={12} /> {item.distance}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors uppercase">
                {item.name}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
