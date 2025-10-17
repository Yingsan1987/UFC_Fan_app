import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, ExternalLink } from 'lucide-react';

const API_URL = "https://ufc-fan-app-backend.onrender.com/api";

const EventDetails = () => {
  const { eventName } = useParams();
  const navigate = useNavigate();
  const [fightDetails, setFightDetails] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch fight details for this event
        const response = await axios.get(`${API_URL}/fight-details/${encodeURIComponent(eventName)}`);
        
        if (response.data && response.data.length > 0) {
          setFightDetails(response.data);
          // Extract event info from the first fight record
          setEventInfo({
            EVENT: response.data[0].EVENT || eventName,
            DATE: response.data[0].DATE,
            LOCATION: response.data[0].LOCATION,
            URL: response.data[0].URL
          });
        } else {
          setError('No fight details found for this event');
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load fight details');
        console.error('Error fetching fight details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (eventName) {
      fetchEventDetails();
    }
  }, [eventName]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getFighterImage = (fighterName) => {
    // Placeholder for fighter images - you can replace this with actual image URLs
    return `https://via.placeholder.com/80x80/ef4444/ffffff?text=${fighterName ? fighterName.charAt(0) : '?'}`;
  };

  const parseBout = (boutString) => {
    if (!boutString) return { fighter1: 'TBD', fighter2: 'TBD' };
    
    // Split by " vs " or " vs. " (case insensitive)
    const parts = boutString.split(/\s+vs\.?\s+/i);
    if (parts.length === 2) {
      return { fighter1: parts[0].trim(), fighter2: parts[1].trim() };
    }
    
    // If no "vs" found, return as single fighter
    return { fighter1: boutString, fighter2: 'TBD' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Event Details</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </button>
        
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{eventInfo?.EVENT || eventName}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {eventInfo?.DATE && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(eventInfo.DATE)}</span>
              </div>
            )}
            {eventInfo?.LOCATION && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{eventInfo.LOCATION}</span>
              </div>
            )}
            {eventInfo?.URL && (
              <a
                href={eventInfo.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-white hover:text-gray-200"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                UFC Stats
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Fight Cards */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Fight Card</h2>
        
        {fightDetails.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-4xl mb-2">🥊</div>
            <p className="text-gray-600">No fight details available for this event</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {fightDetails.map((fight, index) => {
              const { fighter1, fighter2 } = parseBout(fight.BOUT);
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Fight Header */}
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {fight.BOUT || 'TBD vs TBD'}
                      </h3>
                      {fight.URL && (
                        <a
                          href={fight.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Fight Details
                        </a>
                      )}
                    </div>
                    
                    {/* Fighters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Fighter 1 */}
                      <div className="text-center">
                        <div className="mb-3">
                          <img
                            src={getFighterImage(fighter1)}
                            alt={fighter1}
                            className="w-16 h-16 rounded-full mx-auto border-4 border-gray-200"
                          />
                        </div>
                        <h4 className="font-bold text-base text-gray-900 mb-1">
                          {fighter1}
                        </h4>
                        <p className="text-xs text-gray-500">Fighter</p>
                      </div>
                      
                      {/* VS */}
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600 mb-1">VS</div>
                          <p className="text-xs text-gray-500">Bout</p>
                        </div>
                      </div>
                      
                      {/* Fighter 2 */}
                      <div className="text-center">
                        <div className="mb-3">
                          <img
                            src={getFighterImage(fighter2)}
                            alt={fighter2}
                            className="w-16 h-16 rounded-full mx-auto border-4 border-gray-200"
                          />
                        </div>
                        <h4 className="font-bold text-base text-gray-900 mb-1">
                          {fighter2}
                        </h4>
                        <p className="text-xs text-gray-500">Fighter</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Fight details sourced from UFC Fight Details database</p>
      </div>
    </div>
  );
};

export default EventDetails;
