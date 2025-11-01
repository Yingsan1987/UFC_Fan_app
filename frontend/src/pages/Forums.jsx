import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = "https://ufc-fan-app-backend.onrender.com/api";

const Forums = () => {
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

  const loadForums = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/forums?page=${pageNum}&limit=10`);
      setForums(res.data.forums);
      setHasNext(res.data.pagination?.hasNextPage);
      setError(null);
    } catch (e) {
      setError('Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadForums(1); }, []);

  const submitForum = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/forums`, { title, content, author });
      setTitle(''); setContent(''); setAuthor('');
      await loadForums(1);
    } catch (e) {
      setError('Failed to create forum');
    } finally {
      setLoading(false);
    }
  };

  const likeForum = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/forums/${id}/like`);
      setForums(prev => prev.map(f => f._id === id ? res.data : f));
    } catch {}
  };

  const loadComments = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/forums/${id}/comments`);
      setCommentsByForum(prev => ({ ...prev, [id]: res.data }));
    } catch {}
  };

  const addComment = async (id) => {
    const text = (newCommentByForum[id] || '').trim();
    if (!text) return;
    try {
      const res = await axios.post(`${API_URL}/forums/${id}/comments`, { content: text, author: author || 'Anonymous' });
      setCommentsByForum(prev => ({ ...prev, [id]: [res.data, ...(prev[id] || [])] }));
      setNewCommentByForum(prev => ({ ...prev, [id]: '' }));
    } catch {}
  };

  const likeComment = async (forumId, commentId) => {
    try {
      const res = await axios.post(`${API_URL}/forums/${forumId}/comments/${commentId}/like`);
      setCommentsByForum(prev => ({
        ...prev,
        [forumId]: (prev[forumId] || []).map(c => c._id === commentId ? res.data : c)
      }));
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Forums</h1>

      <form onSubmit={submitForum} className="bg-white rounded-lg shadow p-4 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Create a new forum</h2>
        <div className="mb-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-3">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What do you want to discuss?" rows={4} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Your name (optional)" className="w-full border rounded px-3 py-2" />
        </div>
        <button disabled={loading} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          {loading ? 'Posting...' : 'Post Forum'}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>

      <div className="space-y-4">
        {forums.map(f => (
          <div key={f._id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-gray-700 mt-1 whitespace-pre-line">{f.content}</p>
                <p className="text-xs text-gray-500 mt-2">By {f.author || 'Anonymous'} • {new Date(f.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => likeForum(f._id)} className="ml-3 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">
                ❤️ {f.likes || 0}
              </button>
            </div>

            {/* Comments */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Comments</h4>
                <button onClick={() => loadComments(f._id)} className="text-sm text-blue-600 hover:underline">Load comments</button>
              </div>

              <div className="mt-2 space-y-3">
                {(commentsByForum[f._id] || []).map(c => (
                  <div key={c._id} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-800 whitespace-pre-line">{c.content}</p>
                      <button onClick={() => likeComment(f._id, c._id)} className="ml-3 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">❤️ {c.likes || 0}</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">By {c.author || 'Anonymous'} • {new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={newCommentByForum[f._id] || ''}
                  onChange={(e) => setNewCommentByForum(prev => ({ ...prev, [f._id]: e.target.value }))}
                  placeholder="Write a comment..."
                  className="flex-1 border rounded px-3 py-2"
                />
                <button onClick={() => addComment(f._id)} className="bg-gray-800 text-white px-3 py-2 rounded">Comment</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 text-center">
        <button
          onClick={() => { const next = Math.max(1, page - 1); setPage(next); loadForums(next); }}
          className="px-4 py-2 border rounded mr-2"
          disabled={page === 1}
        >Prev</button>
        <button
          onClick={() => { const next = page + 1; setPage(next); loadForums(next); }}
          className="px-4 py-2 border rounded"
          disabled={!hasNext}
        >Next</button>
      </div>
    </div>
  );
};

export default Forums;




