import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Menu, X, User, LogOut, AlertCircle, Home as HomeIcon, Swords, BookOpen, Calendar, MessageSquare, Trophy, Target, Gamepad2, Newspaper, MessageCircle, Heart, UserCircle } from "lucide-react";
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
import GameSelection from './pages/GameSelection';
import RoadToUFC from './pages/RoadToUFC';
import TrainToUFC from './pages/TrainToUFC';
import PokerGame from './pages/PokerGame';
import FantasyGame from './pages/FantasyGame';
import UFCSlots from './pages/UFCSlots';
import Profile from './pages/Profile';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { TrainGameProvider } from './store/trainGameStore';

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

  // Socket.io connection - use localhost in development
  const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 
    (window.location.hostname === 'localhost' 
      ? 'http://localhost:5000' 
      : 'https://ufc-fan-app-backend.onrender.com');
  const socket = io(socketUrl);


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

  const menuItems = [
    { label: "Home", icon: HomeIcon, route: "/" },
    { label: "Fighters", icon: Swords, route: "/fighters" },
    { label: "Techniques", icon: BookOpen, route: "/techniques" },
    { label: "Events", icon: Calendar, route: "/events" },
    { label: "Forums", icon: MessageSquare, route: "/forums" },
    { label: "Ranking", icon: Trophy, route: "/ranking" },
    { label: "Prediction", icon: Target, route: "/prediction" },
    { label: "Game", icon: Gamepad2, route: "/game" },
    { label: "News", icon: Newspaper, route: "/news" },
    { label: "Live Chat", icon: MessageCircle, route: "/live-chat" },
    { label: "Support", icon: Heart, route: "/support" },
  ];

  return (
    <TrainGameProvider>
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-950 text-white z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥊</span>
            <h2 className="text-lg font-black tracking-tight">UFC Fan App</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map(({ label, icon: Icon, route }) => (
              <li key={label}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeTab === label
                      ? "bg-red-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => {
                    setActiveTab(label);
                    setIsOpen(false);
                    navigate(route);
                  }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          {currentUser ? (
            <button onClick={() => { navigate('/profile'); setIsOpen(false); setActiveTab('Profile'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all">
              {currentUser.photoURL
                ? <img src={currentUser.photoURL} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs font-black">{currentUser.displayName?.[0]?.toUpperCase() || 'U'}</div>
              }
              <span className="truncate">{currentUser.displayName || 'My Profile'}</span>
            </button>
          ) : (
            <button onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
              <UserCircle size={18} /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
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

        {/* Top Bar — flex-shrink-0 ensures it never scrolls away */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-950 text-white shadow-lg flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥊</span>
              <h1 className="text-lg font-black tracking-tight hidden sm:block">UFC Fan App</h1>
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-red-500" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-sm">
                      {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:block text-gray-200">
                    {currentUser.displayName || 'UFC Fan'}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-black text-gray-900 truncate">{currentUser.displayName || 'UFC Fan'}</p>
                      <p className="text-xs text-gray-500">{currentUser.emailVerified ? '✓ Verified' : '⚠ Unverified'}</p>
                    </div>
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false); setActiveTab('Profile'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <User size={15} className="text-gray-400" /> My Profile
                    </button>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm">
                <User size={16} /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Page Content — no padding, pages manage their own layout */}
        <div className="overflow-auto flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fighters" element={<Fighters />} />
            <Route path="/techniques" element={<Techniques />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event-details/:eventName" element={<EventDetails />} />
            <Route path="/forums" element={<Forums />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/game" element={<GameSelection />} />
            <Route path="/game/road-to-ufc" element={<RoadToUFC />} />
            <Route path="/game/road-to-ufc/play" element={<Game />} />
            <Route path="/game/train-to-ufc" element={<TrainToUFC />} />
            <Route path="/game/poker" element={<PokerGame />} />
            <Route path="/game/fantasy" element={<FantasyGame />} />
            <Route path="/game/slots" element={<UFCSlots />} />
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
              <div className="flex items-center justify-center min-h-full bg-gray-50 px-4 py-20">
                <div className="text-center">
                  <div className="text-6xl mb-4">🥊</div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h2>
                  <p className="text-gray-500 mb-6 text-sm">The page you're looking for doesn't exist.</p>
                  <button onClick={() => navigate('/')}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors">
                    Go Home
                  </button>
                </div>
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
    </TrainGameProvider>
  );
}

export default App;
