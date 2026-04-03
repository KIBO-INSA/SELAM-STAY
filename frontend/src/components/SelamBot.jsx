import { useState, useRef, useEffect, useCallback } from 'react';
import { conciergeAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, Sparkles, User, Loader2, Mic, MicOff,
  Volume2, VolumeX, Map, Calendar, Utensils, Bell
} from 'lucide-react';

const WELCOME = "ሰላም! I'm Selam, your AI concierge. 🌿 I know this resort inside out — ask me anything about dining, spa, activities, or let me plan your day!";

const QUICK_REPLIES = [
  { text: "What's on today's schedule?", icon: Calendar },
  { text: 'Food prices at Tibeb', icon: Utensils },
  { text: 'Book a spa session', icon: Sparkles },
  { text: 'Show me local hidden gems', icon: Map },
];

const MOOD_OPENERS = {
  lazy:     "I see you want to unwind 🌿 Let me check our spa availability and in-room dining specials for you.",
  energetic: "I love that energy! ⚡ Let me suggest some exciting activities happening today.",
  hungry:   "Hungry? 🍽️ Let me pull up our dining options and today's specials.",
  explorer: "Ready to explore? 🗺️ I have some local hidden gems you'll love — let me check what's best for today.",
};

export default function SelamBot({ guestId = 'guest-1', mood }) {
  const [messages, setMessages]     = useState([{ role: 'assistant', text: WELCOME }]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [proactiveBanner, setProactiveBanner] = useState(null);

  const bottomRef           = useRef(null);
  const recognitionRef      = useRef(null);
  const hasProactivelyAsked = useRef(false);
  const hasFetchedProactive = useRef(false);
  const synth               = useRef(window.speechSynthesis);

  // ── TTS: speak a message ──────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!ttsEnabled || !synth.current) return;
    synth.current.cancel(); // stop any current speech
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = 'en-US';
    utter.rate  = 1.0;
    utter.pitch = 1.1;
    // Try to find a female voice
    const voices = synth.current.getVoices();
    const female = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
    if (female) utter.voice = female;
    synth.current.speak(utter);
  }, [ttsEnabled]);

  // ── Proactive Time-Aware Banner ───────────────────────────────────────
  useEffect(() => {
    if (hasFetchedProactive.current) return;
    hasFetchedProactive.current = true;
    conciergeAPI.proactive(guestId)
      .then(res => {
        if (res?.data?.suggestion) {
          setProactiveBanner(res.data.suggestion);
        }
      })
      .catch(() => {}); // silent fail
  }, [guestId]);

  // ── Mood-Based Proactive Message ──────────────────────────────────────
  useEffect(() => {
    if (mood && !hasProactivelyAsked.current && messages.length === 1) {
      const text = MOOD_OPENERS[mood] || "I see you've set a new mood! How can I help?";
      setMessages(prev => [...prev, { role: 'assistant', text }]);
      speak(text);
      hasProactivelyAsked.current = true;
    }
  }, [mood, messages.length, speak]);

  // ── Auto Scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Speech Recognition ────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend   = () => setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // ── Send Message ──────────────────────────────────────────────────────
  const send = async (textToSubmit) => {
    const text = typeof textToSubmit === 'string' ? textToSubmit.trim() : input.trim();
    if (!text || loading) return;
    setInput('');
    setProactiveBanner(null);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await conciergeAPI.chat(guestId, text);
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      speak(reply);
    } catch {
      const err = '⚠️ I encountered a small glitch. Please try again!';
      setMessages(prev => [...prev, { role: 'assistant', text: err }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="flex-none bg-gradient-to-r from-coffee-900 to-coffee-800 rounded-t-[2rem] px-8 py-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Leaf size={120} strokeWidth={1} className="text-white" />
        </div>
        <div className="flex items-center gap-4 text-white relative z-10">
          <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl uppercase tracking-widest">Selam AI</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                Active · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
        {/* TTS Toggle */}
        <button
          onClick={() => { setTtsEnabled(v => !v); synth.current.cancel(); }}
          title={ttsEnabled ? 'Mute Selam' : 'Unmute Selam'}
          className={`p-3 rounded-2xl transition-all border relative z-10 ${
            ttsEnabled
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Proactive Banner */}
      <AnimatePresence>
        {proactiveBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none bg-amber-50 border-x border-amber-200 overflow-hidden"
          >
            <div className="px-6 py-3 flex items-center gap-3">
              <Bell size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm font-medium flex-1">{proactiveBanner}</p>
              <button
                onClick={() => { send(proactiveBanner.split('—')[1]?.trim() || 'What do you suggest right now?'); }}
                className="text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-all"
              >
                Tell me more
              </button>
              <button onClick={() => setProactiveBanner(null)} className="text-amber-400 hover:text-amber-600 text-lg font-bold leading-none">&times;</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Space */}
      <div className="flex-1 bg-white/80 backdrop-blur-md border-x border-gray-100 overflow-y-auto px-6 py-10 shadow-inner flex flex-col gap-8 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg animate-float">
                    <Sparkles size={18} />
                  </div>
                )}
                <div className={`max-w-[80%] px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-coffee-900 text-white rounded-[1.5rem] rounded-tr-none shadow-xl'
                    : 'bg-stone-50 text-gray-800 rounded-[1.5rem] rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  {m.text}
                </div>
                {isUser && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-stone-200 flex items-center justify-center text-gray-600 shadow-md">
                    <User size={18} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full gap-4 justify-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <div className="bg-stone-50 border border-gray-100 rounded-[1.5rem] rounded-tl-none px-6 py-5 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Console */}
      <div className="flex-none bg-white rounded-b-[2.5rem] border border-t-0 border-gray-100 p-6 shadow-2xl">
        <div className="flex flex-wrap gap-2 mb-6">
          {QUICK_REPLIES.map(q => {
            const Icon = q.icon;
            return (
              <button
                key={q.text}
                onClick={() => send(q.text)}
                disabled={loading}
                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-2xl border border-amber-200 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Icon size={14} />
                {q.text}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              className="w-full bg-stone-100 border-none text-gray-900 text-sm rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-gray-400 font-medium pr-16"
              placeholder={isListening ? '🎤 Listening...' : 'Ask Selam anything...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button
              onClick={toggleListening}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-coffee-950 hover:bg-black text-white rounded-[1.5rem] px-8 py-4 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-2 shadow-xl"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
