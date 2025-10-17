import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "https://ufc-fan-app-backend.onrender.com/api";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/events`);
        
        // Sort events by date (latest first) - parse the DATE string and sort
        const sortedEvents = response.data.sort((a, b) => {
          const dateA = new Date(a.DATE);
          const dateB = new Date(b.DATE);
          return dateB - dateA; // Latest first
        });
        
        setEvents(sortedEvents);
        setError(null);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
      return dateString; // Return original string if parsing fails
    }
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
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UFC Events</h1>
        <p className="text-gray-600">Latest UFC events and fight cards</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🥊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Available</h3>
          <p className="text-gray-500">Check back later for upcoming UFC events!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
            >
              {/* Compact Event Header */}
              <div className="h-24 bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-2xl mb-1">🥊</div>
                  <p className="text-xs font-semibold">UFC Event</p>
                </div>
              </div>

              {/* Compact Event Content */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                  {event.EVENT}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium truncate">{formatDate(event.DATE)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium truncate">{event.LOCATION}</span>
                  </div>
                </div>

                {/* Fighter Placeholders */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">?</span>
                      </div>
                      <span className="text-xs text-gray-600">Fighter 1</span>
                    </div>
                    <span className="text-xs font-bold text-red-600">VS</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Fighter 2</span>
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">?</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/event-details/${encodeURIComponent(event.EVENT)}`)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    View Details
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {events.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Total Events: {events.length}
            </h3>
            <p className="text-gray-600 text-sm">
              Showing all available UFC events sorted by date (latest first)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;