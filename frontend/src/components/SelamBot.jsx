import { useState, useRef, useEffect } from 'react';
import { conciergeAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Leaf, Sparkles, User, Loader2 } from 'lucide-react';

const WELCOME = "ሰላም! Welcome to our resort 🌿 I'm Selam, your personal AI concierge. How can I help you today?";
const QUICK_REPLIES = ['What activities are available?', 'Order room service', 'I have a complaint', 'Local attractions'];

export default function SelamBot({ guestId = 'guest-1' }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: WELCOME }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (textToSubmit) => {
    const text = typeof textToSubmit === 'string' ? textToSubmit.trim() : input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await conciergeAPI.chat(guestId, text);
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Sorry, I could not connect. Please try again or visit the front desk.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex-none bg-amber-700 rounded-t-2xl px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 p-2 rounded-full hidden sm:block">
            <Leaf size={20} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg leading-tight">Selam — AI Concierge</h2>
            <p className="text-amber-100 text-xs font-medium">English & አማርኛ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
          </span>
          <span className="text-amber-100 text-xs font-medium hidden sm:inline">Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border-x border-gray-100 overflow-y-auto px-4 py-6 sm:px-6 shadow-sm flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex w-full gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}
                
                <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-[15px] shadow-sm leading-relaxed ${
                  isUser 
                    ? 'bg-amber-700 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-gray-50 text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                }`}>
                  {m.text}
                </div>

                {isUser && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-coffee-800 flex items-center justify-center text-white mt-1">
                    <User size={16} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mt-1">
              <Sparkles size={16} />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white rounded-b-2xl border border-t-0 border-gray-100 p-4 shadow-sm">
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_REPLIES.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <input
            className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500 block w-full px-5 py-3 outline-none transition-shadow"
            placeholder="Type your message here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 bg-coffee-800 hover:bg-coffee-900 text-white rounded-full p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
