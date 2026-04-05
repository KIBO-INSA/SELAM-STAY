import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar               from './components/Navbar';
import FloatingChatButton   from './components/FloatingChatButton';
import SelamBot             from './components/SelamBot';
import Dashboard            from './components/Dashboard';
import FeedbackPage         from './pages/FeedbackPage';
import GuestPortal          from './pages/GuestPortal';
import RoomControlPage      from './pages/RoomControlPage';
import ServiceRequestPage   from './pages/ServiceRequestPage';

import Login      from './pages/Login';
import Preference from './pages/Preference';

export default function App() {
  const [mood, setMood] = useState(null);
  const [user, setUser] = useState(null);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);
  const [preferences, setPreferences] = useState({ food: '', drink: '', activity: '' });

  // If not logged in → show Login page only
  if (!user) {
    return (
      <Login onLogin={(role) => {
        setUser({ role, isFirstTime: role === 'guest' });
        if (role === 'manager') setIsManagerAuthenticated(true);
      }} />
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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0D0A06] text-gray-100 font-sans flex flex-col">
        <Navbar isManagerAuthenticated={isManagerAuthenticated} />
        <main className="pt-20 flex-1 flex flex-col">
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
        <FloatingChatButton />
      </div>
    </BrowserRouter>
  );
}