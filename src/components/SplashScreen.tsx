import { useState } from "react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onComplete: () => void;
}

// Event configuration - can be updated for different marketing events
const EVENT_CONFIG = {
  title: "🎉 Quiz & Récompenses",
  subtitle: "Crêpes & Galettes artisanales – Mamers",
  gameLine: "Jeu & récompenses en cours",
  ctaText: "Entrer dans la Crêperie",
};

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: `linear-gradient(180deg, 
          hsl(40 33% 96%) 0%, 
          hsl(35 45% 92%) 30%,
          hsl(32 50% 88%) 70%,
          hsl(35 45% 90%) 100%
        )`,
      }}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(32, 65%, 45%) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Warm glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: "hsl(32 65% 45%)" }}
        />
      </div>

      {/* Content container */}
      <div className={`relative flex flex-col items-center text-center px-6 max-w-md transition-all duration-700 ${
        isExiting ? "scale-90 opacity-0" : "scale-100 opacity-100"
      }`}>
        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-[0_8px_40px_-8px_hsl(32_65%_45%_/_0.4)] border-4 border-butter/50 splash-logo">
            <img
              src={logo}
              alt="La Crêperie des Saveurs"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full blur-2xl opacity-30 -z-10 scale-125" style={{ background: "hsl(32 65% 45%)" }} />
        </div>

        {/* Event Title */}
        <h1 className="font-display text-3xl md:text-4xl text-espresso font-semibold mb-3 animate-fade-in">
          {EVENT_CONFIG.title}
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base md:text-lg font-serif mb-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {EVENT_CONFIG.subtitle}
        </p>

        {/* Game line */}
        <p className="text-caramel text-sm font-medium uppercase tracking-wider mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {EVENT_CONFIG.gameLine}
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleEnter}
          size="lg"
          className="btn-hero text-base md:text-lg px-8 py-6 rounded-full animate-fade-in shadow-[0_8px_30px_-8px_hsl(32_65%_45%_/_0.5)] hover:shadow-[0_12px_40px_-8px_hsl(32_65%_45%_/_0.6)]"
          style={{ animationDelay: "0.3s" }}
        >
          {EVENT_CONFIG.ctaText}
        </Button>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-16 h-1 bg-caramel/30 rounded-full" />
      </div>
    </div>
  );
};

export default SplashScreen;
