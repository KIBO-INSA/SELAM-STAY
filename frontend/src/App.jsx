// src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

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
  const [user, setUser] = useState(null); // null if not logged in. Else: { role: 'guest'|'manager'|'staff', isFirstTime: true/false }
  const [preferences, setPreferences] = useState({
    food: "",
    drink: "",
    activity: "",
  });

  return (
    <BrowserRouter>
      <AppContent 
        user={user}
        setUser={setUser}
        preferences={preferences}
        setPreferences={setPreferences}
      />
    </BrowserRouter>
  );
}

function AppContent({ user, setUser, preferences, setPreferences }) {
  const loc = useLocation();
  const isLoginPage = loc.pathname === '/login' || loc.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-gray-900 font-sans flex flex-col">
      {/* Show Nav only if logged in and not on login page */}
      {user && !isLoginPage && <Nav /> }

      <main className={`flex-1 flex flex-col ${user && !isLoginPage ? 'pt-16' : ''}`}>
        <Routes>
          {!user ? (
            <>
              {/* Universal Login Page */}
              <Route path="/login" element={<Login onLogin={(role) => setUser({ role, isFirstTime: true })} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              {/* MANAGER ROUTES */}
              {user.role === 'manager' && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}

              {/* STAFF/WORKER ROUTES */}
              {user.role === 'staff' && (
                <>
                  <Route path="/services" element={<ServiceRequestPage />} />
                  <Route path="*" element={<Navigate to="/services" replace />} />
                </>
              )}

              {/* GUEST ROUTES */}
              {user.role === 'guest' && (
                <>
                  {user.isFirstTime ? (
                    <>
                      {/* AI Preference Onboarding */}
                      <Route 
                        path="/preferences" 
                        element={
                          <Preference 
                            preferences={preferences} 
                            setPreferences={setPreferences} 
                            onComplete={() => setUser({ ...user, isFirstTime: false })} 
                          />
                        } 
                      />
                      <Route path="*" element={<Navigate to="/preferences" replace />} />
                    </>
                  ) : (
                    <>
                      {/* Standard Guest Portal */}
                      <Route path="/portal" element={<GuestPortal preferences={preferences} setPreferences={setPreferences} />} />
                      <Route path="/concierge" element={<SelamBot preferences={preferences} />} />
                      <Route path="/room-controls" element={<RoomControlPage />} />
                      <Route path="/services" element={<ServiceRequestPage />} />
                      <Route path="/feedback" element={<FeedbackPage />} />
                      <Route path="*" element={<Navigate to="/portal" replace />} />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}
