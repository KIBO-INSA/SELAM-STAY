import { useState } from 'react';
import { sentimentAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertTriangle, CheckCircle2, MessageSquareText, Meh, Frown, Smile } from 'lucide-react';

export default function FeedbackPage() {
  const [message,  setMessage]  = useState('');
  const [room,     setRoom]     = useState('');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await sentimentAPI.analyze(1, room || 'N/A', message);
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const EMOJI_COMPONENT = {
    positive: <Smile className="text-green-500 w-12 h-12" />,
    neutral:  <Meh className="text-amber-500 w-12 h-12" />,
    negative: <Frown className="text-red-500 w-12 h-12" />
  };

  const BG_COLOR = {
    positive: 'bg-green-50 border-green-200',
    neutral:  'bg-amber-50 border-amber-200',
    negative: 'bg-red-50 border-red-200'
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-50 blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-coffee-50 blur-3xl opacity-50 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 z-10"
      >
        <div className="bg-coffee-900 text-white px-8 py-10 relative">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <MessageSquareText size={80} />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-2">Share Your Experience</h2>
          <p className="text-coffee-100/80 text-sm">Your feedback helps us serve you better and maintain perfect hospitality.</p>
        </div>

        <div className="px-8 py-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Room Number (Optional)</label>
            <input 
              value={room} 
              onChange={e => setRoom(e.target.value)} 
              placeholder="e.g., 201" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors outline-none text-gray-800"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Your Detailed Feedback <span className="text-red-500">*</span></label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us about your stay..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors outline-none resize-y text-gray-800"
            />
          </div>

          <button 
            onClick={submit} 
            disabled={loading || !message.trim()}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg disabled:hover:shadow-none"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Send className="w-5 h-5 opacity-50" />
              </motion.div>
            ) : (
              <>
                <span>Submit Feedback</span>
                <Send className="w-5 h-5" />
              </>
            )}
          </button>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                className={`mt-6 border rounded-2xl p-6 text-center ${BG_COLOR[result.sentiment]} transition-all`}
              >
                <div className="flex justify-center mb-3">
                  {EMOJI_COMPONENT[result.sentiment]}
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Thank you for your feedback!</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4">
                  Sentiment detected: <span className="font-semibold uppercase tracking-wider">{result.sentiment}</span>
                </p>
                {result.alert ? (
                  <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-bold">
                    <AlertTriangle size={16} />
                    <span>Flagged for immediate manager attention</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-xs font-bold">
                    <CheckCircle2 size={16} />
                    <span>Feedback securely saved</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
