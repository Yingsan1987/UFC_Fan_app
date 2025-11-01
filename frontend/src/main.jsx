import React from "react"; 
import ReactDOM from "react-dom/client"; 
import App from "./App"; 
import { BrowserRouter } from "react-router-dom"; 
import { AuthProvider } from "./context/AuthContext";
import "./index.css"; 

// Log to console to verify main.jsx is loading
console.log('🚀 main.jsx is loading...');

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

console.log('✅ React app should be rendered');