import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, ExternalLink, CheckCircle } from 'lucide-react';

// Use localhost in development, production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ufc-fan-app-backend.onrender.com/api');

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

  const getFighterBorderColor = (outcome, isFirstFighter) => {
    if (!outcome) return 'border-gray-200';
    
    // OUTCOME format is typically "W/L" where first letter is first fighter's result
    const firstResult = outcome.charAt(0);
    
    if (isFirstFighter && firstResult === 'W') {
      return 'border-green-500'; // Winner gets green border
    } else if (!isFirstFighter && outcome.length > 2 && outcome.charAt(2) === 'W') {
      return 'border-green-500'; // Winner gets green border
    }
    
    return 'border-gray-200'; // Default gray border
  };

  const getFighterBorderWidth = (outcome, isFirstFighter) => {
    if (!outcome) return 'border-2';
    
    const firstResult = outcome.charAt(0);
    
    if (isFirstFighter && firstResult === 'W') {
      return 'border-3'; // Thicker border for winner
    } else if (!isFirstFighter && outcome.length > 2 && outcome.charAt(2) === 'W') {
      return 'border-3'; // Thicker border for winner
    }
    
    return 'border-2'; // Default border width
  };

  const isFighterWinner = (outcome, isFirstFighter) => {
    if (!outcome) return false;
    
    const firstResult = outcome.charAt(0);
    
    if (isFirstFighter && firstResult === 'W') {
      return true;
    } else if (!isFirstFighter && outcome.length > 2 && outcome.charAt(2) === 'W') {
      return true;
    }
    
    return false;
  };

  // Filter out duplicate fights (keep only unique bouts)
  const getUniqueFights = (fights) => {
    const seenBouts = new Set();
    return fights.filter(fight => {
      if (!fight.BOUT) return false;
      const boutKey = fight.BOUT.toLowerCase().trim();
      if (seenBouts.has(boutKey)) {
        return false; // Skip duplicate
      }
      seenBouts.add(boutKey);
      return true;
    });
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
          <div className="grid gap-3">
            {getUniqueFights(fightDetails).map((fight, index) => {
              // Use parsed names from backend or fallback to parsing BOUT
              const fighter1 = fight.fighter1Name || parseBout(fight.BOUT).fighter1;
              const fighter2 = fight.fighter2Name || parseBout(fight.BOUT).fighter2;
              const fighter1Image = fight.fighter1Image || null;
              const fighter2Image = fight.fighter2Image || null;
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-3">
                    {/* Fight Header */}
                    <div className="text-center mb-2">
                      <h3 className="text-xs font-bold text-gray-900 mb-1">
                        {fight.BOUT || `${fighter1} vs ${fighter2}`}
                      </h3>
                      {fight.WEIGHTCLASS && (
                        <p className="text-xs text-gray-600 mb-1">{fight.WEIGHTCLASS}</p>
                      )}
                      {fight.OUTCOME && (
                        <div className="flex justify-center space-x-2 text-xs">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {fight.OUTCOME}
                          </span>
                          {fight.METHOD && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              {fight.METHOD}
                            </span>
                          )}
                          {fight.ROUND && fight.TIME && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              R{fight.ROUND} - {fight.TIME}
                            </span>
                          )}
                        </div>
                      )}
                      {fight.URL && (
                        <a
                          href={fight.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-800 mt-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Details
                        </a>
                      )}
                    </div>
                    
                    {/* Fighters - Compact Layout */}
                    <div className="flex items-center justify-between">
                      {/* Fighter 1 */}
                      <div className="flex items-center space-x-2 flex-1">
                        {fighter1Image ? (
                          <img
                            src={fighter1Image}
                            alt={fighter1}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ${getFighterBorderWidth(fight.OUTCOME, true)} ${getFighterBorderColor(fight.OUTCOME, true)} flex-shrink-0`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm sm:text-base ${getFighterBorderWidth(fight.OUTCOME, true)} ${getFighterBorderColor(fight.OUTCOME, true)} flex-shrink-0 ${fighter1Image ? 'hidden' : ''}`}>
                          {fighter1 ? fighter1.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1">
                            <h4 className="font-bold text-xs text-gray-900 truncate">
                              {fighter1}
                            </h4>
                            {isFighterWinner(fight.OUTCOME, true) && (
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* VS */}
                      <div className="px-2 flex-shrink-0">
                        <span className="text-xs font-bold text-red-600">VS</span>
                      </div>
                      
                      {/* Fighter 2 */}
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="min-w-0 flex-1 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <h4 className="font-bold text-xs text-gray-900 truncate">
                              {fighter2}
                            </h4>
                            {isFighterWinner(fight.OUTCOME, false) && (
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        {fighter2Image ? (
                          <img
                            src={fighter2Image}
                            alt={fighter2}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ${getFighterBorderWidth(fight.OUTCOME, false)} ${getFighterBorderColor(fight.OUTCOME, false)} flex-shrink-0`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base ${getFighterBorderWidth(fight.OUTCOME, false)} ${getFighterBorderColor(fight.OUTCOME, false)} flex-shrink-0 ${fighter2Image ? 'hidden' : ''}`}>
                          {fighter2 ? fighter2.charAt(0).toUpperCase() : '?'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Fight Details */}
                    {(fight.DETAILS || fight.REFEREE || fight.TIME_FORMAT) && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600 space-y-1">
                          {fight.DETAILS && (
                            <p><span className="font-medium">Details:</span> {fight.DETAILS}</p>
                          )}
                          {fight.REFEREE && (
                            <p><span className="font-medium">Referee:</span> {fight.REFEREE}</p>
                          )}
                          {fight.TIME_FORMAT && (
                            <p><span className="font-medium">Format:</span> {fight.TIME_FORMAT}</p>
                          )}
                        </div>
                      </div>
                    )}
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
