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
            {fightDetails.map((fight, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Fight Type/Weight Class */}
                  {fight.WEIGHT_CLASS && (
                    <div className="text-center mb-4">
                      <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                        {fight.WEIGHT_CLASS}
                      </span>
                    </div>
                  )}
                  
                  {/* Fighters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fighter 1 */}
                    <div className="text-center">
                      <div className="mb-3">
                        <img
                          src={getFighterImage(fight.FIGHTER_1)}
                          alt={fight.FIGHTER_1}
                          className="w-20 h-20 rounded-full mx-auto border-4 border-gray-200"
                        />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {fight.FIGHTER_1 || 'TBD'}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {fight.FIGHTER_1_RECORD && (
                          <p>Record: {fight.FIGHTER_1_RECORD}</p>
                        )}
                        {fight.FIGHTER_1_AGE && (
                          <p>Age: {fight.FIGHTER_1_AGE}</p>
                        )}
                        {fight.FIGHTER_1_HEIGHT && (
                          <p>Height: {fight.FIGHTER_1_HEIGHT}</p>
                        )}
                        {fight.FIGHTER_1_WEIGHT && (
                          <p>Weight: {fight.FIGHTER_1_WEIGHT}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* VS */}
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 mb-2">VS</div>
                        {fight.ROUNDS && (
                          <p className="text-sm text-gray-600">{fight.ROUNDS}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Fighter 2 */}
                    <div className="text-center">
                      <div className="mb-3">
                        <img
                          src={getFighterImage(fight.FIGHTER_2)}
                          alt={fight.FIGHTER_2}
                          className="w-20 h-20 rounded-full mx-auto border-4 border-gray-200"
                        />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {fight.FIGHTER_2 || 'TBD'}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        {fight.FIGHTER_2_RECORD && (
                          <p>Record: {fight.FIGHTER_2_RECORD}</p>
                        )}
                        {fight.FIGHTER_2_AGE && (
                          <p>Age: {fight.FIGHTER_2_AGE}</p>
                        )}
                        {fight.FIGHTER_2_HEIGHT && (
                          <p>Height: {fight.FIGHTER_2_HEIGHT}</p>
                        )}
                        {fight.FIGHTER_2_WEIGHT && (
                          <p>Weight: {fight.FIGHTER_2_WEIGHT}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fight Result */}
                  {fight.RESULT && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                      <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                        {fight.RESULT}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
