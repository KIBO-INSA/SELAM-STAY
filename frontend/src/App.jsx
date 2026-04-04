import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar            from './components/Navbar';
import FloatingChatButton from './components/FloatingChatButton';
import SelamBot          from './components/SelamBot';
import Dashboard         from './components/Dashboard';
import FeedbackPage      from './pages/FeedbackPage';
import GuestPortal       from './pages/GuestPortal';
import RoomControlPage   from './pages/RoomControlPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import ResortMap         from './pages/ResortMap';
import LoginPage         from './pages/LoginPage';

export default function App() {
  const [mood, setMood] = useState(null);
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-100 text-gray-900 font-sans flex flex-col">
        <Navbar isManagerAuthenticated={isManagerAuthenticated} />
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
        <FloatingChatButton />
      </div>
    </BrowserRouter>
  );
}