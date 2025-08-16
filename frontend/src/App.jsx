import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000/api";

function App() {
  const [fighters, setFighters] = useState([]);
  const [events, setEvents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🥊 UFC Fan App</h1>

      <h2>Fighters</h2>
      <ul>
        {fighters.map(f => (
          <li key={f._id}>
            {f.name} - {f.division} ({f.record})
          </li>
        ))}
      </ul>

      <h2>Events</h2>
      {events.length === 0 ? <p>No events yet</p> : (
        <ul>
          {events.map(e => (
            <li key={e._id}>
              {e.title} - {new Date(e.date).toLocaleDateString()} @ {e.location}
            </li>
          ))}
        </ul>
      )}

      <h2>Live Chat</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", height: "200px", overflowY: "scroll" }}>
        {chatMessages.map((m, idx) => (
          <p key={idx}><b>{m.user}:</b> {m.text}</p>
        ))}
      </div>
      <input 
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
