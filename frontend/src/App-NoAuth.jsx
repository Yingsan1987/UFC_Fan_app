import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Menu, X } from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import React from 'react';
import Fighters from './pages/Fighters';
import Forums from './pages/Forums';
import Techniques from './pages/Techniques';
import News from './pages/News';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Support from './pages/Support';
import Home from './pages/Home';
import Ranking from './pages/Ranking';
import Prediction from './pages/Prediction';

const API_URL = import.meta.env.VITE_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

function AppNoAuth() {
  const [fighters, setFighters] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();

  // Update activeTab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setActiveTab('Home');
    } else if (path === '/fighters') {
      setActiveTab('Fighters');
    } else if (path === '/techniques') {
      setActiveTab('Techniques');
    } else if (path === '/events' || path.startsWith('/event-details')) {
      setActiveTab('Events');
    } else if (path === '/forums') {
      setActiveTab('Forums');
    } else if (path === '/ranking') {
      setActiveTab('Ranking');
    } else if (path === '/prediction') {
      setActiveTab('Prediction');
    } else if (path === '/news') {
      setActiveTab('News');
    } else if (path === '/support') {
      setActiveTab('Support');
    }
  }, [location.pathname]);

  const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || "https://ufc-fan-app-backend.onrender.com");

  useEffect(() => {
    axios.get(`${API_URL}/fighters`).then(res => setFighters(res.data));

    socket.on("chatMessage", msg => {
      setChatMessages(prev => [msg, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { user: "Guest", text: message });
      setMessage("");
    }
  };

  const menuItems = ["Home", "Fighters", "Techniques", "Events", "Forums", "Ranking", "Prediction", "News", "Support"];

  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-6 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">🥊 UFC Fan App</h2>
          <button onClick={() => setIsOpen(false)}>
            <X size={28} />
          </button>
        </div>
        <ul className="space-y-4">
          {menuItems.map(item => (
            <li
              key={item}
              className={`cursor-pointer p-2 rounded hover:bg-red-700 ${
                activeTab === item ? "bg-red-600 font-bold" : ""
              }`}
              onClick={() => {
                setActiveTab(item);
                setIsOpen(false);
                const routes = {
                  "Home": "/",
                  "Fighters": "/fighters",
                  "Techniques": "/techniques",
                  "Events": "/events",
                  "Forums": "/forums",
                  "Ranking": "/ranking",
                  "Prediction": "/prediction",
                  "News": "/news",
                  "Support": "/support"
                };
                navigate(routes[item] || "/");
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white shadow-md">
          <div className="flex items-center">
            <button onClick={() => setIsOpen(true)}>
              <Menu size={28} />
            </button>
            <h1 className="ml-4 text-2xl font-bold">UFC Fan App (No Auth)</h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 overflow-auto flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fighters" element={<Fighters />} />
            <Route path="/techniques" element={<Techniques />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event-details/:eventName" element={<EventDetails />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/news" element={<News />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AppNoAuth;






