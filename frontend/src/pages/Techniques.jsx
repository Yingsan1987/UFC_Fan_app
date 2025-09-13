import { useState } from "react";
import { Search, Filter, Play, Info, Target, Shield, Zap } from "lucide-react";

export default function Techniques() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const categories = [
    { id: "all", name: "All Techniques", icon: "🥊" },
    { id: "striking", name: "Striking", icon: "👊" },
    { id: "grappling", name: "Grappling", icon: "🤼" },
    { id: "submission", name: "Submissions", icon: "🔒" },
    { id: "defense", name: "Defense", icon: "🛡️" }
  ];

  const techniques = [
    // Striking Techniques
    {
      id: 1,
      name: "Jab",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A quick, straight punch thrown with the lead hand. Used to set up combinations and maintain distance.",
      details: "The jab is the most fundamental punch in boxing and MMA. It's fast, accurate, and can be used to gauge distance, set up power shots, or keep an opponent at bay.",
      difficulty: "Beginner",
      effectiveness: "High",
      commonIn: ["Boxing", "Kickboxing", "MMA"]
    },
    {
      id: 2,
      name: "Cross",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A powerful straight punch thrown with the rear hand, rotating the hips and shoulders for maximum power.",
      details: "The cross is one of the most powerful punches in combat sports. It travels in a straight line and can generate tremendous knockout power when executed properly.",
      difficulty: "Beginner",
      effectiveness: "Very High",
      commonIn: ["Boxing", "Kickboxing", "MMA"]
    },
    {
      id: 3,
      name: "Hook",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A circular punch that comes from the side, targeting the opponent's head or body.",
      details: "Hooks are devastating when they land clean. They can be thrown to the head or body and are particularly effective in close-range combat.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["Boxing", "Kickboxing", "MMA"]
    },
    {
      id: 4,
      name: "Uppercut",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "An upward-arcing punch that targets the opponent's chin or solar plexus.",
      details: "Uppercuts are extremely powerful when they connect. They're most effective when the opponent is leaning forward or in close range.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["Boxing", "Kickboxing", "MMA"]
    },
    {
      id: 5,
      name: "Roundhouse Kick",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A powerful circular kick that can target the legs, body, or head of an opponent.",
      details: "The roundhouse kick is one of the most versatile kicks in martial arts. It can be thrown at different heights and angles, making it unpredictable and dangerous.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["Muay Thai", "Kickboxing", "MMA"]
    },
    {
      id: 6,
      name: "Front Kick",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A straight kick delivered with the ball of the foot, used to create distance or target the body.",
      details: "Front kicks are excellent for maintaining distance and can be very effective when targeting the solar plexus or pushing an opponent away.",
      difficulty: "Beginner",
      effectiveness: "Medium",
      commonIn: ["Karate", "Taekwondo", "MMA"]
    },
    {
      id: 7,
      name: "Low Kick",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A kick targeting the opponent's thigh or calf to damage their leg and reduce mobility.",
      details: "Low kicks are devastating in Muay Thai and MMA. They can quickly damage an opponent's leg, making it difficult for them to stand or move effectively.",
      difficulty: "Beginner",
      effectiveness: "Very High",
      commonIn: ["Muay Thai", "Kickboxing", "MMA"]
    },
    {
      id: 8,
      name: "High Kick",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A kick targeting the opponent's head, requiring flexibility and timing.",
      details: "High kicks are spectacular when they land and can result in instant knockouts. They require excellent flexibility and timing to execute effectively.",
      difficulty: "Advanced",
      effectiveness: "Very High",
      commonIn: ["Muay Thai", "Kickboxing", "MMA"]
    },
    {
      id: 9,
      name: "Elbow Strike",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A devastating close-range strike using the elbow, legal in MMA but not boxing.",
      details: "Elbow strikes are extremely dangerous and can cause severe cuts and knockouts. They're most effective in the clinch or when an opponent is on the ground.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["Muay Thai", "MMA"]
    },
    {
      id: 10,
      name: "Knee Strike",
      category: "striking",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A powerful strike using the knee, often delivered in the clinch or to a downed opponent.",
      details: "Knee strikes are devastating weapons in MMA. They can be thrown to the body or head and are particularly effective in the clinch position.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["Muay Thai", "MMA"]
    },

    // Grappling Techniques
    {
      id: 11,
      name: "Double Leg Takedown",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A wrestling technique where you shoot in and grab both of your opponent's legs to bring them to the ground.",
      details: "The double leg takedown is one of the most fundamental wrestling techniques. It's effective because it attacks both legs simultaneously, making it harder to defend.",
      difficulty: "Beginner",
      effectiveness: "High",
      commonIn: ["Wrestling", "BJJ", "MMA"]
    },
    {
      id: 12,
      name: "Single Leg Takedown",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A takedown where you grab one of your opponent's legs and use leverage to bring them down.",
      details: "Single leg takedowns are versatile and can be executed from various angles. They're particularly effective when you can catch your opponent off-balance.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["Wrestling", "BJJ", "MMA"]
    },
    {
      id: 13,
      name: "Hip Toss",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A throwing technique that uses your hips to flip your opponent over your body.",
      details: "Hip tosses are spectacular when executed properly. They require good timing and leverage, using your opponent's momentum against them.",
      difficulty: "Advanced",
      effectiveness: "Medium",
      commonIn: ["Judo", "Wrestling", "MMA"]
    },
    {
      id: 14,
      name: "Suplex",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A powerful throwing technique where you lift your opponent and slam them to the ground.",
      details: "Suplexes are high-impact throws that can cause significant damage. They require tremendous strength and technique to execute properly.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["Wrestling", "Judo", "MMA"]
    },
    {
      id: 15,
      name: "Slam",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A technique where you lift and forcefully bring your opponent down to the mat.",
      details: "Slams are devastating when executed properly and can result in knockouts or significant damage. They're particularly effective against opponents in the guard.",
      difficulty: "Advanced",
      effectiveness: "Very High",
      commonIn: ["Wrestling", "MMA"]
    },
    {
      id: 16,
      name: "Sweep",
      category: "grappling",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A technique used to reverse position from the bottom, putting your opponent on their back.",
      details: "Sweeps are essential for ground fighting. They allow you to escape from inferior positions and gain the top position, which is generally more advantageous.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["BJJ", "Judo", "MMA"]
    },

    // Submission Techniques
    {
      id: 17,
      name: "Rear Naked Choke",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A chokehold applied from behind the opponent, cutting off blood flow to the brain.",
      details: "The rear naked choke is one of the most effective submissions in MMA. When applied correctly, it can render an opponent unconscious in seconds.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 18,
      name: "Armbar",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A joint lock that hyperextends the opponent's elbow joint, forcing them to submit.",
      details: "Armbars are one of the most common submissions in BJJ and MMA. They can be applied from various positions and are highly effective.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["BJJ", "Judo", "MMA"]
    },
    {
      id: 19,
      name: "Triangle Choke",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A chokehold using the legs to trap the opponent's head and arm, cutting off blood flow.",
      details: "Triangle chokes are elegant and effective submissions that can be set up from the guard position. They require flexibility and timing.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 20,
      name: "Kimura",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A shoulder lock that applies pressure to the opponent's shoulder joint.",
      details: "The Kimura is a powerful shoulder lock that can be applied from various positions. It's named after Masahiko Kimura, who used it to defeat Helio Gracie.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["BJJ", "Judo", "MMA"]
    },
    {
      id: 21,
      name: "Americana",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A shoulder lock that applies pressure to the opponent's shoulder joint from the side.",
      details: "The Americana is a variation of the Kimura that applies pressure from a different angle. It's particularly effective from side control or mount position.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["BJJ", "Judo", "MMA"]
    },
    {
      id: 22,
      name: "Twister",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "An extremely painful spinal lock that twists the opponent's spine and neck.",
      details: "The Twister is one of the most painful submissions in MMA. It involves controlling the opponent's head and twisting their spine, often resulting in immediate taps.",
      difficulty: "Advanced",
      effectiveness: "Very High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 23,
      name: "Guillotine Choke",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A chokehold applied from the front, using your arms to cut off blood flow to the brain.",
      details: "The guillotine choke is one of the most common submissions in MMA. It can be applied standing or on the ground and is particularly effective against takedown attempts.",
      difficulty: "Intermediate",
      effectiveness: "Very High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 24,
      name: "D'Arce Choke",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A chokehold that traps the opponent's arm and head, cutting off blood flow.",
      details: "The D'Arce choke is a powerful submission that can be applied from various positions. It's particularly effective from side control or when transitioning between positions.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 25,
      name: "Anaconda Choke",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A chokehold similar to the D'Arce but applied from a different angle.",
      details: "The Anaconda choke is a variation of the D'Arce choke that can be applied from different positions. It's named for its constricting nature, like an anaconda snake.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 26,
      name: "Omoplata",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A shoulder lock applied using your legs to control the opponent's arm.",
      details: "The Omoplata is a creative submission that uses your legs to apply pressure to the opponent's shoulder. It can be set up from the guard and is very effective when executed properly.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 27,
      name: "Gogoplata",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "An extremely rare chokehold using your shin to apply pressure to the opponent's throat.",
      details: "The Gogoplata is one of the rarest submissions in MMA. It requires incredible flexibility and is almost never seen in competition due to its difficulty.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 28,
      name: "Calf Slicer",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A leg lock that applies pressure to the opponent's calf muscle.",
      details: "The calf slicer is a painful leg lock that can cause significant damage to the opponent's calf muscle. It's particularly effective when the opponent is in certain positions.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 29,
      name: "Heel Hook",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A dangerous leg lock that applies pressure to the opponent's heel and ankle.",
      details: "The heel hook is one of the most dangerous submissions in MMA. It can cause severe damage to the knee and ankle, making it illegal in many competitions.",
      difficulty: "Advanced",
      effectiveness: "Very High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 30,
      name: "Knee Bar",
      category: "submission",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A leg lock that hyperextends the opponent's knee joint.",
      details: "The knee bar is a powerful leg lock that can cause severe damage to the opponent's knee. It's particularly effective when applied from certain positions.",
      difficulty: "Advanced",
      effectiveness: "Very High",
      commonIn: ["BJJ", "MMA"]
    },

    // Defense Techniques
    {
      id: 31,
      name: "Sprawl",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A defensive technique used to counter takedown attempts by sprawling your legs back and down.",
      details: "The sprawl is essential for defending against takedowns. It involves dropping your hips and extending your legs to prevent your opponent from getting underneath you.",
      difficulty: "Beginner",
      effectiveness: "High",
      commonIn: ["Wrestling", "BJJ", "MMA"]
    },
    {
      id: 32,
      name: "Parry",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A defensive technique that redirects an incoming punch away from its target.",
      details: "Parrying is a fundamental defensive skill that involves using your hands to deflect incoming strikes. It's more energy-efficient than blocking.",
      difficulty: "Beginner",
      effectiveness: "Medium",
      commonIn: ["Boxing", "Kickboxing", "MMA"]
    },
    {
      id: 33,
      name: "Clinch",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A close-range fighting position where you control your opponent's upper body.",
      details: "The clinch is a crucial position in MMA that allows you to control your opponent, land short strikes, or set up takedowns. It's particularly important in Muay Thai.",
      difficulty: "Intermediate",
      effectiveness: "High",
      commonIn: ["Muay Thai", "Wrestling", "MMA"]
    },
    {
      id: 34,
      name: "Guard",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A defensive position on the ground where you use your legs to control your opponent.",
      details: "The guard is a fundamental defensive position in ground fighting. It allows you to control your opponent's posture and set up submissions or sweeps.",
      difficulty: "Beginner",
      effectiveness: "High",
      commonIn: ["BJJ", "MMA"]
    },
    {
      id: 35,
      name: "Turtle",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A defensive position where you're on your hands and knees, protecting your head and body.",
      details: "The turtle position is used to defend against takedowns and ground attacks. It's a temporary defensive position that allows you to recover and escape.",
      difficulty: "Beginner",
      effectiveness: "Medium",
      commonIn: ["Wrestling", "BJJ", "MMA"]
    },
    {
      id: 36,
      name: "Granby Roll",
      category: "defense",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop",
      description: "A defensive technique that uses a rolling motion to escape from inferior positions.",
      details: "The Granby roll is a creative escape technique that can be used to reverse position or escape from various ground positions. It requires good timing and technique.",
      difficulty: "Advanced",
      effectiveness: "High",
      commonIn: ["Wrestling", "BJJ", "MMA"]
    }
  ];

  const filteredTechniques = techniques.filter(technique => {
    const matchesSearch = technique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         technique.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || technique.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner": return "text-green-600 bg-green-100";
      case "Intermediate": return "text-yellow-600 bg-yellow-100";
      case "Advanced": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getEffectivenessColor = (effectiveness) => {
    switch (effectiveness) {
      case "Very High": return "text-red-600 bg-red-100";
      case "High": return "text-orange-600 bg-orange-100";
      case "Medium": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">MMA Techniques</h1>
        <p className="text-gray-600">Master the fundamentals of mixed martial arts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search techniques..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-gray-700 font-medium">{filteredTechniques.length} techniques</span>
        </div>
      </div>

      {/* Techniques Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechniques.map(technique => (
          <div 
            key={technique.id} 
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => setSelectedTechnique(technique)}
          >
            <div className="relative">
              <img
                src={technique.image}
                alt={technique.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(technique.difficulty)}`}>
                  {technique.difficulty}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffectivenessColor(technique.effectiveness)}`}>
                  {technique.effectiveness}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">{technique.name}</h3>
                <span className="text-sm text-gray-500 capitalize">{technique.category}</span>
              </div>
              
              <p className="text-gray-600 mb-4">{technique.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {technique.commonIn.map(sport => (
                  <span key={sport} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {sport}
                  </span>
                ))}
              </div>

              <button className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Technique Detail Modal */}
      {selectedTechnique && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedTechnique.image}
                alt={selectedTechnique.name}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <button
                onClick={() => setSelectedTechnique(null)}
                className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{selectedTechnique.name}</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedTechnique.difficulty)}`}>
                    {selectedTechnique.difficulty}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEffectivenessColor(selectedTechnique.effectiveness)}`}>
                    {selectedTechnique.effectiveness}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 mb-4">{selectedTechnique.description}</p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Explanation</h3>
                <p className="text-gray-600 mb-4">{selectedTechnique.details}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Common in Sports</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTechnique.commonIn.map(sport => (
                    <span key={sport} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" />
                  Watch Tutorial
                </button>
                <button 
                  onClick={() => setSelectedTechnique(null)}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Section */}
      <div className="mt-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">New to MMA? Start Here!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Target className="h-6 w-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Striking Basics</h3>
              <p className="text-red-100">Learn the fundamental punches, kicks, and combinations used in MMA.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Grappling Fundamentals</h3>
              <p className="text-red-100">Master takedowns, clinch work, and ground control techniques.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Submission Holds</h3>
              <p className="text-red-100">Understand chokes, joint locks, and how to finish fights on the ground.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
