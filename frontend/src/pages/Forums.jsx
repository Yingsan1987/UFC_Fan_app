import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, ChevronDown, ChevronUp, PlusCircle, Heart, Flame, Smile, ThumbsDown, X, Send } from 'lucide-react';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_APP_API_URL || 'https://ufc-fan-app-backend.onrender.com/api';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '👏', '💪', '🥊', '🏆', '❤️', '😎', '🤔', '😢', '😡', '🙏', '👊', '💯', '🎯'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ url, name, size = 'md' }) {
  const [ok, setOk] = useState(true);
  const initials = (name || 'A')[0].toUpperCase();
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return ok && url ? (
    <img src={url} alt={name} className={`${cls} rounded-full object-cover flex-shrink-0`} onError={() => setOk(false)} />
  ) : (
    <div className={`${cls} rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Forums() {
  const { currentUser } = useAuth();
  const [forums, setForums] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [commentsByForum, setCommentsByForum] = useState({});
  const [newCommentByForum, setNewCommentByForum] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState({});

  const getAuthHeaders = async () => {
    if (currentUser && auth) {
      try { return { Authorization: `Bearer ${await currentUser.getIdToken()}` }; } catch {}
    }
    return {};
  };

  const loadForums = async (pageNum = 1) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/forums?page=${pageNum}&limit=10`, { headers });
      const sorted = (res.data.forums || []).sort((a, b) => (b.likes || 0) - (a.likes || 0));
      setForums(sorted);
      setHasNext(res.data.pagination?.hasNextPage);
      setError(null);
    } catch { setError('Failed to load discussions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadForums(1); }, []);

  const submitForum = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setSubmitting(true);
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/forums`, { title, content }, { headers });
      setTitle(''); setContent('');
      setShowCreateForm(false);
      await loadForums(1);
    } catch { setError('Failed to create discussion'); }
    finally { setSubmitting(false); }
  };

  const likeForum = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/like`, {}, { headers });
      setForums(prev => prev.map(f => f._id === id ? res.data : f).sort((a, b) => (b.likes || 0) - (a.likes || 0)));
    } catch {}
  };

  const dislikeForum = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/dislike`, {}, { headers });
      setForums(prev => prev.map(f => f._id === id ? res.data : f).sort((a, b) => (b.likes || 0) - (a.likes || 0)));
    } catch {}
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
    if (commentsVisible[id]) setCommentsVisible(prev => ({ ...prev, [id]: false }));
    else loadComments(id);
  };

  const addComment = async (id) => {
    const text = (newCommentByForum[id] || '').trim();
    if (!text) return;
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${id}/comments`, { content: text }, { headers });
      setCommentsByForum(prev => ({ ...prev, [id]: [res.data, ...(prev[id] || [])] }));
      setNewCommentByForum(prev => ({ ...prev, [id]: '' }));
      setForums(prev => prev.map(f => f._id === id ? { ...f, commentCount: (f.commentCount || 0) + 1 } : f));
    } catch {}
  };

  const likeComment = async (forumId, commentId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${forumId}/comments/${commentId}/like`, {}, { headers });
      setCommentsByForum(prev => ({ ...prev, [forumId]: (prev[forumId] || []).map(c => c._id === commentId ? res.data : c) }));
    } catch {}
  };

  const dislikeComment = async (forumId, commentId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(`${API_URL}/forums/${forumId}/comments/${commentId}/dislike`, {}, { headers });
      setCommentsByForum(prev => ({ ...prev, [forumId]: (prev[forumId] || []).map(c => c._id === commentId ? res.data : c) }));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight">💬 Forums</h1>
                <p className="text-gray-400 mt-1 text-sm">Discuss fights, fighters, and everything UFC</p>
              </div>
              <button
                onClick={() => setShowCreateForm(v => !v)}
                className={`flex items-center gap-2 font-black px-5 py-2.5 rounded-xl transition-all ${
                  showCreateForm
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><PlusCircle className="w-4 h-4" /> New Discussion</>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <form onSubmit={submitForum} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <h2 className="font-black text-gray-900 mb-4 text-lg">Start a new discussion</h2>
                <div className="space-y-3">
                  <input
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Discussion title…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    required
                  />
                  <textarea
                    value={content} onChange={e => setContent(e.target.value)}
                    placeholder="What do you want to talk about?"
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <div className="flex gap-3 mt-4">
                  <button type="submit" disabled={submitting || !title.trim() || !content.trim()}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-2.5 rounded-xl hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50">
                    {submitting ? 'Posting…' : 'Post Discussion'}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)}
                    className="px-5 bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Forum posts */}
        {!loading && forums.map((f, index) => {
          const isHot = (f.likes || 0) >= 5 || index < 3;
          const showComments = commentsVisible[f._id];

          return (
            <motion.div
              key={f._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-shadow hover:shadow-lg ${
                isHot ? 'border-orange-300' : 'border-gray-100'
              }`}
            >
              <div className="p-5">
                {/* Hot badge */}
                {isHot && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-black mb-3">
                    <Flame className="w-3.5 h-3.5 animate-pulse" /> HOT
                  </div>
                )}

                {/* Author + meta */}
                <div className="flex items-start gap-3">
                  <Avatar url={f.authorPhotoURL} name={f.author} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{f.author || 'Anonymous'}</span>
                      <span className="text-gray-400 text-xs">{timeAgo(f.createdAt)}</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mt-0.5 leading-snug">{f.title}</h3>
                    <p className="text-gray-600 text-sm mt-1.5 whitespace-pre-line leading-relaxed">{f.content}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => likeForum(f._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      f.userLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    }`}>
                    <Heart className={`w-4 h-4 ${f.userLiked ? 'fill-current' : ''}`} />
                    {f.likes || 0}
                  </button>

                  <button onClick={() => dislikeForum(f._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      f.userDisliked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                    }`}>
                    <ThumbsDown className={`w-4 h-4 ${f.userDisliked ? 'fill-current' : ''}`} />
                    {f.dislikes || 0}
                  </button>

                  <button onClick={() => toggleComments(f._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all ml-auto">
                    <MessageCircle className="w-4 h-4" />
                    {f.commentCount || 0}
                    {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Comments */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 space-y-3">
                      {/* Comment input */}
                      <div className="flex gap-2">
                        {currentUser && <Avatar url={currentUser.photoURL} name={currentUser.displayName} size="sm" />}
                        <div className="flex-1 relative">
                          <input
                            value={newCommentByForum[f._id] || ''}
                            onChange={e => setNewCommentByForum(prev => ({ ...prev, [f._id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addComment(f._id)}
                            placeholder="Write a comment…"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-16 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5">
                            <button onClick={() => setShowEmojiPicker(prev => ({ ...prev, [f._id]: !prev[f._id] }))}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                              <Smile className="w-4 h-4 text-gray-400" />
                            </button>
                            <button onClick={() => addComment(f._id)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {showEmojiPicker[f._id] && (
                        <div className="flex flex-wrap gap-1.5 bg-white border border-gray-200 rounded-xl p-3 shadow-md">
                          {EMOJIS.map((emoji, i) => (
                            <button key={i} onClick={() => {
                              setNewCommentByForum(prev => ({ ...prev, [f._id]: (prev[f._id] || '') + emoji }));
                              setShowEmojiPicker(prev => ({ ...prev, [f._id]: false }));
                            }} className="text-xl hover:scale-125 transition-transform">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Comment list */}
                      <div className="space-y-2">
                        {(commentsByForum[f._id] || []).map(c => (
                          <div key={c._id} className="flex items-start gap-2 bg-white rounded-xl p-3 border border-gray-100">
                            <Avatar url={c.authorPhotoURL} name={c.author} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-900">{c.author || 'Anonymous'}</span>
                                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => likeComment(f._id, c._id)}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all ${c.userLiked ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-500'}`}>
                                    <Heart className={`w-3 h-3 ${c.userLiked ? 'fill-current' : ''}`} /> {c.likes || 0}
                                  </button>
                                  <button onClick={() => dislikeComment(f._id, c._id)}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all ${c.userDisliked ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}>
                                    <ThumbsDown className={`w-3 h-3 ${c.userDisliked ? 'fill-current' : ''}`} /> {c.dislikes || 0}
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty state */}
        {!loading && forums.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-lg">No discussions yet</p>
            <p className="text-sm mt-1">Be the first to start a conversation!</p>
            <button onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-red-600 text-white font-black px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors">
              Start a Discussion
            </button>
          </div>
        )}

        {/* Pagination */}
        {forums.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => { const n = Math.max(1, page - 1); setPage(n); loadForums(n); }}
              disabled={page === 1}
              className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              ← Prev
            </button>
            <span className="text-sm text-gray-600 font-medium">Page {page}</span>
            <button onClick={() => { const n = page + 1; setPage(n); loadForums(n); }}
              disabled={!hasNext}
              className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
