import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import SelamBot          from './components/SelamBot';
import Dashboard         from './components/Dashboard';
import FeedbackPage      from './pages/FeedbackPage';
import GuestPortal       from './pages/GuestPortal';
import RoomControlPage   from './pages/RoomControlPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import { 
  Leaf, MessageSquare, LayoutDashboard, Home, 
  Thermometer, Bell, Star
} from 'lucide-react';

function Nav() {
  const loc = useLocation();
  const path = loc.pathname;

  // Determine if we're in the Manager section
  const isManager = path === '/dashboard';

  const guestLinks = [
    { to: '/portal',         label: 'Portal',    icon: Home },
    { to: '/',               label: 'Concierge', icon: MessageSquare },
    { to: '/room-controls',  label: 'Room',      icon: Thermometer },
    { to: '/services',       label: 'Services',  icon: Bell },
    { to: '/feedback',       label: 'Feedback',  icon: Star },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-coffee-900/90 backdrop-blur-md border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/portal" className="flex-shrink-0 flex items-center gap-2">
          <Leaf size={20} className="text-amber-500" />
          <span className="text-amber-500 font-heading font-bold text-xl tracking-wide">Selam Stay</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Guest Links */}
          {guestLinks.map(l => {
            const Icon = l.icon;
            const isActive = path === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-amber-600/20 text-amber-500' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

          {/* Manager Link */}
          <Link 
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isManager 
                ? 'bg-amber-600/20 text-amber-500' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Manager</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAF9] text-gray-900 font-sans flex flex-col">
        <Nav />
        <main className="pt-16 flex-1 flex flex-col">
          <Routes>
            <Route path="/portal"        element={<GuestPortal />} />
            <Route path="/"              element={<SelamBot guestId="demo-guest" />} />
            <Route path="/room-controls" element={<RoomControlPage />} />
            <Route path="/services"      element={<ServiceRequestPage />} />
            <Route path="/feedback"      element={<FeedbackPage />} />
            <Route path="/dashboard"     element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
