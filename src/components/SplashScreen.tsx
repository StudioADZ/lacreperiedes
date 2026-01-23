import { useEffect, useState, type CSSProperties } from "react";
import logo from "@/assets/logo.png";
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
  const [isEntering, setIsEntering] = useState(false);
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
              event_subtitle:
                data[0].event_subtitle || DEFAULT_CONFIG.event_subtitle,
              game_line: data[0].game_line || DEFAULT_CONFIG.game_line,
              cta_text: data[0].cta_text || DEFAULT_CONFIG.cta_text,
              background_image_url: data[0].background_image_url,
            });
          }
        }
      } catch {
        // keep defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleEnter = () => {
    if (isLoading || isEntering) return;
    setIsEntering(true);

    window.setTimeout(() => {
      onComplete();
    }, 1400);
  };

  const hasBackgroundImage = !!config.background_image_url;

  const bgCss = hasBackgroundImage
    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${config.background_image_url})`
    : `linear-gradient(180deg,
        hsl(40 33% 96%) 0%,
        hsl(35 45% 92%) 30%,
        hsl(32 50% 88%) 70%,
        hsl(35 45% 90%) 100%
      )`;

  const rootStyle: CSSProperties = hasBackgroundImage
    ? { background: bgCss, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bgCss };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={rootStyle}
    >
      <style>{`
        /* CTA animé (gradient + pulse + glow) */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaPulse {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
          50% { transform: translateY(-1px) scale(1.03); filter: brightness(1.06); }
        }
        @keyframes ctaGlow {
          0%, 100% {
            box-shadow:
              0 18px 65px -18px rgba(143, 90, 32, 0.90),
              0 0 0 0 rgba(143, 90, 32, 0.00);
          }
          50% {
            box-shadow:
              0 26px 92px -22px rgba(143, 90, 32, 1.00),
              0 0 0 16px rgba(143, 90, 32, 0.18);
          }
        }
        .cta-animated {
          background-size: 220% 220%;
          animation:
            gradientShift 5s ease-in-out infinite,
            ctaPulse 1.8s ease-in-out infinite,
            ctaGlow 1.8s ease-in-out infinite;
          will-change: transform, filter, box-shadow, background-position;
        }

        /* Zoom du "cadre" logo (encore un peu reculé) */
        @keyframes logoZoomFull {
          0% { transform: translate(-50%, -50%) scale(1); border-radius: 9999px; }
          70% { transform: translate(-50%, -50%) scale(2.35); border-radius: 30px; }
          100% { transform: translate(-50%, -50%) scale(2.55); border-radius: 26px; }
        }

        /* Portes 3D (SUR le logo, pas sur l'écran) */
        @keyframes doorOpenLeft {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(80deg); }
        }
        @keyframes doorOpenRight {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-80deg); }
        }

        .overlay-enter { pointer-events: none; }

        /* Le "cadre" qui zoome, et à l'intérieur les 2 portes */
        .door-frame {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 180px;
          height: 180px;
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: 0 18px 80px rgba(0,0,0,0.25);
          animation: logoZoomFull 800ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          z-index: 3;

          /* perspective appliquée au cadre => la porte s'ouvre SUR le logo */
          perspective: 900px;
          transform-style: preserve-3d;
        }

        .door-panels {
          position: absolute;
          inset: 0;
          display: flex;
          transform-style: preserve-3d;
        }

        .door {
          width: 50%;
          height: 100%;
          background-image: url("${logo}");
          background-repeat: no-repeat;
          background-size: cover;
          filter: saturate(0.98) contrast(1.04);
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .door.left {
          transform-origin: left center;
          background-position: left center;
          animation: doorOpenLeft 600ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          animation-delay: 820ms;
          box-shadow: inset -14px 0 26px rgba(0,0,0,0.24);
          border-right: 1px solid rgba(255,255,255,0.12);
        }

        .door.right {
          transform-origin: right center;
          background-position: right center;
          animation: doorOpenRight 600ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          animation-delay: 820ms;
          box-shadow: inset 14px 0 26px rgba(0,0,0,0.24);
          border-left: 1px solid rgba(0,0,0,0.06);
        }

        /* petit fond derrière les portes (optionnel, mais ça donne de la profondeur) */
        .door-back {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.08);
          opacity: 0.55;
        }

        @media (min-width: 768px) {
          .door-frame { width: 220px; height: 220px; }
        }
      `}</style>

      {isEntering && (
        <div className="absolute inset-0 z-[220] overlay-enter">
          {/* fond anti-flash */}
          <div
            className="absolute inset-0"
            style={{
              background: bgCss,
              backgroundSize: hasBackgroundImage ? "cover" : undefined,
              backgroundPosition: hasBackgroundImage ? "center" : undefined,
            }}
          />

          {/* Cadre logo qui zoome + portes qui s'ouvrent SUR le logo */}
          <div className="door-frame">
            <div className="door-back" />
            <div className="door-panels">
              <div className="door left" />
              <div className="door right" />
            </div>
          </div>
        </div>
      )}

      {!hasBackgroundImage && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, hsl(32, 65%, 45%) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      )}

      {!hasBackgroundImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
            style={{ background: "hsl(32 65% 45%)" }}
          />
        </div>
      )}

      <div className="relative flex flex-col items-center text-center px-6 max-w-md">
        <div className="relative mb-8">
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-[0_8px_40px_-8px_hsl(32_65%_45%_/_0.4)] border-4 border-butter/50">
            <img
              src={logo}
              alt="La Crêperie des Saveurs"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30 -z-10 scale-125"
            style={{ background: "hsl(32 65% 45%)" }}
          />
        </div>

        <h1
          className={`font-display text-3xl md:text-4xl font-semibold mb-3 animate-fade-in ${
            hasBackgroundImage ? "text-white drop-shadow-lg" : "text-espresso"
          }`}
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : config.event_title}
        </h1>

        <p
          className={`text-base md:text-lg font-serif mb-2 animate-fade-in ${
            hasBackgroundImage ? "text-white/90" : "text-muted-foreground"
          }`}
          style={{ animationDelay: "0.1s" }}
        >
          {config.event_subtitle}
        </p>

        <p
          className={`text-sm font-medium uppercase tracking-wider mb-10 animate-fade-in ${
            hasBackgroundImage ? "text-caramel-light" : "text-caramel"
          }`}
          style={{ animationDelay: "0.2s" }}
        >
          {config.game_line}
        </p>

        <Button
          onClick={handleEnter}
          size="lg"
          disabled={isLoading || isEntering}
          className="text-base md:text-lg px-8 py-6 rounded-full animate-fade-in cta-animated shadow-[0_18px_65px_-18px_rgba(143,90,32,0.95)] hover:shadow-[0_26px_90px_-22px_rgba(143,90,32,1)]"
          style={{
            animationDelay: "0.3s",
            backgroundImage:
              "linear-gradient(90deg, hsl(32 65% 45%), hsl(38 75% 58%), hsl(32 65% 45%))",
          }}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : config.cta_text}
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className={`w-16 h-1 rounded-full ${hasBackgroundImage ? "bg-white/30" : "bg-caramel/30"}`} />
      </div>
    </div>
  );
};

export default SplashScreen;
