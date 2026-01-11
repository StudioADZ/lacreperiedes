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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Check if splash was already shown this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown) {
      setShowSplash(false);
    }
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
        
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
