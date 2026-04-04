import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ExperienceFeedback({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-[3rem] p-10 z-[70] shadow-2xl"
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
            
            {!submitted ? (
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-heading font-black tracking-tight text-gray-900 uppercase">Rate Your Moment</h2>
                    <p className="text-gray-500 font-medium">How is your Kuriftu experience so far?</p>
                  </div>
                  <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-3 rounded-2xl transition-all ${
                        rating >= s ? 'bg-amber-500 text-white scale-110 shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Star size={32} fill={rating >= s ? "currentColor" : "none"} strokeWidth={2} />
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-black uppercase tracking-widest text-gray-400">Add a note (Optional)</p>
                   <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the service, culture, or your villa..."
                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 focus:ring-2 focus:ring-amber-500 transition-all h-32 resize-none text-gray-800 placeholder:text-gray-400"
                   />
                </div>

                <button 
                  disabled={rating === 0}
                  onClick={handleSubmit}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    rating > 0 ? 'bg-coffee-900 text-white shadow-xl hover:bg-coffee-950' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send Feedback <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl"
                >
                  <CheckCircle2 size={48} />
                </motion.div>
                <h3 className="text-3xl font-heading font-black text-gray-900 mb-2 uppercase">Thank You!</h3>
                <p className="text-gray-500 font-medium">Your feedback helps us bridge the excellence gap.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
