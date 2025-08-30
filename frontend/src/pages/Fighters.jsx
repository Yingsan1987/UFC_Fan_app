import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Fighters() {
  const [fighters, setFighters] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/fighters`).then(res => setFighters(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Fighters</h2>
      <ul>
        {fighters.map(f => (
          <li key={f._id}>
            {f.name} - {f.division} ({f.record})
          </li>
        ))}
      </ul>
    </div>
  );
}
