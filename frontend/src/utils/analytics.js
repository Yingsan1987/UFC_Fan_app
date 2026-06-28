// Google Analytics 4 (GA4) helper — env-driven, safe no-op until configured.
//
// Setup:
//   1. Create a GA4 property at https://analytics.google.com (Admin → Create property → Web data stream).
//   2. Copy the Measurement ID (looks like "G-XXXXXXXXXX").
//   3. Set it as an env var: VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
//      - Local: add to frontend/.env
//      - Vercel: Project → Settings → Environment Variables
//   4. Redeploy. Until the ID is set, all functions below are harmless no-ops.

// Measurement ID. Defaults to the app's GA4 property; can be overridden per
// environment with VITE_GA_MEASUREMENT_ID (e.g. a separate staging property).
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-RV2N7CG2GF";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!GA_ID || !/^G-[A-Z0-9]+$/i.test(GA_ID)) {
    // No valid Measurement ID configured — stay disabled, no network calls.
    if (import.meta.env.DEV) {
      console.info("[analytics] GA4 disabled — set VITE_GA_MEASUREMENT_ID to enable.");
    }
    return;
  }

  // Inject the gtag.js loader once.
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  // We send page views manually on route change (SPA), so disable auto page_view.
  gtag("config", GA_ID, { send_page_view: false });

  initialized = true;
}

export function trackPageview(path) {
  if (!window.gtag || !GA_ID) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

// Track a custom event. Example:
//   trackEvent("prediction_made", { event_name: "UFC Baku", fight: "Fiziev vs Torres" });
//   trackEvent("coins_earned", { amount: 50, source: "prediction" });
//   trackEvent("minigame_played", { game: "striking" });
export function trackEvent(name, params = {}) {
  if (!window.gtag) return;
  window.gtag("event", name, params);
}
