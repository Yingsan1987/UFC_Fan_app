import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Shield, Edit2, Save, X, Crown, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

// Default avatar options
const DEFAULT_AVATARS = [
  { id: 'avatar1', color: 'from-red-500 to-red-700', emoji: '🥊', name: 'Fighter Red' },
  { id: 'avatar2', color: 'from-blue-500 to-blue-700', emoji: '🥋', name: 'Fighter Blue' },
  { id: 'avatar3', color: 'from-yellow-500 to-yellow-700', emoji: '👑', name: 'Champion' },
  { id: 'avatar4', color: 'from-green-500 to-green-700', emoji: '⚔️', name: 'Warrior' },
  { id: 'avatar5', color: 'from-purple-500 to-purple-700', emoji: '🔥', name: 'Legend' },
  { id: 'avatar6', color: 'from-gray-700 to-gray-900', emoji: '🏆', name: 'Master' }
];

export default function Profile() {
  const { currentUser, getIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    profileImage: '',
    bio: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(response.data);
      setFormData({
        username: response.data.username || '',
        profileImage: response.data.profileImage || 'avatar1',
        bio: response.data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = await getIdToken();
      const response = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data.user);
      setSuccess('Profile updated successfully! 🎉');
      setEditMode(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile.username || '',
      profileImage: profile.profileImage || 'avatar1',
      bio: profile.bio || ''
    });
    setEditMode(false);
    setError('');
  };

  const getAvatarDisplay = (avatarId) => {
    const avatar = DEFAULT_AVATARS.find(a => a.id === avatarId) || DEFAULT_AVATARS[0];
    return (
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-6xl`}>
        {avatar.emoji}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }) : 'Unknown';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <User className="w-8 h-8" />
              My Profile
            </h1>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 flex-shrink-0">
              {getAvatarDisplay(formData.profileImage)}
            </div>

            {/* User Info */}
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold mb-1">{formData.username || profile?.displayName}</h2>
              <div className="flex items-center gap-2 text-red-100 mb-3">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{currentUser.email}</span>
              </div>
              
              {/* Subscription Badge */}
              {profile?.isPremium ? (
                <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-sm">
                  <Crown className="w-5 h-5" />
                  Premium Member
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-full font-medium text-sm">
                  <Shield className="w-5 h-5" />
                  Free Member
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form / Profile Details */}
      {editMode ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your username"
                minLength={3}
                maxLength={20}
                required
              />
              <p className="mt-1 text-xs text-gray-500">3-20 characters, displayed on leaderboards</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
              />
              <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/200 characters</p>
            </div>

            {/* Profile Image Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Avatar
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, profileImage: avatar.id })}
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                      formData.profileImage === avatar.id
                        ? 'border-red-600 ring-4 ring-red-200'
                        : 'border-gray-300 hover:border-red-400'
                    }`}
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-3xl`}>
                      {avatar.emoji}
                    </div>
                    {formData.profileImage === avatar.id && (
                      <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Display Name</p>
                <p className="text-gray-900 font-medium">{profile?.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="text-gray-900 font-medium">{profile?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="text-gray-700">{profile?.bio || 'No bio yet'}</p>
              </div>
            </div>
          </div>

          {/* Membership Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Membership Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-gray-900 font-medium">
                  {profile?.isPremium ? (
                    <span className="text-yellow-600 font-bold flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Premium
                    </span>
                  ) : (
                    <span className="text-gray-600">Free</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-900 font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {memberSince}
                </p>
              </div>
              {!profile?.isPremium && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Upgrade to Premium for unlimited game energy!</p>
                  <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-2 rounded-md hover:from-yellow-500 hover:to-yellow-700 transition-colors font-bold flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Game Stats (if available) */}
          {profile?.gameProgress && (
            <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-red-600" />
                Game Progress
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{profile.gameProgress.level || 0}</p>
                  <p className="text-sm text-gray-600">Level</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{profile.gameProgress.currentXP || 0}</p>
                  <p className="text-sm text-gray-600">Total XP</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{profile.gameProgress.trainingSessions || 0}</p>
                  <p className="text-sm text-gray-600">Training Sessions</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{profile.gameProgress.fightsWon || 0}</p>
                  <p className="text-sm text-gray-600">Fights Won</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

