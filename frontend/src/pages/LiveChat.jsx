import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function LiveChat({ chatMessages, message, setMessage, sendMessage }) {
  const { currentUser } = useAuth();
  const [upcomingFight, setUpcomingFight] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/upcoming-events`)
      .then(res => {
        const now = new Date();
        const upcoming = (res.data || [])
          .filter(e => new Date(e.eventDate) > now)
          .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        if (upcoming.length) setUpcomingFight(upcoming[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = e => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  const handleImageSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image too large. Max 5MB.'); return; }
    if (!file.type.startsWith('image/')) { alert('Please select an image.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null); setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (!message.trim() && !imagePreview) return;
    sendMessage(imagePreview || null);
    if (imagePreview) removeImage();
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Next event banner */}
      {upcomingFight && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-700 to-red-900 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center flex-wrap gap-3">
            <span className="flex items-center gap-1.5 bg-white/20 text-xs font-black px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-red-300 rounded-full animate-pulse" /> NEXT EVENT
            </span>
            <span className="font-black text-sm flex-1 min-w-0 truncate">{upcomingFight.eventName}</span>
            <div className="flex items-center gap-3 text-xs text-red-200">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(upcomingFight.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              {upcomingFight.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">{upcomingFight.location}</span>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat container */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-950 px-4 py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
          <h2 className="text-white font-black text-lg">Live Chat</h2>
          <span className="text-gray-400 text-sm">{chatMessages.length} messages</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-950 px-4 py-4 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-5xl mb-3">💬</div>
                <p className="font-semibold text-lg">No messages yet</p>
                <p className="text-sm mt-1">Be the first to say something!</p>
              </div>
            </div>
          ) : (
            chatMessages.map((m, i) => {
              const isOwn = currentUser && (m.user === currentUser.displayName || m.user === currentUser.email);
              const initials = (m.user || 'U')[0].toUpperCase();
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="text-gray-400 text-xs font-semibold mb-1 px-1">{m.user}</span>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2.5 shadow-md ${
                      isOwn
                        ? 'bg-gradient-to-br from-red-600 to-red-800 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
                    }`}>
                      {m.image && (
                        <img src={m.image} alt="Shared"
                          className="rounded-xl mb-2 max-h-52 object-cover w-full" />
                      )}
                      {m.text && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
                    </div>
                    {m.timestamp && (
                      <span className="text-gray-600 text-xs mt-1 px-1">{formatTime(m.timestamp)}</span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-gray-900 border-t border-gray-700 px-4 py-3 overflow-hidden">
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-24 rounded-xl border-2 border-red-500" />
                <button onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="bg-gray-900 border-t border-gray-700 px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Image */}
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="p-2.5 hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-white flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Emoji */}
            <div className="relative flex-shrink-0" ref={emojiPickerRef}>
              <button onClick={() => setShowEmojiPicker(v => !v)}
                className="p-2.5 hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-yellow-400">
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={obj => { setMessage(message + obj.emoji); setShowEmojiPicker(false); }}
                    width={Math.min(320, window.innerWidth - 32)}
                    height={Math.min(400, window.innerHeight - 200)}
                    theme="dark"
                  />
                </div>
              )}
            </div>

            {/* Text input */}
            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); if (showEmojiPicker) setShowEmojiPicker(false); }}
              onKeyDown={handleKeyDown}
              placeholder={currentUser ? 'Type a message… (Enter to send)' : 'Sign in to chat'}
              rows={1}
              disabled={!currentUser}
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none disabled:opacity-50"
            />

            {/* Send */}
            <button onClick={handleSend}
              disabled={!currentUser || (!message.trim() && !imagePreview)}
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </div>

          {!currentUser && (
            <p className="text-center text-xs text-gray-500 mt-2">Sign in to participate in the live chat</p>
          )}
        </div>
      </div>
    </div>
  );
}
