// src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Preference from "./pages/Preference";
import GuestPortal from "./pages/GuestPortal";
import SelamBot from "./components/SelamBot";
import RoomControlPage from "./pages/RoomControlPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import FeedbackPage from "./pages/FeedbackPage";
import Dashboard from "./components/Dashboard";

// Components
import Nav from "./components/Nav";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [preferences, setPreferences] = useState({
    food: "",
    drink: "",
    activity: "",
  });
  const [isManagerAuthenticated, setIsManagerAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <AppContent 
        mood={mood} 
        setMood={setMood} 
        isManagerAuthenticated={isManagerAuthenticated} 
        setIsManagerAuthenticated={setIsManagerAuthenticated} 
      />
    </BrowserRouter>
  );
}

function AppContent({ mood, setMood, isManagerAuthenticated, setIsManagerAuthenticated }) {
  const loc = useLocation();
  const isLoginPage = loc.pathname === '/login';

  return (
    <div className="min-h-screen bg-stone-100 text-gray-900 font-sans flex flex-col">
      <Nav isManagerAuthenticated={isManagerAuthenticated} />
      <main className={`flex-1 flex flex-col ${!isLoginPage ? 'pt-20' : ''}`}>
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
      <div className="min-h-screen bg-[#FAFAF9] text-gray-900 font-sans flex flex-col">
        {loggedIn && <Nav />}

        <main className="flex-1 pt-16">
          <Routes>
            {!loggedIn ? (
              <Route
                path="/*"
                element={<Login onLogin={() => setLoggedIn(true)} />}
              />
            ) : (
              <>
                <Route
                  path="/preferences"
                  element={
                    <Preference
                      preferences={preferences}
                      setPreferences={setPreferences}
                    />
                  }
                />
                <Route
                  path="/portal"
                  element={
                    <GuestPortal
                      preferences={preferences}
                      setPreferences={setPreferences}
                    />
                  }
                />
                <Route path="/" element={<SelamBot preferences={preferences} />} />
                <Route path="/room-controls" element={<RoomControlPage />} />
                <Route path="/services" element={<ServiceRequestPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
