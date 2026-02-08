import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// IMPORTANT: précharge le logo le plus tôt possible (prod / Lovable)
import logoUrl from "@/assets/logo.png";

(function preloadLogoEarly() {
  try {
    // hint navigateur
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

    // decode si dispo (Chrome / Android OK)
    if (typeof img.decode === 'function') {
      img.decode().catch(() => {});
    }
  } catch {
    // no-op
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
