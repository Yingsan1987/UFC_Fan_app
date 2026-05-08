import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'all',        label: 'All',         emoji: '🥊' },
  { id: 'striking',   label: 'Striking',    emoji: '👊' },
  { id: 'grappling',  label: 'Grappling',   emoji: '🤼' },
  { id: 'submission', label: 'Submissions', emoji: '🔒' },
  { id: 'defense',    label: 'Defense',     emoji: '🛡️' },
];

const DIFF_COLOR = {
  'Beginner':     'bg-green-100 text-green-700',
  'Intermediate': 'bg-yellow-100 text-yellow-700',
  'Advanced':     'bg-red-100 text-red-700',
  'Expert':       'bg-purple-100 text-purple-700',
};

const EFF_COLOR = {
  'High':      'bg-blue-100 text-blue-700',
  'Very High': 'bg-indigo-100 text-indigo-700',
  'Medium':    'bg-gray-100 text-gray-600',
};

const TECHNIQUES = [
  { id:1,  category:'striking',   name:'Jab',              diff:'Beginner',     eff:'High',      emoji:'👊', desc:'Quick lead-hand straight punch to set distance and combinations.', details:'The jab is the most fundamental strike in combat sports. It creates openings, maintains distance, and checks opponent movement. Every fight starts with the jab.', sports:['Boxing','Kickboxing','MMA'] },
  { id:2,  category:'striking',   name:'Cross',            diff:'Beginner',     eff:'Very High', emoji:'💥', desc:'Powerful rear-hand straight punch rotating hips for maximum power.', details:'The cross travels in a straight line and generates tremendous knockout power when hips and shoulders rotate fully. The backbone of offensive combinations.', sports:['Boxing','Kickboxing','MMA'] },
  { id:3,  category:'striking',   name:'Hook',             diff:'Intermediate', eff:'Very High', emoji:'🪝', desc:'Circular punch targeting the side of the head or body.', details:'Hooks are devastating when they land clean. Thrown at head or body, they are especially effective at close range and can end fights instantly.', sports:['Boxing','Kickboxing','MMA'] },
  { id:4,  category:'striking',   name:'Uppercut',         diff:'Intermediate', eff:'Very High', emoji:'⬆️', desc:'Upward-arcing punch targeting the chin or solar plexus.', details:'Most effective when opponent leans forward or at close range. Uppercuts are fight-enders that bypass the guard effectively.', sports:['Boxing','Kickboxing','MMA'] },
  { id:5,  category:'striking',   name:'Roundhouse Kick',  diff:'Intermediate', eff:'High',      emoji:'🦵', desc:'Powerful circular kick to the legs, body, or head.', details:'The roundhouse kick is versatile and can be thrown at different heights. The head kick version is one of the most spectacular knockouts in MMA.', sports:['Muay Thai','Kickboxing','MMA'] },
  { id:6,  category:'striking',   name:'Front Kick',       diff:'Beginner',     eff:'High',      emoji:'🦶', desc:'Straight kick with the ball of the foot to create distance.', details:'Front kicks create space and are effective targeting the solar plexus. Made famous by Anderson Silva\'s knock-out of Vitor Belfort.', sports:['Muay Thai','Karate','MMA'] },
  { id:7,  category:'striking',   name:'Spinning Back Kick', diff:'Advanced',   eff:'Very High', emoji:'🌀', desc:'Devastating spinning kick that catches opponents off guard.', details:'The spinning back kick generates incredible power through rotational force. Extremely effective when opponent rushes in or drops their guard.', sports:['Muay Thai','Karate','MMA'] },
  { id:8,  category:'striking',   name:'Elbow Strike',     diff:'Intermediate', eff:'Very High', emoji:'⚡', desc:'Short-range devastating strike using the elbow.', details:'Elbows cause cuts and are among the most powerful short-range strikes. Legal in MMA and Muay Thai, they are especially effective in the clinch.', sports:['Muay Thai','MMA'] },
  { id:9,  category:'striking',   name:'Knee Strike',      diff:'Intermediate', eff:'High',      emoji:'💪', desc:'Powerful upward or diagonal knee thrust to the body or head.', details:'Knee strikes are crushing at close range and in the clinch. Flying knees are among the most spectacular KOs in the sport.', sports:['Muay Thai','MMA'] },
  { id:10, category:'striking',   name:'Superman Punch',   diff:'Advanced',     eff:'High',      emoji:'🦸', desc:'Long-range flying punch that generates surprise power.', details:'A deceptive technique that fakes a kick before launching a flying punch, generating power through forward momentum.', sports:['MMA','Kickboxing'] },
  { id:11, category:'grappling',  name:'Double Leg Takedown', diff:'Beginner',  eff:'Very High', emoji:'🤸', desc:'Classic wrestling takedown shooting both legs to bring opponent down.', details:'The double leg is the most common MMA takedown. It requires explosive speed, level change, and proper leg position to execute effectively.', sports:['Wrestling','MMA'] },
  { id:12, category:'grappling',  name:'Single Leg Takedown', diff:'Intermediate', eff:'High',  emoji:'🏃', desc:'Takedown isolating and lifting a single leg.', details:'More versatile than the double leg and can be executed from multiple positions. Common in wrestling and adapted extensively for MMA.', sports:['Wrestling','MMA'] },
  { id:13, category:'grappling',  name:'Hip Throw (O-Goshi)', diff:'Intermediate', eff:'High',  emoji:'🔄', desc:'Judo throw using hip rotation to flip opponent overhead.', details:'A classic judo technique that uses the thrower\'s hip as a pivot point. Generates significant impact on the floor when executed properly.', sports:['Judo','Sambo','MMA'] },
  { id:14, category:'grappling',  name:'Clinch Work',      diff:'Intermediate', eff:'High',      emoji:'🫂', desc:'Controlling opponent in close range to set up knees and throws.', details:'Clinch fighting is crucial in MMA. It allows strikes, takedowns, and submission attempts while controlling position and denying opponent\'s offense.', sports:['Muay Thai','Wrestling','MMA'] },
  { id:15, category:'grappling',  name:'Guard Position',   diff:'Beginner',     eff:'High',      emoji:'🛡️', desc:'Ground position where you control opponent from your back.', details:'The guard is fundamental in BJJ and MMA. From here you can attack with submissions, sweeps, and strikes while being on your back.', sports:['BJJ','Grappling','MMA'] },
  { id:16, category:'grappling',  name:'Mount Position',   diff:'Intermediate', eff:'Very High', emoji:'👑', desc:'Dominant ground-and-pound position sitting on opponent\'s chest.', details:'The mount is one of the most dominant positions in MMA. From here you can strike, attempt submissions, and control the fight completely.', sports:['BJJ','MMA','Grappling'] },
  { id:17, category:'submission', name:'Rear Naked Choke', diff:'Beginner',     eff:'Very High', emoji:'😴', desc:'The most common submission — a chokehold from behind.', details:'The RNC cuts blood flow to the brain causing unconsciousness in seconds. The finishing move of countless MMA fights including UFC title bouts.', sports:['BJJ','MMA','Wrestling'] },
  { id:18, category:'submission', name:'Triangle Choke',   diff:'Intermediate', eff:'Very High', emoji:'🔺', desc:'Using your legs to trap opponent\'s head and arm in a choke.', details:'A devastating submission from guard position. One of Royce Gracie\'s signature moves that showed the world the power of BJJ.', sports:['BJJ','MMA'] },
  { id:19, category:'submission', name:'Armbar',           diff:'Intermediate', eff:'Very High', emoji:'💪', desc:'Hyperextending the elbow joint using both legs across the body.', details:'The armbar can be applied from multiple positions. It\'s one of the most reliable submissions in competition — Ronda Rousey built her career on it.', sports:['BJJ','Judo','MMA'] },
  { id:20, category:'submission', name:'Guillotine Choke', diff:'Beginner',     eff:'High',      emoji:'🪤', desc:'Front headlock that chokes with the forearm pressing against the neck.', details:'The guillotine is accessible from standing and can counter takedown attempts. A fast fighter can apply it before the opponent completes a shot.', sports:['BJJ','MMA','Wrestling'] },
  { id:21, category:'submission', name:'Heel Hook',        diff:'Advanced',     eff:'Very High', emoji:'👟', desc:'Twisting the knee by applying pressure to the heel — dangerous leg lock.', details:'One of the most dangerous submissions in combat sports. Leg lockers like Gordon Ryan have brought it to the mainstream. Requires great positional control.', sports:['BJJ','Submission Wrestling','MMA'] },
  { id:22, category:'submission', name:'Kimura',           diff:'Intermediate', eff:'Very High', emoji:'🔑', desc:'Shoulder lock using a figure-four grip on the wrist.', details:'Named after Japanese judoka Masahiko Kimura. It can attack the shoulder from multiple positions and is one of the most versatile submissions.', sports:['BJJ','Judo','MMA'] },
  { id:23, category:'submission', name:'D\'Arce Choke',    diff:'Advanced',     eff:'High',      emoji:'🌀', desc:'Arm-in choke set up from half guard or turtle position.', details:'A technical choke that is difficult to see coming and hard to escape once properly set. Popular in high-level grappling competitions.', sports:['BJJ','Submission Wrestling','MMA'] },
  { id:24, category:'submission', name:'Anaconda Choke',   diff:'Advanced',     eff:'High',      emoji:'🐍', desc:'Blood choke using the arm trapped beneath the neck.', details:'Applied from a front headlock, the anaconda choke compresses the carotid arteries. Jon Jones has used it at the highest level of MMA.', sports:['BJJ','MMA'] },
  { id:25, category:'submission', name:'Omoplata',         diff:'Advanced',     eff:'High',      emoji:'🦵', desc:'Shoulder lock using the legs to twist the arm and shoulder.', details:'A creative submission from guard that can also sweep an opponent. Less common but highly effective when applied with full hip rotation.', sports:['BJJ','MMA'] },
  { id:26, category:'submission', name:'Gogoplata',        diff:'Expert',       eff:'High',      emoji:'😤', desc:'Rare choke using the shin against the throat from guard.', details:'One of the most technical submissions in BJJ. Rarely seen in MMA due to its complexity, but Nick Diaz famously landed one in the UFC.', sports:['BJJ','MMA'] },
  { id:27, category:'submission', name:'Kneebar',          diff:'Advanced',     eff:'High',      emoji:'🦴', desc:'Knee hyperextension submission similar to an armbar but for the leg.', details:'Applies force to hyperextend the knee joint. Requires good leg lock positioning and can be attacked from many positions.', sports:['BJJ','Submission Wrestling'] },
  { id:28, category:'submission', name:'Americana Lock',   diff:'Beginner',     eff:'High',      emoji:'🔒', desc:'Low shoulder lock attacking the elbow with a figure-four grip.', details:'Also called the "keylock," this is often the first submission learned in BJJ. Applied from top positions, it attacks the shoulder and elbow.', sports:['BJJ','Wrestling','MMA'] },
  { id:29, category:'submission', name:'Peruvian Necktie', diff:'Expert',       eff:'High',      emoji:'👔', desc:'Rare choke from front headlock squeezing the carotid arteries.', details:'A highly advanced choke that uses your body weight and head position to choke the opponent. Very rare in competition but visually impressive.', sports:['BJJ','MMA'] },
  { id:30, category:'defense',    name:'Sprawl',           diff:'Beginner',     eff:'Very High', emoji:'🌊', desc:'Defensive reaction to shoot-type takedowns, driving hips to the mat.', details:'The sprawl is the primary defense against leg attacks. Correct hip placement makes takedowns extremely difficult for even elite wrestlers.', sports:['Wrestling','MMA'] },
  { id:31, category:'defense',    name:'Clinch Defense',   diff:'Intermediate', eff:'High',      emoji:'🤺', desc:'Techniques to break clinch grips and escape to striking range.', details:'Clinch defense includes underhook battles, head position fights, and framing. Crucial for strikers who want to keep the fight standing.', sports:['Muay Thai','MMA','Boxing'] },
  { id:32, category:'defense',    name:'Head Movement',    diff:'Intermediate', eff:'Very High', emoji:'💨', desc:'Slipping, rolling, and bobbing to avoid punches while counter-attacking.', details:'Elite boxing head movement makes fighters nearly impossible to hit cleanly. Combined with counters, it is the mark of a truly elite striker.', sports:['Boxing','Kickboxing','MMA'] },
  { id:33, category:'defense',    name:'Guard Retention',  diff:'Advanced',     eff:'High',      emoji:'🛡️', desc:'Maintaining guard position and preventing top player from passing.', details:'Guard retention is one of the most important skills in BJJ and MMA. Uses frames, shrimping, and leg pummeling to stay in guard.', sports:['BJJ','MMA','Grappling'] },
  { id:34, category:'defense',    name:'Cage Work',        diff:'Intermediate', eff:'High',      emoji:'🏟️', desc:'Using the cage wall for leverage, escape attempts, and reversals.', details:'MMA-specific skill set for using the cage to prevent takedowns, stand back up, and create offensive opportunities.', sports:['MMA'] },
  { id:35, category:'defense',    name:'Framing',          diff:'Beginner',     eff:'High',      emoji:'🤚', desc:'Using stiff arms and body positioning to create space from opponent.', details:'Framing is fundamental in BJJ — using bone structure rather than muscle to create and maintain space against heavier opponents.', sports:['BJJ','MMA','Grappling'] },
  { id:36, category:'defense',    name:'Wall Walk',        diff:'Advanced',     eff:'High',      emoji:'🧗', desc:'Getting back to your feet using the cage when taken down.', details:'A crucial MMA skill — using the cage wall to stand back up when taken down by a wrestler. Requires timing, hip movement, and upper body strength.', sports:['MMA'] },
];

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function TechniqueCard({ t, onClick }) {
  return (
    <motion.div variants={fadeUp}
      onClick={() => onClick(t)}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-lg hover:border-red-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-3xl">{t.emoji}</div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="font-black text-gray-900 text-sm mb-1.5 group-hover:text-red-700 transition-colors">{t.name}</h3>
      <p className="text-gray-500 text-xs line-clamp-2 mb-3">{t.desc}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[t.diff] || 'bg-gray-100 text-gray-600'}`}>{t.diff}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${EFF_COLOR[t.eff] || 'bg-gray-100 text-gray-600'}`}>
          <Star className="w-2.5 h-2.5 inline mr-0.5" />{t.eff}
        </span>
      </div>
    </motion.div>
  );
}

function TechniqueModal({ t, onClose }) {
  if (!t) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl sm:rounded-t-2xl p-6 text-white relative">
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="text-4xl mb-3">{t.emoji}</div>
          <h2 className="text-2xl font-black">{t.name}</h2>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[t.diff]}`}>{t.diff}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${EFF_COLOR[t.eff]}`}>⭐ {t.eff}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Overview</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{t.desc}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Details</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{t.details}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Common In</h3>
            <div className="flex gap-2 flex-wrap">
              {t.sports.map(s => (
                <span key={s} className="bg-red-50 text-red-700 font-bold text-xs px-3 py-1 rounded-full border border-red-100">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Techniques() {
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');
  const [selected, setSelected]   = useState(null);

  const filtered = TECHNIQUES.filter(t => {
    const matchCat  = category === 'all' || t.category === category;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase()) ||
      t.sports.some(s => s.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const stats = CATEGORIES.slice(1).map(c => ({
    ...c,
    count: TECHNIQUES.filter(t => t.category === c.id).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 to-gray-900 text-white px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black mb-1">🥋 MMA Techniques</h1>
            <p className="text-gray-400 text-sm mb-6">{TECHNIQUES.length} techniques across striking, grappling, submissions & defense</p>

            {/* Search */}
            <div className="relative max-w-lg mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search techniques, sports…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:border-red-500 transition-all" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full transition-all ${
                    category === c.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}>
                  <span>{c.emoji}</span>{c.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === c.id ? 'bg-white/20' : 'bg-white/10'}`}>
                    {c.id === 'all' ? TECHNIQUES.length : TECHNIQUES.filter(t => t.category === c.id).length}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats row */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-6 overflow-x-auto no-scrollbar">
          {stats.map(s => (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0 text-sm">
              <span>{s.emoji}</span>
              <span className="text-gray-500">{s.label}:</span>
              <span className="font-black text-gray-900">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-lg">No techniques found</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }}
              className="mt-3 text-sm text-red-600 font-semibold hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-semibold mb-4">{filtered.length} techniques</p>
            <motion.div initial="hidden" animate="show" variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(t => (
                <TechniqueCard key={t.id} t={t} onClick={setSelected} />
              ))}
            </motion.div>
          </>
        )}

        {/* Educational footer */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '👊', title: 'Striking', desc: 'Punches, kicks, knees & elbows — the art of dealing damage at range' },
            { emoji: '🤼', title: 'Grappling', desc: 'Takedowns, positions & control — dictating where the fight takes place' },
            { emoji: '🔒', title: 'Submissions', desc: 'Chokes & joint locks — ending fights without a single strike' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-md p-5">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="font-black text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-gray-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Technique modal */}
      <AnimatePresence>
        {selected && <TechniqueModal t={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
