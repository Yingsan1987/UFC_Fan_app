import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Menu, X } from "lucide-react";

const API_URL = "http://localhost:5000/api";

function App() {
  const [fighters, setFighters] = useState([]);
  const [events, setEvents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  const socket = io("http://localhost:5000");

  useEffect(() => {
    axios.get(`${API_URL}/fighters`).then(res => setFighters(res.data));
    axios.get(`${API_URL}/events`).then(res => setEvents(res.data));

    socket.on("chatMessage", msg => {
      setChatMessages(prev => [msg, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { user: "Guest", text: message });
      setMessage("");
    }
  };

  const menuItems = ["Fighters", "Events", "Ranking", "Prediction", "News", "Live Chat"];

  return (
    <div className="flex font-sans">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 p-4 transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-4 right-4"
          onClick={() => setIsOpen(false)}
        >
          <X size={28} />
        </button>
        <h2 className="text-xl font-bold mb-6">🥊 UFC Fan App</h2>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li
              key={item}
              className={`cursor-pointer hover:text-red-400 ${
                activeTab === item ? "text-red-400 font-bold" : ""
              }`}
              onClick={() => {
                setActiveTab(item);
                setIsOpen(false);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-gray-100">
        {/* Top Bar */}
        <div className="flex items-center p-4 bg-white shadow-md">
          <button onClick={() => setIsOpen(true)}>
            <Menu size={28} />
          </button>
          <h1 className="ml-4 text-2xl font-bold">UFC Fan App</h1>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {activeTab === "Fighters" && (
            <>
              <h2 className="text-xl font-semibold mb-2">Fighters</h2>
              <ul>
                {fighters.map((f) => (
                  <li key={f._id}>
                    {f.name} - {f.division} ({f.record})
                  </li>
                ))}
              </ul>
            </>
          )}

          {activeTab === "Events" && (
            <>
              <h2 className="text-xl font-semibold mb-2">Events</h2>
              {events.length === 0 ? (
                <p>No events yet</p>
              ) : (
                <ul>
                  {events.map((e) => (
                    <li key={e._id}>
                      {e.title} -{" "}
                      {new Date(e.date).toLocaleDateString()} @ {e.location}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === "Live Chat" && (
            <>
              <h2 className="text-xl font-semibold mb-2">Live Chat</h2>
              <div className="border border-gray-300 p-2 h-64 overflow-y-scroll mb-2 bg-white">
                {chatMessages.map((m, idx) => (
                  <p key={idx}>
                    <b>{m.user}:</b> {m.text}
                  </p>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  className="flex-1 border p-2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-red-500 text-white px-4 rounded"
                >
                  Send
                </button>
              </div>
            </>
          )}

          {activeTab === "Ranking" && (
            <p className="text-gray-600">🏆 Ranking page coming soon...</p>
          )}

          {activeTab === "Prediction" && (
            <p className="text-gray-600">🔮 Prediction page coming soon...</p>
          )}

          {activeTab === "News" && (
            <p className="text-gray-600">📰 News page coming soon...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

