import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar               from './components/Navbar';
import FloatingChatButton   from './components/FloatingChatButton';
import SelamBot             from './components/SelamBot';
import Dashboard            from './components/Dashboard';
import FeedbackPage         from './pages/FeedbackPage';
import GuestPortal          from './pages/GuestPortal';
import RoomControlPage      from './pages/RoomControlPage';
import ServiceRequestPage   from './pages/ServiceRequestPage';
import Login                from './pages/Login';
import Register             from './pages/Register';
import Preference           from './pages/Preference';
import ResortMap            from './pages/ResortMap';

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadSession() {
  try {
    const token = localStorage.getItem('selam_token');
    const raw   = localStorage.getItem('selam_user');
    if (token && raw) return JSON.parse(raw);
  } catch { /* corrupted storage */ }
  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => loadSession());  // restore on refresh
  const [mood, setMood] = useState(null);
  const [needsPreferences, setNeedsPreferences] = useState(() => {
    const sessionUser = loadSession();
    return sessionUser?.role === 'guest' && 
           (!sessionUser.preferences || sessionUser.preferences === '{}' || sessionUser.preferences === 'null');
  });
  const [preferences, setPreferences] = useState({ food: '', drink: '', activity: '' });

  // Keep user in sync if localStorage is cleared in another tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'selam_user' && !e.newValue) setUser(null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogin = (userData, isRegistration = false) => {
    setUser(userData);
    if (userData.role === 'guest') {
      const prefs = userData.preferences;
      if (isRegistration || !prefs || prefs === '{}' || prefs === 'null') {
        setNeedsPreferences(true);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('selam_token');
    localStorage.removeItem('selam_user');
    setUser(null);
  };

  const isManagerAuthenticated = user?.role === 'manager';

  // ── Not logged in: show auth pages ────────────────────────────────────────
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="*"         element={<Login    onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // ── Newly registered guest: show Preference onboarding ─────────────────────
  if (user.role === 'guest' && needsPreferences) {
    return (
      <Preference
        guestId={user.id}
        preferences={preferences}
        setPreferences={setPreferences}
        onComplete={() => {
          const updatedUser = { ...user, preferences: JSON.stringify(preferences) };
          setUser(updatedUser);
          localStorage.setItem('selam_user', JSON.stringify(updatedUser));
          setNeedsPreferences(false);
        }}
      />
    );
  }

  // ── Logged in: show full app ───────────────────────────────────────────────
  const guestId    = String(user.id);
  const roomNumber = user.room_number ?? '101';

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0D0A06] text-gray-100 font-sans flex flex-col">
        <Navbar isManagerAuthenticated={isManagerAuthenticated} user={user} onLogout={handleLogout} />
        <main className="pt-20 flex-1 flex flex-col">
          <Routes>
            {user.role === 'guest' ? (
              <>
                <Route path="/"              element={<SelamBot guestId={guestId} mood={mood} />} />
                <Route path="/portal"        element={<GuestPortal setGlobalMood={setMood} user={user} />} />
                <Route path="/room-controls" element={<RoomControlPage roomNumber={roomNumber} />} />
                <Route path="/services"      element={<ServiceRequestPage guestId={guestId} roomNumber={roomNumber} />} />
                <Route path="/feedback"      element={<FeedbackPage guestId={guestId} />} />
                <Route path="/map"           element={<ResortMap />} />
                <Route path="*"              element={<Navigate to="/portal" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard"     element={<Dashboard />} />
                <Route path="*"              element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
        <FloatingChatButton />
      </div>
    </BrowserRouter>
  );
}