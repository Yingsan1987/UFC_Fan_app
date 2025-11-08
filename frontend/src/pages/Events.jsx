import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Calendar, MapPin, Users, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_URL = "https://ufc-fan-app-backend.onrender.com/api";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [fighterImages, setFighterImages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch past events
        const eventsResponse = await axios.get(`${API_URL}/events`);
        const sortedEvents = eventsResponse.data.sort((a, b) => {
          const dateA = new Date(a.DATE);
          const dateB = new Date(b.DATE);
          return dateB - dateA;
        });
        setEvents(sortedEvents);
        setFilteredEvents(sortedEvents);
        
        // Fetch upcoming events from ufc_upcoming_events collection
        // This endpoint already combines with fighter images
        try {
          const upcomingResponse = await axios.get(`${API_URL}/upcoming-events`);
          console.log('📅 Upcoming events loaded:', upcomingResponse.data);
          setUpcomingEvents(upcomingResponse.data);
          
          // Expand first event by default
          if (upcomingResponse.data.length > 0) {
            setExpandedEvents({ 0: true });
          }
          
          // Extract fighter images from the response
          const imageMap = {};
          upcomingResponse.data.forEach(event => {
            event.fights?.forEach(fight => {
              if (fight.fighter1 && fight.fighter1Image) {
                imageMap[fight.fighter1.toLowerCase()] = fight.fighter1Image;
              }
              if (fight.fighter2 && fight.fighter2Image) {
                imageMap[fight.fighter2.toLowerCase()] = fight.fighter2Image;
              }
            });
          });
          setFighterImages(imageMap);
        } catch (err) {
          console.log('No upcoming events found:', err);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter events based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.EVENT.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.LOCATION.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.DATE.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchTerm, events]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleEvent = (index) => {
    setExpandedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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

  // Get fighter image URL by name
  const getFighterImage = (fighterName) => {
    if (!fighterName) return null;
    const imagePath = fighterImages[fighterName.toLowerCase()];
    return imagePath || null;
  };

  // Get all fights from an event (from ufc_upcoming_events structure)
  const getAllFights = (event) => {
    if (!event.fights || !Array.isArray(event.fights)) return [];
    
    // Add card labels - first fight is main event, rest are supporting
    return event.fights.map((fight, index) => ({
      ...fight,
      cardType: index === 0 ? 'mainEvent' : index === 1 ? 'coMainEvent' : 'mainCard',
      cardLabel: index === 0 ? 'Main Event' : index === 1 ? 'Co-Main Event' : 'Main Card'
    }));
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
        <p className="text-gray-600 mb-6">Upcoming fights and latest UFC events</p>
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search events, locations, or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Search Results Count */}
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            {filteredEvents.length === 0 ? (
              <span>No events found matching "{searchTerm}"</span>
            ) : (
              <span>
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                {filteredEvents.length !== events.length && ` out of ${events.length} total`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Events Section - PROMINENT */}
      {upcomingEvents.length > 0 && (
        <div className="mb-16">
          {/* Section Header - Big and Bold */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-t-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-10 h-10 text-yellow-400" />
                  <h2 className="text-4xl font-bold">UPCOMING FIGHTS</h2>
                </div>
                <p className="text-red-100 text-lg">Don't miss these exciting matchups!</p>
              </div>
              <div className="bg-yellow-400 text-red-900 px-6 py-3 rounded-full font-bold text-2xl shadow-lg">
                {upcomingEvents.length}
              </div>
            </div>
          </div>
          
          {/* Events Container with Dark Background */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-b-2xl p-8 shadow-2xl">
            <div className="space-y-8">
              {upcomingEvents.map((event, eventIdx) => {
              const fights = getAllFights(event);
              const mainFight = fights[0]; // First fight is main event
              const isExpanded = expandedEvents[eventIdx];
              
              return (
                <div key={eventIdx} className="bg-white rounded-lg md:rounded-2xl shadow-2xl border-2 md:border-4 border-yellow-400 overflow-hidden">
                  {/* Collapsible Event Header - UFC Style */}
                  <button
                    onClick={() => toggleEvent(eventIdx)}
                    className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 p-4 md:p-8 text-black relative hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 transition-all"
                  >
                    <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="hidden md:block absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="bg-black text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm">
                            UFC
                          </div>
                          <div className="bg-red-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm">
                            FIGHT NIGHT
                          </div>
                        </div>
                        <h3 className="text-lg md:text-3xl font-black mb-2 md:mb-3 text-gray-900 drop-shadow-lg truncate">{event.eventName}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-6 text-gray-900 font-semibold text-xs md:text-base">
                          <div className="flex items-center gap-1 md:gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-lg">
                            <Calendar className="w-3 h-3 md:w-5 md:h-5" />
                            <span className="text-xs md:text-lg">{event.eventDate || 'TBD'}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 md:gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-lg">
                              <MapPin className="w-3 h-3 md:w-5 md:h-5" />
                              <span className="text-xs md:text-lg truncate max-w-[120px] md:max-w-none">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 md:gap-2 bg-black/20 px-2 py-1 md:px-3 md:py-1 rounded-lg">
                            <Users className="w-3 h-3 md:w-5 md:h-5" />
                            <span className="text-xs md:text-lg">{fights.length} Fights</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expand/Collapse Icon */}
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 md:w-12 md:h-12 text-gray-900" />
                        ) : (
                          <ChevronDown className="w-6 h-6 md:w-12 md:h-12 text-gray-900" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Fight Card */}
                  {isExpanded && (
                    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 md:border-t-4 border-yellow-600">
                    {mainFight && (
                      <div className="mb-6 md:mb-8">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-2 px-3 md:py-3 md:px-6 rounded-lg inline-flex items-center gap-1 md:gap-2">
                            <Trophy className="w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
                            <h4 className="text-sm md:text-xl font-bold uppercase">{mainFight.cardLabel}</h4>
                          </div>
                          {mainFight.weightClass && (
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-3 md:py-3 md:px-6 rounded-lg font-bold text-xs md:text-lg uppercase">
                              {mainFight.weightClass}
                            </div>
                          )}
                        </div>
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-xl border-2 md:border-4 border-red-500">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
                            {/* Fighter 1 */}
                            <div className="flex flex-col items-center gap-2 md:gap-3 flex-1">
                              {mainFight.fighter1Image ? (
                                <img 
                                  src={mainFight.fighter1Image}
                                  alt={mainFight.fighter1}
                                  className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover border-4 md:border-6 border-red-600 shadow-2xl"
                                  onError={(e) => {
                                    e.target.src = `https://via.placeholder.com/128/ef4444/ffffff?text=${mainFight.fighter1?.[0] || '?'}`;
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-3xl md:text-5xl border-4 md:border-6 border-red-600 shadow-2xl">
                                  {mainFight.fighter1?.[0] || '?'}
                                </div>
                              )}
                              <div className="text-center">
                                <p className="font-black text-base md:text-2xl text-gray-900 uppercase break-words max-w-[150px] md:max-w-none">{mainFight.fighter1}</p>
                                <p className="text-xs md:text-sm text-red-600 font-bold mt-1">RED CORNER</p>
                              </div>
                            </div>

                            {/* VS */}
                            <div className="px-2 md:px-8 flex-shrink-0">
                              <div className="bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-2xl md:text-5xl px-3 py-2 md:px-6 md:py-4 rounded-xl shadow-xl transform rotate-3">
                                VS
                              </div>
                            </div>

                            {/* Fighter 2 */}
                            <div className="flex flex-col items-center gap-2 md:gap-3 flex-1">
                              {mainFight.fighter2Image ? (
                                <img 
                                  src={mainFight.fighter2Image}
                                  alt={mainFight.fighter2}
                                  className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover border-4 md:border-6 border-blue-600 shadow-2xl"
                                  onError={(e) => {
                                    e.target.src = `https://via.placeholder.com/128/3b82f6/ffffff?text=${mainFight.fighter2?.[0] || '?'}`;
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-3xl md:text-5xl border-4 md:border-6 border-blue-600 shadow-2xl">
                                  {mainFight.fighter2?.[0] || '?'}
                                </div>
                              )}
                              <div className="text-center">
                                <p className="font-black text-base md:text-2xl text-gray-900 uppercase break-words max-w-[150px] md:max-w-none">{mainFight.fighter2}</p>
                                <p className="text-xs md:text-sm text-blue-600 font-bold mt-1">BLUE CORNER</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Fights - Grid Layout */}
                    {fights.length > 1 && (
                      <div className="mt-6 md:mt-8">
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2 px-4 md:py-3 md:px-6 rounded-lg mb-4 inline-flex items-center gap-2 flex-wrap">
                          <Users className="w-4 h-4 md:w-6 md:h-6" />
                          <h4 className="text-sm md:text-xl font-bold uppercase">Full Fight Card</h4>
                          <span className="ml-2 bg-white/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm">{fights.length} Fights</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                          {fights.slice(1).map((fight, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-lg md:rounded-xl p-3 md:p-5 border-2 border-gray-300 hover:border-red-500 hover:shadow-xl transition-all">
                              <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                                <div className="text-xs font-bold text-red-600 uppercase tracking-wider truncate">{fight.cardLabel}</div>
                                {fight.weightClass && (
                                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase flex-shrink-0">
                                    {fight.weightClass}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-center gap-2 md:gap-3">
                                {/* Fighter 1 */}
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  {fight.fighter1Image ? (
                                    <img 
                                      src={fight.fighter1Image}
                                      alt={fight.fighter1}
                                      className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 md:border-3 border-red-500 mb-1 md:mb-2 shadow-lg flex-shrink-0"
                                      onError={(e) => {
                                        e.target.src = `https://via.placeholder.com/64/ef4444/ffffff?text=${fight.fighter1?.[0] || '?'}`;
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-base md:text-xl font-bold border-2 md:border-3 border-red-600 mb-1 md:mb-2 shadow-lg flex-shrink-0">
                                      {fight.fighter1?.[0] || '?'}
                                    </div>
                                  )}
                                  <span className="font-bold text-xs md:text-sm text-gray-900 text-center leading-tight break-words max-w-full px-1">{fight.fighter1}</span>
                                </div>
                                
                                {/* VS */}
                                <div className="font-black text-red-600 text-base md:text-xl flex-shrink-0">VS</div>
                                
                                {/* Fighter 2 */}
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                  {fight.fighter2Image ? (
                                    <img 
                                      src={fight.fighter2Image}
                                      alt={fight.fighter2}
                                      className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 md:border-3 border-blue-500 mb-1 md:mb-2 shadow-lg flex-shrink-0"
                                      onError={(e) => {
                                        e.target.src = `https://via.placeholder.com/64/3b82f6/ffffff?text=${fight.fighter2?.[0] || '?'}`;
                                      }}
                                    />
                                  ) : (
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-base md:text-xl font-bold border-2 md:border-3 border-blue-600 mb-1 md:mb-2 shadow-lg flex-shrink-0">
                                      {fight.fighter2?.[0] || '?'}
                                    </div>
                                  )}
                                  <span className="font-bold text-xs md:text-sm text-gray-900 text-center leading-tight break-words max-w-full px-1">{fight.fighter2}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Big Visual Divider - Past Events Section */}
      <div className="my-16 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-4 border-gray-400"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-white px-8 py-4 rounded-full border-4 border-gray-400 shadow-xl">
            <span className="text-xl font-black text-gray-700 uppercase tracking-wider">Past Events</span>
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🥊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No Events Found' : 'No Events Available'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? `Try a different search term` : 'Check back later for upcoming UFC events!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.map((event) => (
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
              {searchTerm ? `Showing ${filteredEvents.length} of ${events.length} events` : `Total Events: ${events.length}`}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchTerm ? `Filtered by "${searchTerm}"` : 'Showing all available UFC events sorted by date (latest first)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;