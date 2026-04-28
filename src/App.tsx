import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/services/auth/AuthProvider";
import SplashScreen from "./components/SplashScreen";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import Index from "./pages/Index";

// Lazy-load des routes secondaires → home plus rapide, bundle initial allégé
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    <p className="text-sm text-muted-foreground">Chargement...</p>
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(
    () => sessionStorage.getItem("splashShown") !== "true",
  );

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

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

                {/* Espace client (auth requis) */}
                <Route
                  path="/client"
                  element={
                    <ProtectedRoute requireAuth>
                      <Client />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mon-compte"
                  element={
                    <ProtectedRoute requireAuth>
                      <Client />
                    </ProtectedRoute>
                  }
                />

                {/* Admin (rôle admin requis via user_roles + has_role RPC) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>

        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
