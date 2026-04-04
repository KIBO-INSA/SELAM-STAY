import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import SelamBot          from './components/SelamBot';
import Dashboard         from './components/Dashboard';
import FeedbackPage      from './pages/FeedbackPage';
import GuestPortal       from './pages/GuestPortal';
import RoomControlPage   from './pages/RoomControlPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import ResortMap from './pages/ResortMap';
import LoginPage         from './pages/LoginPage';
import { 
  Leaf, MessageSquare, LayoutDashboard, Home, 
  Thermometer, Bell, Star, ShieldCheck, Lock
} from 'lucide-react';

function Nav({ isManagerAuthenticated }) {
  const loc = useLocation();
  const path = loc.pathname;

  // Determine if we're in the Manager section
  const isDashboard = path === '/dashboard';
  const isLoginPage = path === '/login';

  const guestLinks = [
    { to: '/portal',         label: 'Portal',    icon: Home },
    { to: '/',               label: 'Concierge', icon: MessageSquare },
    { to: '/services',       label: 'Services',  icon: Bell },
  ];

  if (isLoginPage) return null; // Hide nav on login page

  return (
    <nav className="fixed top-0 w-full z-50 bg-coffee-950/80 backdrop-blur-3xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link to="/portal" className="flex-shrink-0 flex items-center gap-3 group">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:rotate-6 transition-transform">K</div>
          <span className="text-white font-heading font-black text-xl tracking-tighter uppercase leading-none">Kuriftu Stay</span>
        </Link>

        <div className="flex items-center gap-2">
          {guestLinks.map(l => {
            const Icon = l.icon;
            const isActive = path === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-amber-600/20 text-amber-500 shadow-lg shadow-amber-600/10' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}

          <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />

          <Link 
            to="/dashboard"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              isDashboard 
                ? 'bg-amber-600/20 text-amber-500 ring-1 ring-amber-500/20 shadow-xl' 
                : 'text-gray-400/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {isManagerAuthenticated ? <ShieldCheck size={14} /> : <Lock size={14} />}
            <span className="hidden sm:inline">Manager Hub</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [mood, setMood] = useState(null);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-100 text-gray-900 font-sans flex flex-col">
        <Nav isManagerAuthenticated={isManagerAuthenticated} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/map" element={<ResortMap />} />
            <Route path="/login" element={<LoginPage onLogin={setIsManagerAuthenticated} />} />
            <Route path="/dashboard" element={
              isManagerAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            } />
            
            {/* Guest Routes */}
            <Route path="/portal"        element={<GuestPortal setGlobalMood={setMood} />} />
            <Route path="/"              element={<SelamBot guestId="guest-1" mood={mood} />} />
            <Route path="/room-controls" element={<RoomControlPage />} />
            <Route path="/services"      element={<ServiceRequestPage />} />
            <Route path="/feedback"      element={<FeedbackPage />} />
            
            {/* Catch All */}
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
