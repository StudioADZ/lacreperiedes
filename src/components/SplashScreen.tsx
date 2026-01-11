import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(onComplete, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ivory cursor-pointer transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClick}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(32, 65%, 45%) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Logo */}
      <div className={`relative transition-all duration-700 ${isExiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-elevated animate-pulse-warm">
          <img
            src={logo}
            alt="La Crêperie des Saveurs"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-caramel/20 blur-3xl -z-10 scale-150" />
      </div>

      {/* Tagline */}
      <div className={`mt-8 text-center transition-all duration-500 delay-300 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <p className="text-sm uppercase tracking-[0.3em] text-caramel font-medium">
          Crêpes & Galettes
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Mamers • Artisan
        </p>
      </div>

      {/* Tap hint */}
      <div className={`absolute bottom-12 transition-all duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-xs text-muted-foreground animate-pulse">
          Touchez pour entrer
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
