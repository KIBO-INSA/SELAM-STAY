import { useState, useRef, useEffect, useCallback } from 'react';
import { conciergeAPI, serviceAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, Sparkles, User, Loader2, Mic, MicOff,
  Volume2, VolumeX, Map, Calendar, Utensils, Bell, 
  Clock, CheckCircle2, ClipboardList, Info, ChevronRight,
  Coffee, Compass, ShoppingBag, BrainCircuit, RefreshCcw
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
  const [messages, setMessages]     = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [proactiveBanner, setProactiveBanner] = useState(null);
  const [view, setView]               = useState('intent'); // 'intent' or 'chat'
  const [mode, setMode]               = useState('service');
  const [guestRequests, setGuestRequests] = useState([]);

  const bottomRef           = useRef(null);
  const recognitionRef      = useRef(null);
  const hasProactivelyAsked = useRef(false);
  const hasFetchedProactive = useRef(false);
  const hasAutoSentIntent    = useRef(false);
  const synth               = useRef(window.speechSynthesis);

  // ── Load persisted conversation history ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    conciergeAPI.history(guestId, 50)
      .then(res => {
        if (cancelled) return;
        const msgs = (res?.data?.messages || []).flatMap(m => {
          const role = m.role === 'user' ? 'user' : 'assistant';
          const text = String(m.message || '');
          const parts = text.split('\n\nRecommendation: ');
          if (parts.length === 2) {
            return [
              { role, text: parts[0] },
              { role: 'assistant', text: `Suggestion: ${parts[1]}` },
            ];
          }
          return [{ role, text }];
        });

        if (msgs.length > 0) {
          setMessages(msgs);
          setHasHistory(true);
          setHistoryLoaded(true);
          return;
        }
        setMessages([{ role: 'assistant', text: WELCOME }]);
        setHasHistory(false);
        setHistoryLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([{ role: 'assistant', text: WELCOME }]);
          setHasHistory(false);
          setHistoryLoaded(true);
        }
      });

    return () => { cancelled = true; };
  }, [guestId]);

  // ── TTS: speak a message ──────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!ttsEnabled || !synth.current) return;
    synth.current.cancel(); 
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = 'en-US';
    utter.rate  = 1.0;
    utter.pitch = 1.1;
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
      .catch(() => {});
  }, [guestId]);

  // ── Intent Handling ───────────────────────────────────────────────────
  useEffect(() => {
    if (hasAutoSentIntent.current) return;
    if (!historyLoaded || hasHistory || loading) return;
    if (messages.length !== 1) return;

    const params = new URLSearchParams(window.location.search);
    const intent = params.get('intent');
    if (!intent) return;

    hasAutoSentIntent.current = true;
    setTimeout(() => {
      setMode('service');
      setView('chat');
      send(intent, 'service');
    }, 300);
    window.history.replaceState({}, document.title, "/");
  }, [historyLoaded, hasHistory, loading, messages.length]);

  // ── Mood-Based Proactive Message ──────────────────────────────────────
  useEffect(() => {
    if (mood && !hasProactivelyAsked.current && messages.length === 1) {
      const text = MOOD_OPENERS[mood] || "I see you've set a new mood! How can I help?";
      setMessages(prev => [...prev, { role: 'assistant', text }]);
      speak(text);
      hasProactivelyAsked.current = true;
    }
  }, [mood, messages.length, speak]);

  // ── Load Guest Requests for Sidebar ─────────────────────────────────
  const fetchRequests = useCallback(() => {
    serviceAPI.getByGuest(guestId)
      .then(res => setGuestRequests(res.data || []))
      .catch(() => {});
  }, [guestId]);

  useEffect(() => {
    if (view === 'chat') {
      fetchRequests();
      const interval = setInterval(fetchRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [view, fetchRequests]);

  // ── Auto Scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, view]);

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
  const send = async (textToSubmit, overrideMode) => {
    const text = typeof textToSubmit === 'string' ? textToSubmit.trim() : input.trim();
    if (!text || loading) return;
    
    if (view !== 'chat') setView('chat');
    
    const activeMode = overrideMode || mode;
    setInput('');
    setProactiveBanner(null);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await conciergeAPI.chat(guestId, text, activeMode);
      const reply = res.data.reply;
      const recommendation = res.data.recommendation;
      const refId = res.data.ref_id;
      const assignment = res.data.assignment;
      
      setMessages(prev => {
        const next = [...prev, { role: 'assistant', text: reply }];
        if (refId) {
          let extra = `Reference: #${refId}`;
          if (assignment?.staff?.name) {
            const role = assignment?.staff?.role ? ` (${assignment.staff.role})` : '';
            extra += `\nAssigned to: ${assignment.staff.name}${role}`;
          }
          next.push({ role: 'assistant', text: extra });
        }
        if (recommendation) next.push({ role: 'assistant', text: `Suggestion: ${recommendation}` });
        return next;
      });
      speak(reply);
      fetchRequests();
    } catch {
      const err = '⚠️ I encountered a small glitch. Please try again!';
      setMessages(prev => [...prev, { role: 'assistant', text: err }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      await conciergeAPI.reset(guestId);
      setMessages([{ role: 'assistant', text: WELCOME }]);
      setHasHistory(false);
      setProactiveBanner(null);
      // If we are in 'chat' view, we can stay there but reset the mode to 'service' as default
      setMode('service');
      // Or we can go back to 'intent' view
      // setView('intent');
    } catch (err) {
      console.error("Failed to reset conversation", err);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // When switching modes manually, we should reset any active service task in the backend
    conciergeAPI.reset(guestId).catch(() => {});
  };

  const handleIntentSelection = (selectedMode, initialMessage) => {
    setMode(selectedMode);
    setView('chat');
    if (initialMessage) {
      send(initialMessage, selectedMode);
    }
  };

  if (view === 'intent') {
    return (
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-12 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
              <Sparkles size={48} className="text-amber-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 tracking-tight">
            How can I assist you today?
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Select an experience category to begin your personalized journey with Selam AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <IntentCard 
            icon={Compass}
            title="Plan My Day"
            description="Create a custom itinerary based on resort events and your preferences."
            color="blue"
            onClick={() => handleIntentSelection('planning', "I'd like to plan my activities for today.")}
          />
          <IntentCard 
            icon={Coffee}
            title="Recommendations"
            description="Get personalized suggestions for dining, spa, and hidden gems."
            color="amber"
            onClick={() => handleIntentSelection('recommendation', "What do you recommend I do today?")}
          />
          <IntentCard 
            icon={Bell}
            title="Resort Services"
            description="Request housekeeping, room service, maintenance, or transport."
            color="emerald"
            onClick={() => handleIntentSelection('service', "I need assistance with resort services.")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex overflow-hidden bg-stone-100 min-h-0">
      {/* Left Section: 70% Width (Main Chat) */}
      <div className="flex-[0.7] flex flex-col border-r border-gray-100 bg-white shadow-2xl relative z-10 overflow-hidden min-h-0">
        
        {/* Header */}
        <div className="flex-none bg-gradient-to-r from-coffee-950 to-coffee-800 px-8 py-6 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Leaf size={120} strokeWidth={1} className="text-white" />
          </div>
          <div className="flex items-center gap-4 text-white relative z-10">
            <button 
              onClick={() => setView('intent')}
              className="bg-white/10 p-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all group"
              title="Return to Intent Gateway"
            >
              <ChevronRight size={18} className="rotate-180 group-hover:scale-110 transition-transform" />
            </button>
            <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30">
              <Sparkles size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl uppercase tracking-widest leading-none">Selam AI</h2>
              <div className="flex items-center gap-2 mt-1.5">
                  <select 
                    value={mode}
                    onChange={(e) => handleModeChange(e.target.value)}
                    className="bg-white/10 hover:bg-white/20 text-[9px] font-black uppercase tracking-widest text-amber-400 rounded-full py-0.5 px-3 border border-white/20 outline-none cursor-pointer transition-all appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="service" className="bg-coffee-950 text-emerald-400">service mode</option>
                    <option value="planning" className="bg-coffee-950 text-blue-400">planning mode</option>
                    <option value="recommendation" className="bg-coffee-950 text-amber-400">insight mode</option>
                  </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
             <button
              onClick={handleNewChat}
              title="Reset Conversation"
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCcw size={20} />
            </button>
             <button
              onClick={() => { setTtsEnabled(v => !v); synth.current.cancel(); }}
              className={`p-3 rounded-2xl transition-all border ${
                ttsEnabled ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* Proactive Banner */}
        <AnimatePresence>
          {proactiveBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-none bg-amber-50 border-b border-amber-200 overflow-hidden"
            >
              <div className="px-6 py-3 flex items-center gap-3">
                <Bell size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 text-sm font-medium flex-1">{proactiveBanner}</p>
                <button
                  onClick={() => send(proactiveBanner.split('—')[1]?.trim() || 'Tell me more')}
                  className="text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-all"
                >
                  Action
                </button>
                <button onClick={() => setProactiveBanner(null)} className="text-amber-400 hover:text-amber-600 text-lg">&times;</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages - The Scroll Container */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-stone-50/10">
          <div className="px-6 py-10 flex flex-col gap-8">
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
                      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles size={18} />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isUser
                        ? 'bg-coffee-950 text-white rounded-[1.5rem] rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-[1.5rem] rounded-tl-none border border-gray-100'
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
              <div className="flex w-full gap-4 justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white animate-pulse">
                  <Sparkles size={18} />
                </div>
                <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-tl-none px-6 py-5 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-4 flex-none" />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-none p-6 bg-white border-t border-gray-100">
           <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_REPLIES.slice(0, 3).map(q => (
                <button
                  key={q.text}
                  onClick={() => send(q.text)}
                  className="text-xs font-bold text-coffee-800 bg-coffee-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-coffee-100 transition-all flex items-center gap-2"
                >
                  <q.icon size={14} className="text-amber-600" />
                  {q.text}
                </button>
              ))}
           </div>
           <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                className="w-full bg-stone-100 border-none text-gray-900 text-sm rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium pr-16"
                placeholder={isListening ? '🎤 Listening...' : 'Tell Selam what you need...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                disabled={loading}
              />
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-coffee-950 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-xl flex items-center gap-2"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section: 30% Width (Experience sidebar) */}
      <div className="flex-[0.3] bg-stone-50 border-l border-gray-200 flex flex-col overflow-hidden min-h-0">
        <div className="p-8 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 bg-coffee-900 text-amber-400 rounded-xl">
               <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="text-lg font-heading font-black text-coffee-950 uppercase tracking-widest leading-none">Experience Panel</h3>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter mt-1">Real-time Service Monitoring</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10">
          {/* Active Queue Section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-amber-600" /> Active Requests
              </h4>
              <span className="bg-amber-500/10 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {guestRequests.filter(r => r.status !== 'completed').length} Live
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {guestRequests.filter(r => r.status !== 'completed').length === 0 ? (
                <div className="p-8 rounded-[2rem] border border-dashed border-gray-300 text-center flex flex-col items-center gap-2 bg-white/50">
                  <ShoppingBag size={24} className="text-gray-300" />
                  <p className="text-xs text-gray-400 font-medium italic">No active services in the queue.</p>
                </div>
              ) : (
                guestRequests.filter(r => r.status !== 'completed').map(req => {
                  const isUrgent = req.priority === 'high';
                  return (
                    <motion.div 
                      key={req.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                    >
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isUrgent ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-coffee-800 uppercase tracking-widest">{req.category}</span>
                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-tighter ${
                          req.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-coffee-950 mb-2 leading-snug">{req.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                         <span className="flex items-center gap-1"><Clock size={10} /> {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         {isUrgent && <span className="text-rose-500 font-black flex items-center gap-1 uppercase tracking-tighter">Urgent Priority</span>}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Log / History Section */}
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Completed Journey
            </h4>
            <div className="flex flex-col gap-3">
              {guestRequests.filter(r => r.status === 'completed').length === 0 ? (
                <p className="text-[11px] text-gray-400 italic px-4">Your completed services will appear here.</p>
              ) : (
                guestRequests.filter(r => r.status === 'completed').slice(0, 5).map(req => (
                  <div key={req.id} className="bg-white border border-transparent hover:border-gray-100 rounded-2xl p-4 flex items-center gap-4 transition-all opacity-70 group hover:opacity-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-700 uppercase tracking-widest leading-none mb-1">{req.category}</p>
                      <p className="text-[11px] text-gray-500 truncate leading-snug">{req.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Strategy Insights Card */}
          <div className="mt-auto p-6 rounded-[2rem] bg-gradient-to-br from-coffee-950 to-coffee-800 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h5 className="text-xs font-heading font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <BrainCircuit size={16} className="text-amber-400" />
                Resort Concierge Tip
              </h5>
              <p className="text-xs leading-relaxed text-gray-300 font-medium">
                Our staff has been notified of your preferences. Your coffee will be served with exactly three sugars, just as you like it in Villa #104.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                <Sparkles size={10} /> Personalized Experience Active
              </div>
            </div>
            <Leaf size={60} className="absolute -bottom-6 -right-6 opacity-10 rotate-45 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function IntentCard({ icon: Icon, title, description, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-600/5 border-blue-500/10 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30',
    amber: 'bg-amber-600/5 border-amber-500/10 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30',
    emerald: 'bg-emerald-600/5 border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30',
  };

  const accentColor = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-10 rounded-[3rem] border text-left flex flex-col items-start gap-6 transition-all duration-500 group shadow-lg ${colorMap[color]} backdrop-blur-sm`}
    >
      <div className={`p-4 rounded-2xl bg-white shadow-xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500`}>
        <Icon size={32} />
      </div>
      <div>
        <h3 className="text-xl font-heading font-black uppercase tracking-[0.1em] mb-3 text-white group-hover:text-amber-500 transition-colors">{title}</h3>
        <p className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
      </div>
      <div className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
        Initiate <div className={`w-6 h-[2px] ${accentColor[color]}`} /> <ChevronRight size={14} />
      </div>
    </motion.button>
  );
}
