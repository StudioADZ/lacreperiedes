import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import Layout from "./components/Layout";
import Index from "./pages/Index";

// Lazy-load des routes secondaires existantes → home plus rapide, bundle initial allégé
const Quiz = lazy(() => import("./pages/Quiz"));
const Carte = lazy(() => import("./pages/Carte"));
const Reserver = lazy(() => import("./pages/Reserver"));
const Avis = lazy(() => import("./pages/Avis"));
const Social = lazy(() => import("./pages/Social"));
const Legal = lazy(() => import("./pages/Legal"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Verify = lazy(() => import("./pages/Verify"));
const Client = lazy(() => import("./pages/Client"));
const NotFound = lazy(() => import("./pages/NotFound"));

// QueryClient professionnalisé : cache raisonnable, pas de refetch agressif
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) setShowSplash(false);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* APP TOUJOURS RENDUE → le hero existe derrière la porte */}
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<Layout />}>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/carte" element={<Carte />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/avis" element={<Avis />} />
                <Route path="/social" element={<Social />} />
                <Route path="/about" element={<About />} />
                <Route path="/legal" element={<Legal />} />

                {/* Parcours métier */}
                <Route path="/reserver" element={<Reserver />} />
                <Route path="/verify/:code" element={<Verify />} />

                {/* Espace client */}
                <Route path="/client" element={<Client />} />
                <Route path="/mon-compte" element={<Client />} />

                {/* Admin */}
                <Route path="/admin" element={<Admin />} />
              </Route>

              {/* Catch-all hors layout */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>

        {/* Splash = overlay non bloquant (inchangé) */}
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
