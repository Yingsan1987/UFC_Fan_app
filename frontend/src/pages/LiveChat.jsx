import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

const API_URL = process.env.REACT_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

export default function LiveChat({ chatMessages, message, setMessage, sendMessage }) {
  const { currentUser } = useAuth();
  const [upcomingFight, setUpcomingFight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNearestFight();
  }, []);

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
    if (imagePreview) {
      // Send message with image
      sendMessage(imagePreview);
      removeImage();
    } else {
      // Send regular text message
      sendMessage();
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Upcoming Fight Card */}
      {!loading && upcomingFight && (
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/20 rounded-full px-4 py-1">
                <span className="text-white text-sm font-bold">🔴 NEXT EVENT</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">{upcomingFight.eventName}</h2>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date(upcomingFight.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5" />
                <span>{upcomingFight.location}</span>
              </div>
            </div>

            {/* Featured Fights */}
            {upcomingFight.fights && upcomingFight.fights.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-3">Featured Fights:</h3>
                <div className="space-y-2">
                  {upcomingFight.fights.slice(0, 3).map((fight, index) => (
                    <div key={index} className="flex items-center justify-between text-white text-sm">
                      <span className="font-medium">{fight.fighter1}</span>
                      <span className="text-white/60 mx-2">vs</span>
                      <span className="font-medium">{fight.fighter2}</span>
                      {fight.weightClass && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
                          {fight.weightClass}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            💬 Live Chat
            <span className="text-sm font-normal text-gray-300">
              {chatMessages.length} messages
            </span>
          </h2>
        </div>

        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
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
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                        } shadow-sm`}
                      >
                        {/* Image if present */}
                        {m.image && (
                          <img
                            src={m.image}
                            alt="Shared"
                            className="rounded-lg mb-2 max-w-full max-h-64 object-cover"
                          />
                        )}
                        
                        {/* Text message */}
                        {m.text && (
                          <p className="text-sm whitespace-pre-wrap break-words">
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
        <div className="bg-white border-t border-gray-200 p-4">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
              title="Upload image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Emoji Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-yellow-600"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>

            {/* Message Input */}
            <textarea
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentUser ? "Type a message..." : "Sign in to chat..."}
              rows={1}
              disabled={!currentUser}
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!currentUser || (!message.trim() && !imagePreview)}
              className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
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
