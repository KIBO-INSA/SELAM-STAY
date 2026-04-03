import { useState, useEffect } from 'react';
import { roomControlsAPI } from '../services/api';
import { motion } from 'framer-motion';
import { 
  Thermometer, Sun, Moon, BookOpen, Sparkles,
  EyeOff, Eye, ChevronLeft, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ROOM_ID = 3; // Demo: Deluxe Suite 201

const LIGHTING_PRESETS = [
  { mode: 'Reading',            icon: BookOpen,  desc: 'Bright & focused',       color: 'bg-yellow-100 text-yellow-700' },
  { mode: 'Relaxing',           icon: Sun,       desc: 'Warm & comfortable',     color: 'bg-amber-100 text-amber-700' },
  { mode: 'Sleep',              icon: Moon,      desc: 'Dim & soothing',         color: 'bg-indigo-100 text-indigo-700' },
  { mode: 'Ethiopian Ambiance', icon: Sparkles,  desc: 'Cultural warm glow',     color: 'bg-orange-100 text-orange-700' },
];

export default function RoomControlPage() {
  const [controls, setControls] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    roomControlsAPI.get(ROOM_ID)
      .then(res => setControls(res.data))
      .catch(() => setControls({ temperature: 22, lighting_mode: 'Relaxing', dnd_active: false, curtain_open: true }))
      .finally(() => setLoading(false));
  }, []);

  const updateControl = async (field, value) => {
    setSaving(true);
    const update = { [field]: value };
    setControls(prev => ({ ...prev, ...update }));
    try {
      const res = await roomControlsAPI.update(ROOM_ID, update);
      setControls(res.data);
    } catch (e) {
      console.error("Failed to update:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !controls) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-amber-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Navigation */}
      <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors font-medium">
        <ChevronLeft size={16} /> Back to Portal
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Room Controls</h1>
        <p className="text-gray-500 text-sm mt-1">Room 201 • Deluxe Suite</p>
      </motion.div>

      {/* Temperature Control */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
              <Thermometer size={22} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-gray-900">Temperature</h3>
              <p className="text-xs text-gray-500">Climate control</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-coffee-900 font-heading">{controls.temperature}°</span>
            <span className="text-lg text-gray-400">C</span>
          </div>
        </div>
        
        <input
          type="range"
          min="18"
          max="30"
          step="0.5"
          value={controls.temperature}
          onChange={(e) => updateControl('temperature', parseFloat(e.target.value))}
          className="w-full h-2 bg-gradient-to-r from-blue-200 via-green-200 to-red-200 rounded-full appearance-none cursor-pointer accent-amber-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1 font-medium">
          <span>18°C Cool</span>
          <span>22°C Comfort</span>
          <span>30°C Warm</span>
        </div>
      </motion.div>

      {/* Lighting Presets */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <h3 className="font-heading font-bold text-gray-900 mb-4">Lighting Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          {LIGHTING_PRESETS.map(preset => {
            const Icon = preset.icon;
            const isActive = controls.lighting_mode === preset.mode;
            return (
              <button
                key={preset.mode}
                onClick={() => updateControl('lighting_mode', preset.mode)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isActive 
                    ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.02]' 
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`inline-flex p-2 rounded-lg mb-2 ${isActive ? 'bg-amber-100 text-amber-700' : preset.color}`}>
                  <Icon size={18} />
                </div>
                <div className="font-semibold text-gray-900 text-sm">{preset.mode}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Toggles */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* DND Toggle */}
        <button
          onClick={() => updateControl('dnd_active', !controls.dnd_active)}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
            controls.dnd_active 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${controls.dnd_active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                <EyeOff size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900">Do Not Disturb</div>
                <div className="text-xs text-gray-500">
                  {controls.dnd_active ? 'Active — staff will not knock' : 'Inactive — normal service'}
                </div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
              controls.dnd_active ? 'bg-red-500 justify-end' : 'bg-gray-300 justify-start'
            }`}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </button>

        {/* Curtain Toggle */}
        <button
          onClick={() => updateControl('curtain_open', !controls.curtain_open)}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
            controls.curtain_open 
              ? 'border-amber-300 bg-amber-50' 
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${controls.curtain_open ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                <Eye size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900">Curtains</div>
                <div className="text-xs text-gray-500">
                  {controls.curtain_open ? 'Open — enjoying the view' : 'Closed — privacy mode'}
                </div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
              controls.curtain_open ? 'bg-amber-500 justify-end' : 'bg-gray-300 justify-start'
            }`}>
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </button>
      </motion.div>

      {saving && (
        <div className="text-center text-xs text-gray-400 font-medium animate-pulse">
          Saving changes...
        </div>
      )}
    </div>
  );
}
