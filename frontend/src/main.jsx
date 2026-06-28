import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { initAnalytics, trackPageview } from "./utils/analytics";
import "./index.css";
import "./styles/trainAnimations.css";

// Log to console to verify main.jsx is loading
console.log('🚀 main.jsx is loading...');

// Initialize GA4 (safe no-op until VITE_GA_MEASUREMENT_ID is configured).
initAnalytics();

// Sends a GA4 page_view on every SPA route change.
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <RouteTracker />
      <App />
    </AuthProvider>
  </BrowserRouter>
);

console.log('✅ React app should be rendered');