import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function FloatingChatButton() {
  const loc = useLocation();
  const navigate = useNavigate();
  const path = loc.pathname;

  // Hide the floating button on these pages:
  // - Concierge page (already has the full chat)
  // - Login page
  // - Resort Map (fullscreen)
  const hiddenOn = ['/', '/login', '/map'];
  
  if (hiddenOn.includes(path)) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/')}
      className="fixed bottom-8 right-8 z-[100] group"
      aria-label="Chat with Selam AI"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping" />
      
      {/* Main Button */}
      <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-amber-500/40 transition-shadow group-hover:shadow-amber-500/60">
        <Sparkles size={26} />
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl whitespace-nowrap shadow-xl border border-white/10">
          Ask Selam AI ✨
        </div>
      </div>
    </motion.button>
  );
}