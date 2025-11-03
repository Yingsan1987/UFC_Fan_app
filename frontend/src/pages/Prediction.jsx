import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trophy, Calendar, MapPin, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "https://ufc-fan-app-backend.onrender.com/api";

export default function Prediction() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/upcoming-events`);
      console.log('📅 Loaded upcoming events for predictions:', response.data);
      setUpcomingEvents(response.data);
      
      // Expand first event by default
      if (response.data.length > 0) {
        setExpandedEvents({ 0: true });
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (index) => {
    setExpandedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePrediction = (eventIndex, fightIndex, winner) => {
    const key = `${eventIndex}-${fightIndex}`;
    setPredictions(prev => ({
      ...prev,
      [key]: winner
    }));
  };

  const getPrediction = (eventIndex, fightIndex) => {
    const key = `${eventIndex}-${fightIndex}`;
    return predictions[key];
  };

  // Group fights into Main Card and Prelims
  const groupFights = (fights) => {
    if (!fights || fights.length === 0) return { mainCard: [], prelims: [] };
    
    const mainCard = [];
    const prelims = [];
    
    fights.forEach((fight, index) => {
      // First 6 fights are main card, rest are prelims
      if (index < 6) {
        mainCard.push(fight);
      } else {
        prelims.push(fight);
      }
    });
    
    return { mainCard, prelims };
  };

  const getFighterInitial = (name) => {
    if (!name) return '?';
    return name[0].toUpperCase();
  };

  const FighterCard = ({ fighter, fighterImage, onSelect, isSelected, corner }) => {
    const borderColor = corner === 'red' ? 'border-red-500' : 'border-blue-500';
    const bgColor = corner === 'red' ? 'bg-red-500' : 'bg-blue-500';
    const selectedBg = isSelected ? (corner === 'red' ? 'bg-red-100 border-red-600' : 'bg-blue-100 border-blue-600') : '';
    
    return (
      <div 
        onClick={onSelect}
        className={`cursor-pointer transition-all ${selectedBg} hover:shadow-lg`}
      >
        <div className="flex flex-col items-center">
          {/* Fighter Image */}
          {fighterImage ? (
            <img 
              src={fighterImage}
              alt={fighter}
              className={`w-20 h-20 rounded-full object-cover border-4 ${borderColor} mb-2`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-20 h-20 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-2xl border-4 ${borderColor} mb-2">
                    ${getFighterInitial(fighter)}
                  </div>`;
              }}
            />
          ) : (
            <div className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-2xl border-4 ${borderColor} mb-2`}>
              {getFighterInitial(fighter)}
            </div>
          )}
          
          {/* Fighter Name */}
          <div className="text-sm font-bold text-gray-900 text-center">{fighter}</div>
          
          {/* Selection Indicator */}
          {isSelected && (
            <div className="mt-2">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const FightCard = ({ fight, eventIndex, fightIndex }) => {
    const prediction = getPrediction(eventIndex, fightIndex);
    
    return (
      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-red-400 transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Red Corner Fighter */}
          <FighterCard 
            fighter={fight.fighter1}
            fighterImage={fight.fighter1Image}
            onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter1)}
            isSelected={prediction === fight.fighter1}
            corner="red"
          />
          
          {/* VS */}
          <div className="text-2xl font-bold text-red-600">VS</div>
          
          {/* Blue Corner Fighter */}
          <FighterCard 
            fighter={fight.fighter2}
            fighterImage={fight.fighter2Image}
            onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter2)}
            isSelected={prediction === fight.fighter2}
            corner="blue"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔮</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Upcoming Fights</h3>
          <p className="text-gray-500">Check back later for upcoming UFC events to make your predictions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fight Predictions</h1>
        <p className="text-gray-600">Make your predictions for upcoming UFC fights</p>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {upcomingEvents.map((event, eventIndex) => {
          const isExpanded = expandedEvents[eventIndex];
          const { mainCard, prelims } = groupFights(event.fights);
          const totalPredictions = event.fights?.filter((_, idx) => getPrediction(eventIndex, idx)).length || 0;
          
          return (
            <div key={eventIndex} className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
              {/* Collapsible Header */}
              <button
                onClick={() => toggleEvent(eventIndex)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900"
              >
                <div className="flex items-center gap-4 text-left flex-1">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h2 className="text-2xl font-bold">{event.eventName}</h2>
                    <div className="flex items-center gap-4 text-red-100 mt-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{event.eventDate || 'TBD'}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <div className="text-sm font-semibold text-yellow-300">
                      {totalPredictions}/{event.fights?.length || 0} Predictions
                    </div>
                    <div className="text-xs text-red-100">
                      {event.fights?.length || 0} fights
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-8 h-8 text-white" />
                  ) : (
                    <ChevronDown className="w-8 h-8 text-white" />
                  )}
                </div>
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  {/* Main Card Section */}
                  {mainCard.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-red-600">MAIN CARD</span>
                        </h3>
                        <span className="text-sm text-gray-600 font-semibold">
                          {mainCard.filter((_, idx) => getPrediction(eventIndex, idx)).length}/{mainCard.length} Predicted
                        </span>
                      </div>
                      
                      {/* Grid Layout - 2 fights per row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mainCard.map((fight, fightIndex) => (
                          <FightCard 
                            key={fightIndex}
                            fight={fight}
                            eventIndex={eventIndex}
                            fightIndex={fightIndex}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prelims Section */}
                  {prelims.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-600">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-blue-600">PRELIMS</span>
                        </h3>
                        <span className="text-sm text-gray-600 font-semibold">
                          {prelims.filter((_, idx) => getPrediction(eventIndex, idx + mainCard.length)).length}/{prelims.length} Predicted
                        </span>
                      </div>
                      
                      {/* Grid Layout - 2 fights per row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prelims.map((fight, fightIndex) => (
                          <FightCard 
                            key={fightIndex + mainCard.length}
                            fight={fight}
                            eventIndex={eventIndex}
                            fightIndex={fightIndex + mainCard.length}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Predictions Button */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-300">
                    <button
                      className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-4 rounded-lg font-bold text-lg hover:from-red-700 hover:to-red-900 transition-all shadow-lg"
                      onClick={() => {
                        const eventPredictions = event.fights?.map((fight, idx) => ({
                          fight: `${fight.fighter1} vs ${fight.fighter2}`,
                          prediction: getPrediction(eventIndex, idx) || 'No prediction'
                        }));
                        console.log(`Predictions for ${event.eventName}:`, eventPredictions);
                        alert(`Predictions saved for ${event.eventName}!\nCheck console for details.`);
                      }}
                    >
                      Submit Predictions for {event.eventName}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      💡 Click on a fighter to select your prediction
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">📋 How to Make Predictions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Click on an event header to expand the fight card</li>
          <li>2. For each fight, click on the fighter you predict will win</li>
          <li>3. Selected fighters will be highlighted with a checkmark</li>
          <li>4. Click "Submit Predictions" to save your picks</li>
          <li>5. Come back after the event to see how you did!</li>
        </ul>
      </div>

      {/* Stats Summary */}
      {upcomingEvents.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-600">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <div className="text-sm text-gray-600">Total Fights</div>
            <div className="text-3xl font-bold text-gray-900">
              {upcomingEvents.reduce((sum, event) => sum + (event.fights?.length || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
            <div className="text-sm text-gray-600">Your Predictions</div>
            <div className="text-3xl font-bold text-gray-900">
              {Object.keys(predictions).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
