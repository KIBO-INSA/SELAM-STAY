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

  return (
    <BrowserRouter>
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
