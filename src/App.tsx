import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SplashScreen from "./components/SplashScreen";
import Layout from "./components/Layout";

import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import Carte from "./pages/Carte";
import Reserver from "./pages/Reserver";
import Avis from "./pages/Avis";
import Social from "./pages/Social";
import Legal from "./pages/Legal";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";
import Client from "./pages/Client";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const SPLASH_KEY = "splashShown";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Check if splash was already shown this session
  useEffect(() => {
    try {
      const splashShown = sessionStorage.getItem(SPLASH_KEY);
      if (splashShown) {
        setShowSplash(false);
      }
    } catch {
      // Si storage bloqué, on garde le splash (comportement safe)
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_KEY, "true");
    } catch {
      // ignore si storage bloqué
    }
    setShowSplash(false);
  }, []);

  const appReady = !showSplash;

  return (
    <QueryClientProvider client={queryClient}>
      {/* ⚠️ Si tu as déjà TooltipProvider ailleurs (ex: SidebarProvider), évite le double.
          Ici je le laisse car tu l’avais, mais tu peux centraliser ici et enlever l’autre. */}
      <TooltipProvider delayDuration={0}>
        {/* ⚠️ Deux systèmes de toast: garde seulement si tu utilises les deux volontairement */}
        <Toaster />
        <Sonner />

        {/* True splash gate - blocks all content until user clicks */}
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

        {/* Only render app content after splash is dismissed */}
        {appReady && (
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/carte" element={<Carte />} />
                <Route path="/reserver" element={<Reserver />} />
                <Route path="/avis" element={<Avis />} />
                <Route path="/social" element={<Social />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/verify/:code" element={<Verify />} />
                <Route path="/client" element={<Client />} />
                <Route path="/mon-compte" element={<Client />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
