import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

// Use localhost in development, production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ufc-fan-app-backend.onrender.com/api');

export default function LiveChat({ chatMessages, message, setMessage, sendMessage }) {
  const { currentUser } = useAuth();
  const [upcomingFight, setUpcomingFight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    fetchNearestFight();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchNearestFight = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/upcoming-events`);
      
      // Find the nearest upcoming fight
      if (response.data && response.data.length > 0) {
        const now = new Date();
        const upcomingEvents = response.data
          .filter(event => new Date(event.eventDate) > now)
          .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        
        if (upcomingEvents.length > 0) {
          setUpcomingFight(upcomingEvents[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching nearest fight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(message + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    // Hide emoji picker when user starts typing
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Maximum size is 5MB.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if (message.trim() || imagePreview) {
      // Call the parent sendMessage function with image data
      if (imagePreview) {
        sendMessage(imagePreview);
      } else {
        sendMessage(null);
      }
      // Clear image preview after sending
      if (imagePreview) {
        removeImage();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Upcoming Fight Card - Simplified */}
      {!loading && upcomingFight && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-md overflow-hidden">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="bg-white/20 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex-shrink-0">
                  <span className="text-white text-xs font-bold">🔴 NEXT EVENT</span>
                </div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white truncate min-w-0">{upcomingFight.eventName}</h2>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 text-white text-xs sm:text-sm w-full sm:w-auto">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {new Date(upcomingFight.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{upcomingFight.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
            💬 Live Chat
            <span className="text-xs sm:text-sm font-normal text-gray-300">
              {chatMessages.length} messages
            </span>
          </h2>
        </div>

        {/* Messages Area */}
        <div className="h-[400px] sm:h-[500px] md:h-[600px] overflow-y-auto p-3 sm:p-4 bg-gray-50">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Be the first to start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((m, idx) => {
                const isOwnMessage = currentUser && (m.user === currentUser.displayName || m.user === currentUser.email);
                
                return (
                  <div
                    key={idx}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* User name and time */}
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {!isOwnMessage && (
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                            {m.user?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className={`text-xs font-medium ${isOwnMessage ? 'text-blue-600' : 'text-gray-600'}`}>
                          {isOwnMessage ? 'You' : m.user}
                        </span>
                        {m.timestamp && (
                          <span className="text-xs text-gray-400">
                            {formatTime(m.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {/* Message bubble */}
                      <div
                        className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                        } shadow-sm max-w-full`}
                      >
                        {/* Image if present */}
                        {m.image && (
                          <img
                            src={m.image}
                            alt="Shared"
                            className="rounded-lg mb-2 max-w-full max-h-48 sm:max-h-64 object-cover"
                          />
                        )}
                        
                        {/* Text message */}
                        {m.text && (
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                            {m.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-gray-100 border-t border-gray-200 p-4">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg border-2 border-blue-500"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
          <div className="flex items-end gap-2">
            {/* Image Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600 touch-manipulation"
              title="Upload image"
              aria-label="Upload image"
            >
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Emoji Picker Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-yellow-600 touch-manipulation"
                title="Add emoji"
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 sm:bottom-14 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={Math.min(320, window.innerWidth - 32)}
                    height={Math.min(400, window.innerHeight - 200)}
                  />
                </div>
              )}
            </div>

            {/* Message Input */}
            <textarea
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px]"
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder={currentUser ? "Type a message..." : "Sign in to chat..."}
              rows={1}
              disabled={!currentUser}
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!currentUser || (!message.trim() && !imagePreview)}
              className="bg-red-600 text-white p-2.5 sm:p-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {!currentUser && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please sign in to participate in the chat
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
