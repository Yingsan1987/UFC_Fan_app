import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Train, ArrowRight, Zap, Target, Star, Play, Check } from 'lucide-react';

const GAMES = [
  {
    id: 'road-to-ufc',
    name: 'Road to UFC',
    emoji: '🏆',
    tagline: 'Climb from rookie to champion',
    description: 'Train your fighter, earn stats through mini-games, and compete using real UFC event results. Progress from Prelims to Main Card to Champion!',
    color: 'from-yellow-500 to-amber-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    features: ['Train daily', 'Earn stats', 'Real UFC results', 'Career progression'],
    route: '/game/road-to-ufc',
  },
  {
    id: 'train-to-ufc',
    name: 'Train to UFC',
    emoji: '🚂',
    tagline: 'Last fighter standing wins',
    description: 'Build your avatar and battle on a moving train! Each car holds 2 fighters — when full, they fight. Survive all cars to be champion.',
    color: 'from-red-500 to-red-800',
    bg: 'bg-red-50',
    border: 'border-red-400',
    badge: 'bg-red-100 text-red-800',
    features: ['Custom avatar', 'Train battle system', '2v2 per car', 'Last one standing'],
    route: '/game/train-to-ufc',
  },
  {
    id: 'poker',
    name: 'UFC Poker',
    emoji: '🃏',
    tagline: 'Bet Fan Coins, beat the AI',
    description: 'Texas Hold\'em against 3 AI fighters — McFighter, Nurmabot & Jonesy. Win their chips to earn Fan Coins. Your balance syncs to your account.',
    color: 'from-green-700 to-green-900',
    bg: 'bg-green-50',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-800',
    features: ['Full Texas Hold\'em', 'Fan Coin betting', '3 AI opponents', 'Balance syncs'],
    route: '/game/poker',
  },
  {
    id: 'fantasy',
    name: 'UFC Fantasy',
    emoji: '⭐',
    tagline: 'Pick real fighters, earn real coins',
    description: 'Draft fighters from upcoming UFC events. KO wins score higher than decisions. Score big, earn Fan Coins, and climb the leaderboard.',
    color: 'from-purple-600 to-purple-900',
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-800',
    features: ['Real event cards', 'KO = more points', 'Perfect card bonus', 'Fan Coin rewards'],
    route: '/game/fantasy',
  },
  {
    id: 'slots',
    name: 'UFC Slots',
    emoji: '🎰',
    tagline: 'Spin the fighter reels — jackpot awaits!',
    description: 'A 5×4 slot machine packed with UFC fighters. Exchange Fan Coins for slot coins and spin for big wins — Line Jackpots, Scatter Hits, Rivalry Bonuses, Diagonal Strikes, and a Grand Jackpot worth 1000× your bet!',
    color: 'from-pink-600 to-red-900',
    bg: 'bg-pink-50',
    border: 'border-pink-400',
    badge: 'bg-pink-100 text-pink-800',
    features: ['14 win types', 'Bonus free spins', 'Wild fighters', 'Grand Jackpot 1000×'],
    route: '/game/slots',
  },
];

export default function GameSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const selectedGame = GAMES.find(g => g.id === selected);

  const handlePlay = (game) => {
    navigate(game.route, { state: { gameMode: game.id } });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 sm:pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white px-4 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-3">🎮</div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Choose Your Game</h1>
            <p className="text-gray-400 mt-2 text-sm">Pick a game mode and start playing</p>
          </motion.div>
        </div>
      </div>

      {/* Game cards */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game, i) => {
            const isSelected = selected === game.id;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(game.id)}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `${game.border} shadow-xl ring-4 ring-offset-1 ring-opacity-30 ${game.border.replace('border-', 'ring-')}`
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-br ${game.color} px-4 py-4 flex items-center gap-3`}>
                  <span className="text-4xl">{game.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-black text-lg leading-tight">{game.name}</h2>
                    <p className="text-white/75 text-xs mt-0.5">{game.tagline}</p>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{game.description}</p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {game.features.map(f => (
                      <span key={f} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${game.badge}`}>
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Play button — always visible, more prominent when selected */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={e => { e.stopPropagation(); handlePlay(game); }}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${game.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Play className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                    {isSelected ? `Play ${game.name} Now` : 'Play Now'}
                    {isSelected && <ArrowRight className="w-4 h-4" />}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop tip */}
        <p className="text-center text-xs text-gray-400 mt-6 hidden sm:block">
          💡 Tap any card to select, then hit Play Now — or tap Play directly to jump straight in
        </p>
      </div>

      {/* Sticky mobile CTA — appears when a game is selected */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white border-t border-gray-100 px-4 py-3 shadow-2xl"
          >
            <button
              onClick={() => handlePlay(selectedGame)}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base bg-gradient-to-r ${selectedGame.color} text-white shadow-lg`}
            >
              <span className="text-xl">{selectedGame.emoji}</span>
              Play {selectedGame.name}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
