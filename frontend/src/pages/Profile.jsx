import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X, Crown, CheckCircle, Swords, Target, Zap, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const DEFAULT_AVATARS = [
  { id: 'avatar1', color: 'from-red-500 to-red-700',     emoji: '🥊', name: 'Fighter Red'  },
  { id: 'avatar2', color: 'from-blue-500 to-blue-700',   emoji: '🥋', name: 'Fighter Blue' },
  { id: 'avatar3', color: 'from-yellow-500 to-yellow-700', emoji: '👑', name: 'Champion'   },
  { id: 'avatar4', color: 'from-green-500 to-green-700', emoji: '⚔️', name: 'Warrior'      },
  { id: 'avatar5', color: 'from-purple-500 to-purple-700', emoji: '🔥', name: 'Legend'     },
  { id: 'avatar6', color: 'from-gray-700 to-gray-900',   emoji: '🏆', name: 'Master'       },
];

function getAvatar(avatarId) {
  return DEFAULT_AVATARS.find(a => a.id === avatarId) || DEFAULT_AVATARS[0];
}

export default function Profile() {
  const { currentUser, getAuthToken, updateUserProfile } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile]   = useState(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [formData, setFormData] = useState({ displayName: '', username: '', profileImage: 'avatar1', bio: '' });

  useEffect(() => { if (currentUser) fetchProfile(); }, [currentUser]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
      const img = res.data.profileImage || 'avatar1';
      setFormData({ displayName: res.data.displayName || '', username: res.data.username || '', profileImage: img, bio: res.data.bio || '' });
      if (!res.data.profileImage) {
        axios.put(`${API_URL}/users/profile`, { profileImage: 'avatar1' }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
    } catch { setError('Failed to load profile'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const token = await getAuthToken();
      const res = await axios.put(`${API_URL}/users/profile`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data.user);
      if (formData.displayName !== currentUser?.displayName) {
        await updateUserProfile(formData.displayName).catch(() => {});
      }
      await fetchProfile();
      setSuccess('Profile updated! 🎉');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update');
    } finally { setSaving(false); }
  }

  function handleCancel() {
    setFormData({ displayName: profile?.displayName || '', username: profile?.username || '', profileImage: profile?.profileImage || 'avatar1', bio: profile?.bio || '' });
    setEditMode(false); setError('');
  }

  if (!currentUser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Sign In Required</h2>
        <p className="text-gray-500 text-sm">Sign in to view and edit your profile.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avatar   = getAvatar(profile?.profileImage || 'avatar1');
  const gp       = profile?.gameProgress;
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-900">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-16 text-center">
          {/* Avatar */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-24 h-24 rounded-full shadow-2xl ring-4 ring-white/20 mb-4 relative">
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-5xl`}>
              {avatar.emoji}
            </div>
            {!editMode && (
              <button onClick={() => setEditMode(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-red-600 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-2xl font-black text-white">{profile?.displayName || currentUser?.displayName || 'Fighter'}</h1>
            {profile?.username && <p className="text-red-300 text-sm mt-0.5">@{profile.username}</p>}
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile?.isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-white/10 text-gray-300'}`}>
                {profile?.isPremium ? '👑 Premium' : '🆓 Free'}
              </span>
              <span className="text-xs text-gray-400">Member since {memberSince}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-12 space-y-4">
        {/* Success/Error */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-semibold shadow">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold shadow">
              <X className="w-4 h-4 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit form */}
        {editMode ? (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Edit Profile</h2>
              <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar picker */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {DEFAULT_AVATARS.map(av => (
                    <button key={av.id} type="button" onClick={() => setFormData(f => ({ ...f, profileImage: av.id }))}
                      className={`aspect-square rounded-xl bg-gradient-to-br ${av.color} flex items-center justify-center text-xl transition-all ${
                        formData.profileImage === av.id ? 'ring-3 ring-offset-2 ring-red-500 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}>
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Display Name</label>
                <input type="text" value={formData.displayName}
                  onChange={e => setFormData(f => ({ ...f, displayName: e.target.value }))}
                  maxLength={30} minLength={2} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Username (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input type="text" value={formData.username}
                    onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                    maxLength={20} placeholder="yourhandle"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Bio <span className="text-gray-300 font-normal normal-case">({(formData.bio || '').length}/200)</span>
                </label>
                <textarea value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value.slice(0, 200) }))}
                  rows={3} placeholder="Tell the community about yourself…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" disabled={saving}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-2.5 rounded-xl hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel}
                className="px-5 bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </motion.form>
        ) : (
          <>
            {/* Info card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-gray-900">Account Info</h2>
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-sm text-red-600 font-bold hover:text-red-700">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Display Name</span>
                  <span className="font-semibold text-gray-900">{profile?.displayName || '—'}</span>
                </div>
                {profile?.username && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Username</span>
                    <span className="font-semibold text-gray-900">@{profile.username}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[200px]">{currentUser?.email}</span>
                </div>
                {profile?.bio && (
                  <div className="py-2">
                    <p className="text-gray-500 mb-1">Bio</p>
                    <p className="text-gray-800 text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Game stats */}
            {gp && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-600" /> Game Progress
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Fan Coins', value: `🥊${(gp.fanCoin ?? 0).toLocaleString()}`, color: 'text-yellow-600' },
                    { label: 'Total Wins',  value: gp.totalWins  ?? 0, color: 'text-green-600' },
                    { label: 'Total Losses', value: gp.totalLosses ?? 0, color: 'text-red-600' },
                    { label: 'Level', value: gp.fighterLevel || 'Rookie', color: 'text-purple-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Membership */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl shadow-lg border p-6 ${profile?.isPremium ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${profile?.isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
                    {profile?.isPremium ? 'Premium Member' : 'Free Membership'}
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">Member since {memberSince}</p>
                </div>
                {!profile?.isPremium && (
                  <a href="/support"
                    className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                    Upgrade
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
