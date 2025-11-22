import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Train, ArrowRight, Zap, Target } from 'lucide-react';

const GameSelection = () => {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: 'road-to-ufc',
      name: 'Road to UFC',
      description: 'Start as a rookie fighter and work your way up through training, earning stats, and competing in real UFC events. Progress from Preliminary Card to Main Card to Champion!',
      icon: <Trophy className="w-16 h-16 text-yellow-500" />,
      color: 'from-yellow-500 to-yellow-700',
      features: [
        'Train your fighter daily',
        'Earn stats through mini-games',
        'Transfer to real UFC fighters',
        'Win based on real UFC results',
        'Progress through career levels'
      ],
      route: '/game/road-to-ufc'
    },
    {
      id: 'train-to-ufc',
      name: 'Train to UFC',
      description: 'Build your avatar and compete in a high-stakes tournament on a moving train! Each train car has 2 spots - when filled, fighters battle. Only one survives each fight. Can you be the last fighter standing?',
      icon: <Train className="w-16 h-16 text-red-500" />,
      color: 'from-red-500 to-red-700',
      features: [
        'Custom avatar builder',
        'Moving train battle system',
        '2 fighters per car combat',
        'Random elimination fights',
        'Last fighter standing wins'
      ],
      route: '/game/train-to-ufc'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          🎮 Choose Your Game Mode
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select which UFC game experience you want to play
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`relative bg-white rounded-xl shadow-lg border-4 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedGame === game.id
                ? 'border-red-600 shadow-2xl ring-4 ring-red-200'
                : 'border-gray-200 hover:border-red-400'
            }`}
          >
            <div className={`bg-gradient-to-br ${game.color} p-6 rounded-t-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {game.icon}
                  <h2 className="text-3xl font-bold text-white">{game.name}</h2>
                </div>
                {selectedGame === game.id && (
                  <div className="bg-white text-red-600 rounded-full p-2">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                {game.description}
              </p>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Key Features:
                </h3>
                <ul className="space-y-2">
                  {game.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-600"
                    >
                      <span className="text-red-500 font-bold mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGame && (
        <div className="text-center">
          <button
            onClick={() => {
              const game = games.find(g => g.id === selectedGame);
              if (game) {
                // Use state to pass selected game mode
                navigate(game.route, { 
                  state: { gameMode: selectedGame } 
                });
              }
            }}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-12 py-4 rounded-xl text-xl font-bold hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <Target className="w-6 h-6" />
            Play {games.find(g => g.id === selectedGame)?.name}
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="mt-12 text-center text-gray-500">
        <p>💡 Tip: You can switch between game modes anytime from the Game menu</p>
      </div>
    </div>
  );
};

export default GameSelection;

