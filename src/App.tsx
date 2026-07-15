import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/services/auth/AuthProvider";
import SplashScreen from "./components/SplashScreen";
import Layout from "./components/Layout";
import Index from "./pages/Index";

const Quiz = lazy(() => import("./pages/Quiz"));
const Carte = lazy(() => import("./pages/Carte"));
const Reserver = lazy(() => import("./pages/ReserverPremium"));
const Avis = lazy(() => import("./pages/Avis"));
const Social = lazy(() => import("./pages/Social"));
const Legal = lazy(() => import("./pages/Legal"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Verify = lazy(() => import("./pages/Verify"));
const Client = lazy(() => import("./pages/Client"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
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
    mutations: { retry: 0 },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden="true" />
    <p className="text-sm text-muted-foreground">Chargement…</p>
  </div>
);

const shouldShowSplash = () => {
  try {
    return sessionStorage.getItem("splashShown") !== "true";
  } catch {
    return true;
  }
};

const App = () => {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem("splashShown", "true");
    } catch {
      // Non-critical: the splash may show again on the next visit.
    }
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
                  <Route path="/" element={<Index />} />
                  <Route path="/carte" element={<Carte />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/avis" element={<Avis />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/reserver" element={<Reserver />} />
                  <Route path="/verify/:code" element={<Verify />} />
                  <Route path="/client" element={<Client />} />
                  <Route path="/mon-compte" element={<Client />} />
                  <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
                  <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>

          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
