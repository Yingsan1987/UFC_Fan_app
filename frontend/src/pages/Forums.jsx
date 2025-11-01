import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, ChevronDown, ChevronUp, PlusCircle, Heart, Flame, Smile, ThumbsDown } from 'lucide-react';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

// Popular emojis for quick selection
const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '👏', '💪', '🥊', '🏆', '❤️', '😎', '🤔', '😢', '😡', '🙏', '👊', '💯', '🎯'];

const Forums = () => {
  const { currentUser } = useAuth();
  const [forums, setForums] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [commentsByForum, setCommentsByForum] = useState({});
  const [newCommentByForum, setNewCommentByForum] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState({});
  const [activeCommentInput, setActiveCommentInput] = useState(null);

  const loadForums = async (pageNum = 1) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/forums?page=${pageNum}&limit=10`, { headers });
      // Sort forums by likes (most liked first)
      const sortedForums = (res.data.forums || []).sort((a, b) => (b.likes || 0) - (a.likes || 0));
      setForums(sortedForums);
      setHasNext(res.data.pagination?.hasNextPage);
      setError(null);
    } catch (e) {
      setError('Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadForums(1); }, []);

  // Get auth headers for API calls
  const getAuthHeaders = async () => {
    if (currentUser && auth) {
      try {
        const token = await currentUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      } catch (err) {
        console.error('Error getting auth token:', err);
      }
    }
    return {};
  };

  const submitForum = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/forums`, { title, content, author }, { headers });
      setTitle(''); setContent(''); setAuthor('');
      setShowCreateForm(false);
      await loadForums(1);
    } catch (e) {
      setError('Failed to create forum');
    } finally {
      setLoading(false);
    }
  };

  const likeForum = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/like`, {}, { headers });
      // Update forum and re-sort by likes
      setForums(prev => {
        const updated = prev.map(f => f._id === id ? res.data : f);
        return updated.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      });
    } catch {}
  };

  const dislikeForum = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/dislike`, {}, { headers });
      // Update forum and re-sort by likes
      setForums(prev => {
        const updated = prev.map(f => f._id === id ? res.data : f);
        return updated.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      });
    } catch {}
  };

  // Add emoji to comment
  const addEmoji = (forumId, emoji) => {
    setNewCommentByForum(prev => ({
      ...prev,
      [forumId]: (prev[forumId] || '') + emoji
    }));
    setShowEmojiPicker(prev => ({ ...prev, [forumId]: false }));
  };

  // Toggle emoji picker
  const toggleEmojiPicker = (forumId) => {
    setShowEmojiPicker(prev => ({ ...prev, [forumId]: !prev[forumId] }));
  };

  const loadComments = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/forums/${id}/comments`, { headers });
      setCommentsByForum(prev => ({ ...prev, [id]: res.data }));
      setCommentsVisible(prev => ({ ...prev, [id]: true }));
    } catch {}
  };

  const toggleComments = (id) => {
    if (commentsVisible[id]) {
      setCommentsVisible(prev => ({ ...prev, [id]: false }));
    } else {
      loadComments(id);
    }
  };

  const addComment = async (id) => {
    const text = (newCommentByForum[id] || '').trim();
    if (!text) return;
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/comments`, { content: text, author: author || 'Anonymous' }, { headers });
      setCommentsByForum(prev => ({ ...prev, [id]: [res.data, ...(prev[id] || [])] }));
      setNewCommentByForum(prev => ({ ...prev, [id]: '' }));
      // Update comment count in forum
      setForums(prev => prev.map(f => f._id === id ? { ...f, commentCount: (f.commentCount || 0) + 1 } : f));
    } catch {}
  };

  const likeComment = async (forumId, commentId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${forumId}/comments/${commentId}/like`, {}, { headers });
      setCommentsByForum(prev => ({
        ...prev,
        [forumId]: (prev[forumId] || []).map(c => c._id === commentId ? res.data : c)
      }));
    } catch {}
  };

  const dislikeComment = async (forumId, commentId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${forumId}/comments/${commentId}/dislike`, {}, { headers });
      setCommentsByForum(prev => ({
        ...prev,
        [forumId]: (prev[forumId] || []).map(c => c._id === commentId ? res.data : c)
      }));
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Forums</h1>

      {/* Collapsible Create Forum Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
        >
          <PlusCircle size={20} />
          {showCreateForm ? 'Cancel' : 'Create New Discussion'}
        </button>

        {/* Collapsible Form */}
        {showCreateForm && (
          <form onSubmit={submitForum} className="bg-white rounded-lg shadow-lg p-6 mt-4 border border-gray-200 animate-slideDown">
            <h2 className="text-xl font-semibold mb-4">Create a new discussion</h2>
            <div className="mb-4">
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Discussion Title" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
              />
            </div>
            <div className="mb-4">
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="What do you want to discuss?" 
                rows={4} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
              />
            </div>
            {!currentUser && (
              <div className="mb-4">
                <input 
                  value={author} 
                  onChange={e => setAuthor(e.target.value)} 
                  placeholder="Your name (optional)" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                />
              </div>
            )}
            <button 
              disabled={loading} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Discussion'}
            </button>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </form>
        )}
      </div>

      <div className="space-y-4">
        {forums.map((f, index) => {
          const isHotPost = (f.likes || 0) >= 5 || index < 3; // Top 3 posts or 5+ likes
          return (
          <div key={f._id} className={`bg-white rounded-lg shadow-md p-6 border-2 hover:shadow-lg transition-all ${
            isHotPost ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-white' : 'border-gray-200'
          }`}>
            {/* Hot Post Badge */}
            {isHotPost && (
              <div className="flex items-center gap-1.5 mb-3 text-orange-600">
                <Flame size={20} className="animate-pulse" />
                <span className="text-sm font-bold">Hot Discussion</span>
              </div>
            )}
            
            {/* Forum Header with User Info */}
            <div className="flex items-start gap-3 mb-4">
              {/* User Avatar */}
              {f.authorPhotoURL ? (
                <img 
                  src={f.authorPhotoURL} 
                  alt={f.author} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  {(f.author || 'A')[0].toUpperCase()}
                </div>
              )}
              
              {/* Forum Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{f.author || 'Anonymous'}</span>
                  <span className="text-xs text-gray-500">• {new Date(f.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{f.content}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => likeForum(f._id)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    f.userLiked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Heart size={18} className={f.userLiked ? 'fill-current' : ''} />
                  <span className="font-medium">{f.likes || 0}</span>
                </button>

                <button 
                  onClick={() => dislikeForum(f._id)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    f.userDisliked 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ThumbsDown size={18} className={f.userDisliked ? 'fill-current' : ''} />
                  <span className="font-medium">{f.dislikes || 0}</span>
                </button>
              </div>

              <button 
                onClick={() => toggleComments(f._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-gray-700"
              >
                <MessageCircle size={18} />
                <span className="font-medium">{f.commentCount || 0}</span>
                {commentsVisible[f._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Collapsible Comments Section */}
            {commentsVisible[f._id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {/* Add Comment Input */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    {currentUser?.photoURL && (
                      <img 
                        src={currentUser.photoURL} 
                        alt="You" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 relative">
                      <input
                        value={newCommentByForum[f._id] || ''}
                        onChange={(e) => setNewCommentByForum(prev => ({ ...prev, [f._id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => toggleEmojiPicker(f._id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="Add emoji"
                      >
                        <Smile size={20} className="text-gray-500" />
                      </button>
                    </div>
                    <button 
                      onClick={() => addComment(f._id)} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Post
                    </button>
                  </div>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker[f._id] && (
                    <div className="mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => addEmoji(f._id, emoji)}
                            className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {(commentsByForum[f._id] || []).map(c => (
                    <div key={c._id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start gap-2">
                        {/* Comment Avatar */}
                        {c.authorPhotoURL ? (
                          <img 
                            src={c.authorPhotoURL} 
                            alt={c.author} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
                            {(c.author || 'A')[0].toUpperCase()}
                          </div>
                        )}
                        
                        {/* Comment Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-900">{c.author || 'Anonymous'}</span>
                              <span className="text-xs text-gray-500">• {new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => likeComment(f._id, c._id)} 
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-all text-xs ${
                                  c.userLiked 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-white hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <Heart size={14} className={c.userLiked ? 'fill-current' : ''} />
                                <span>{c.likes || 0}</span>
                              </button>
                              <button 
                                onClick={() => dislikeComment(f._id, c._id)} 
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-all text-xs ${
                                  c.userDisliked 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'bg-white hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <ThumbsDown size={14} className={c.userDisliked ? 'fill-current' : ''} />
                                <span>{c.dislikes || 0}</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{c.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => { const next = Math.max(1, page - 1); setPage(next); loadForums(next); }}
          className="px-6 py-2 bg-white border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700">
          Page {page}
        </span>
        <button
          onClick={() => { const next = page + 1; setPage(next); loadForums(next); }}
          className="px-6 py-2 bg-white border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Forums;




