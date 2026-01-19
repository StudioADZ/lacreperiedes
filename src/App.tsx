import { useState, useEffect } from "react";
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

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Check if splash was already shown this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
      setAppReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
    setAppReady(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
