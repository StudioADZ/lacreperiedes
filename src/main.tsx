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

// Garde-fou global silencieux (évite les écrans blancs sur erreurs async non catchées)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    // On n'interrompt pas l'app, on log seulement pour diagnostic
    console.warn("[unhandledrejection]", e.reason);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
