export default function LiveChat({ chatMessages, message, setMessage, sendMessage }) {
  return (
    <div>
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
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-red-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
