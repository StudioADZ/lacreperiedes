import { useState, useEffect } from "react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

interface SplashSettings {
  event_title: string;
  event_subtitle: string;
  game_line: string;
  cta_text: string;
  background_image_url: string | null;
}

const DEFAULT_CONFIG: SplashSettings = {
  event_title: "🎉 Quiz & Récompenses",
  event_subtitle: "Crêpes & Galettes artisanales – Mamers",
  game_line: "Jeu & récompenses en cours",
  cta_text: "Entrer dans la Crêperie",
  background_image_url: null,
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [config, setConfig] = useState<SplashSettings>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/splash_settings?is_active=eq.true&limit=1`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setConfig({
              event_title: data[0].event_title || DEFAULT_CONFIG.event_title,
              event_subtitle: data[0].event_subtitle || DEFAULT_CONFIG.event_subtitle,
              game_line: data[0].game_line || DEFAULT_CONFIG.game_line,
              cta_text: data[0].cta_text || DEFAULT_CONFIG.cta_text,
              background_image_url: data[0].background_image_url,
            });
          }
        }
      } catch (err) {
        console.log("Using default splash config");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(onComplete, 600);
  };

  const backgroundStyle = config.background_image_url
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${config.background_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: `linear-gradient(180deg, 
          hsl(40 33% 96%) 0%, 
          hsl(35 45% 92%) 30%,
          hsl(32 50% 88%) 70%,
          hsl(35 45% 90%) 100%
        )`,
      };

  const hasBackgroundImage = !!config.background_image_url;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={backgroundStyle}
    >
      {/* Decorative background pattern - only show when no image */}
      {!hasBackgroundImage && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, hsl(32, 65%, 45%) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      )}

      {/* Warm glow effect - only show when no image */}
      {!hasBackgroundImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
            style={{ background: "hsl(32 65% 45%)" }}
          />
        </div>
      )}

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
        <h1 className={`font-display text-3xl md:text-4xl font-semibold mb-3 animate-fade-in ${
          hasBackgroundImage ? 'text-white drop-shadow-lg' : 'text-espresso'
        }`}>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : config.event_title}
        </h1>

        {/* Subtitle */}
        <p className={`text-base md:text-lg font-serif mb-2 animate-fade-in ${
          hasBackgroundImage ? 'text-white/90' : 'text-muted-foreground'
        }`} style={{ animationDelay: "0.1s" }}>
          {config.event_subtitle}
        </p>

        {/* Game line */}
        <p className={`text-sm font-medium uppercase tracking-wider mb-10 animate-fade-in ${
          hasBackgroundImage ? 'text-caramel-light' : 'text-caramel'
        }`} style={{ animationDelay: "0.2s" }}>
          {config.game_line}
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleEnter}
          size="lg"
          disabled={isLoading}
          className="btn-hero text-base md:text-lg px-8 py-6 rounded-full animate-fade-in shadow-[0_8px_30px_-8px_hsl(32_65%_45%_/_0.5)] hover:shadow-[0_12px_40px_-8px_hsl(32_65%_45%_/_0.6)]"
          style={{ animationDelay: "0.3s" }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : config.cta_text}
        </Button>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className={`w-16 h-1 rounded-full ${hasBackgroundImage ? 'bg-white/30' : 'bg-caramel/30'}`} />
      </div>
    </div>
  );
};

export default SplashScreen;
