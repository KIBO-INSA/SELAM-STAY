import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare, Home, Bell, ShieldCheck, Lock, Menu, X
} from 'lucide-react';

export default function Navbar({ isManagerAuthenticated }) {
  const loc = useLocation();
  const path = loc.pathname;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = path === '/dashboard';
  const isLoginPage = path === '/login';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const guestLinks = [
    { to: '/portal', label: 'Portal', icon: Home },
    { to: '/', label: 'Concierge', icon: MessageSquare },
    { to: '/services', label: 'Services', icon: Bell },
  ];

  if (isLoginPage) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-coffee-950/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-amber-600/20'
          : 'bg-coffee-950 border-b border-amber-700/30'
      }`}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-[84px]">

          {/* ── Logo ── */}
          <Link to="/portal" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-coffee-950 font-black text-lg shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 group-hover:scale-105 transition-all duration-300">
                S
              </div>
              <div className="absolute -inset-1 bg-amber-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-heading font-extrabold text-lg tracking-tight leading-none">
                Selam Stay
              </span>
              <span className="text-amber-400/70 text-[10px] font-medium tracking-[0.2em] uppercase leading-none mt-0.5">
                AI Concierge
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {guestLinks.map(l => {
              const Icon = l.icon;
              const isActive = path === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 shadow-inner shadow-amber-500/5'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{l.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </Link>
              );
            })}

            <div className="w-px h-8 bg-white/10 mx-3" />

            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${
                isDashboard
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 shadow-lg shadow-amber-500/30'
                  : 'text-stone-400 border border-white/10 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/5'
              }`}
            >
              {isManagerAuthenticated ? <ShieldCheck size={16} /> : <Lock size={16} />}
              <span>Manager Hub</span>
            </Link>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 space-y-1 bg-coffee-950/98 border-t border-white/5">
          {guestLinks.map(l => {
            const Icon = l.icon;
            const isActive = path === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{l.label}</span>
              </Link>
            );
          })}

          <div className="border-t border-white/10 pt-2 mt-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                isDashboard
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950'
                  : 'text-stone-400 hover:text-amber-400 hover:bg-amber-500/5'
              }`}
            >
              {isManagerAuthenticated ? <ShieldCheck size={18} /> : <Lock size={18} />}
              <span>Manager Hub</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
