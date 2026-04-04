import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav                from './components/Nav';
import SelamBot           from './components/SelamBot';
import Dashboard          from './components/Dashboard';
import FeedbackPage       from './pages/FeedbackPage';
import GuestPortal        from './pages/GuestPortal';
import RoomControlPage    from './pages/RoomControlPage';
import ServiceRequestPage from './pages/ServiceRequestPage';

// Login + Preference onboarding (NEW - only addition)
import Login      from './pages/Login';
import Preference from './pages/Preference';

export default function App() {
  const [mood, setMood] = useState(null);

  // --- NEW: login & preference state ---
  const [user, setUser] = useState(null); // null = not logged in
  const [preferences, setPreferences] = useState({ food: '', drink: '', activity: '' });

  // If not logged in → show Login page only
  if (!user) {
    return (
      <Login onLogin={(role) => setUser({ role, isFirstTime: true })} />
    );
  }

  // If logged in as guest for the first time → show Preference onboarding
  if (user.role === 'guest' && user.isFirstTime) {
    return (
      <Preference
        preferences={preferences}
        setPreferences={setPreferences}
        onComplete={() => setUser({ ...user, isFirstTime: false })}
      />
    );
  }

  // --- EVERYTHING BELOW IS UNCHANGED ---
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAF9] text-gray-900 font-sans flex flex-col">
        <Nav />
        <main className="pt-16 flex-1 flex flex-col">
          <Routes>
            <Route path="/portal"        element={<GuestPortal setGlobalMood={setMood} />} />
            <Route path="/"              element={<SelamBot guestId="guest-1" mood={mood} />} />
            <Route path="/room-controls" element={<RoomControlPage />} />
            <Route path="/services"      element={<ServiceRequestPage />} />
            <Route path="/feedback"      element={<FeedbackPage />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="*"              element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}