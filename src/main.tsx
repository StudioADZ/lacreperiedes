import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// IMPORTANT: précharge le logo le plus tôt possible (prod / Lovable)
import logoUrl from "@/assets/logo.png";

(function preloadLogoEarly() {
  try {
    const existing = document.querySelector(
      `link[rel="preload"][as="image"][href="${logoUrl}"]`
    );
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = logoUrl;
      document.head.appendChild(link);
    }

    // warm cache + decode (critique pour background-image en prod)
    const img = new Image();
    img.src = logoUrl;
    if (typeof img.decode === "function") {
      img.decode().catch(() => {});
    }
  } catch {
    /* no-op */
  }
})();

// Garde-fous globaux silencieux (évitent les écrans blancs sur erreurs non catchées)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    // Non bloquant : on log proprement pour diagnostic
    console.warn("[unhandledrejection]", event.reason ?? "(no reason)");
  });

  window.addEventListener("error", (event) => {
    // Erreurs JS synchrones non catchées
    console.error("[global error]", event.error ?? event.message);
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
