import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import logoUrl from "@/assets/logo.png";

function preloadLogoEarly() {
  try {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[rel="preload"][as="image"][href="${logoUrl}"]`,
    );

    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = logoUrl;
      document.head.appendChild(link);
    }

    const img = new Image();
    img.src = logoUrl;
    void img.decode?.().catch(() => {
      // Non-critical: preload is only a performance hint.
    });
  } catch {
    // Non-critical: the app must still boot if preload fails.
  }
}

function registerGlobalDiagnostics() {
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("[unhandledrejection]", event.reason ?? "(no reason)");
  });

  window.addEventListener("error", (event) => {
    console.error("[global error]", event.error ?? event.message);
  });
}

preloadLogoEarly();
registerGlobalDiagnostics();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
