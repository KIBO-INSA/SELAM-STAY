import { useState, useEffect } from 'react';
import { serviceAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, Sparkle, Car, Star, ChevronLeft,
  Loader2, CheckCircle2, Clock, Send, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GUEST_ID = 1;
const ROOM_NUMBER = "201";

const CATEGORIES = [
  { id: 'Room Service',  icon: UtensilsCrossed, color: 'from-amber-500 to-orange-500',  examples: 'Food, drinks, in-room dining' },
  { id: 'Housekeeping',  icon: Sparkle,         color: 'from-emerald-500 to-teal-500',   examples: 'Towels, cleaning, minibar' },
  { id: 'Spa',           icon: Star,            color: 'from-purple-500 to-indigo-500',   examples: 'Massage, sauna, wellness' },
  { id: 'Transport',     icon: Car,             color: 'from-blue-500 to-cyan-500',       examples: 'Airport shuttle, day trips' },
];

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700',  icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',    icon: Loader2 },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
};

export default function ServiceRequestPage() {
  const [selected, setSelected]     = useState(null);
  const [description, setDescription] = useState('');
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await serviceAPI.getByGuest(GUEST_ID);
      setRequests(res.data);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!selected || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await serviceAPI.create({
        guest_id: GUEST_ID,
        room_number: ROOM_NUMBER,
        category: selected,
        description: description.trim(),
        priority: "normal"
      });
      setSuccess(res.data.message);
      setSelected(null);
      setDescription('');
      await fetchRequests();
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      console.error("Submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700 transition-colors font-medium">
        <ChevronLeft size={16} /> Back to Portal
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">Request a Service</h1>
        <p className="text-gray-500 text-sm mt-1">Room {ROOM_NUMBER} • Tap a category to get started</p>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <span className="text-sm text-green-800 font-medium">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Selection */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selected === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(isActive ? null : cat.id)}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive 
                  ? 'border-amber-500 bg-amber-50 shadow-lg' 
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md mb-3`}>
                <Icon size={20} />
              </div>
              <div className="font-bold text-gray-900 text-sm">{cat.id}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{cat.examples}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Request Form */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 overflow-hidden"
          >
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Describe your {selected} request
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={`e.g., "I'd like extra towels and a bottle of water please"`}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors outline-none resize-none text-gray-800 text-sm"
              />
            </div>
            <button
              onClick={submitRequest}
              disabled={submitting || !description.trim()}
              className="w-full bg-coffee-800 hover:bg-coffee-900 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm hover:shadow-lg"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Requests */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-gray-900 text-lg flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-600" />
          Your Requests
          {requests.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{requests.length}</span>
          )}
        </h3>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="animate-spin text-amber-600 mx-auto" size={24} /></div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No service requests yet. Tap a category above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm"
                >
                  <div className={`p-2 rounded-lg ${statusCfg.color} shrink-0 mt-0.5`}>
                    <StatusIcon size={16} className={req.status === 'in_progress' ? 'animate-spin' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{req.category}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{req.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
