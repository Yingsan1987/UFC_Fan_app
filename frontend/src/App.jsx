import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Menu, X, User, LogOut, Mail, AlertCircle } from "lucide-react";
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
import LiveChat from './pages/LiveChat';
import Ranking from './pages/Ranking';
import Prediction from './pages/Prediction';
import Game from './pages/Game';
import Profile from './pages/Profile';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';

// Use localhost in development, production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ufc-fan-app-backend.onrender.com/api');


function App() {
  const [fighters, setFighters] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, resendVerificationEmail } = useAuth();

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email. Please try again later.');
    }
  };

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
    } else if (path === '/game') {
      setActiveTab('Game');
    } else if (path === '/news') {
      setActiveTab('News');
    } else if (path === '/live-chat') {
      setActiveTab('Live Chat');
    } else if (path === '/support') {
      setActiveTab('Support');
    } else if (path === '/profile') {
      setActiveTab('Profile');
    }
  }, [location.pathname]);

  const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || "https://ufc-fan-app-backend.onrender.com");


  useEffect(() => {
    axios.get(`${API_URL}/fighters`).then(res => setFighters(res.data));

    // Load chat history when connecting
    socket.on("chatHistory", (messages) => {
      setChatMessages(messages);
    });

    // Receive new chat messages
    socket.on("chatMessage", msg => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.relative')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const sendMessage = (imageData = null) => {
    if (message.trim() || imageData) {
      const userName = currentUser?.displayName || "Guest";
      socket.emit("chatMessage", { 
        user: userName, 
        text: message,
        image: imageData,
        timestamp: new Date().toISOString()
      });
      setMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = ["Home", "Fighters", "Techniques", "Events", "Forums", "Ranking", "Prediction", "Game", "News", "Live Chat", "Support"];

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
                // Navigate to the appropriate route
                const routes = {
                  "Home": "/",
                  "Fighters": "/fighters",
                  "Techniques": "/techniques",
                  "Events": "/events",
                  "Forums": "/forums",
                  "Ranking": "/ranking",
                  "Prediction": "/prediction",
                  "Game": "/game",
                  "News": "/news",
                  "Live Chat": "/live-chat",
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
        {/* Email Verification Banner */}
        {currentUser && !currentUser.emailVerified && showVerificationBanner && (
          <div className="bg-yellow-50 border-b-2 border-yellow-400 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Please verify your email address
                  </p>
                  <p className="text-xs text-yellow-700">
                    Check your inbox for a verification email or{' '}
                    <button 
                      onClick={handleResendVerification}
                      className="underline hover:text-yellow-900 font-medium"
                    >
                      resend verification email
                    </button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerificationBanner(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white shadow-md">
          <div className="flex items-center">
            <button onClick={() => setIsOpen(true)}>
              <Menu size={28} />
            </button>
            <h1 className="ml-4 text-2xl font-bold">UFC Fan App</h1>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                      {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden sm:block">
                    {currentUser.displayName || 'UFC Fan'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.displayName || 'UFC Fan'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {currentUser.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                        setActiveTab('Profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User size={16} />
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <User size={20} />
                <span>Sign In</span>
              </button>
            )}
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
            <Route path="/game" element={<Game />} />
            <Route path="/news" element={<News />} />
            <Route path="/live-chat" element={
              <LiveChat 
                chatMessages={chatMessages}
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
              />
            } />
            <Route path="/support" element={<Support />} />
            <Route path="/profile" element={<Profile />} />
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

export default App;
