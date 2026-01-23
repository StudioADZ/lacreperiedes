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
  const [logoReady, setLogoReady] = useState(false);
  const [config, setConfig] = useState<SplashSettings>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Précharge logo (utile)
  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.onload = () => !cancelled && setLogoReady(true);
    img.onerror = () => !cancelled && setLogoReady(true);
    img.src = logo;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = logo;
    document.head.appendChild(link);

    return () => {
      cancelled = true;
      try {
        document.head.removeChild(link);
      } catch {}
    };
  }, []);

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
          if (data?.length) {
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
    if (isLoading || isEntering || !logoReady) return;
    setIsEntering(true);

    window.setTimeout(() => {
      onComplete();
    }, 1400);
  };

  const hasBackgroundImage = !!config.background_image_url;

  const bgCss = hasBackgroundImage
    ? `linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.45)), url(${config.background_image_url})`
    : `linear-gradient(180deg,
        hsl(40 33% 96%) 0%,
        hsl(35 45% 92%) 30%,
        hsl(32 50% 88%) 70%,
        hsl(35 45% 90%) 100%
      )`;

  const rootStyle: CSSProperties = hasBackgroundImage
    ? { background: bgCss, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bgCss };

  const canEnter = !isLoading && logoReady && !isEntering;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={rootStyle}
    >
      <style>{`
        /* ===== CTA animé (gradient + pulse + glow) ===== */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaPulse {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
          50% { transform: translateY(-2px) scale(1.045); filter: brightness(1.10); }
        }
        @keyframes ctaGlow {
          0%, 100% {
            box-shadow:
              0 20px 70px -18px rgba(143, 90, 32, 0.95),
              0 0 0 0 rgba(143, 90, 32, 0.00);
          }
          50% {
            box-shadow:
              0 34px 110px -26px rgba(143, 90, 32, 1.00),
              0 0 0 20px rgba(143, 90, 32, 0.22);
          }
        }
        .cta-animated {
          background-size: 240% 240%;
          animation:
            gradientShift 4.8s ease-in-out infinite,
            ctaPulse 1.7s ease-in-out infinite,
            ctaGlow 1.7s ease-in-out infinite;
          will-change: transform, filter, box-shadow, background-position;
        }

        /* ===== Logo + Glow animation (plus visible) ===== */
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.02); }
        }
        @keyframes glowBreath {
          0%, 100% {
            transform: scale(1.18);
            opacity: 0.38;
            filter: blur(24px);
          }
          50% {
            transform: scale(1.42);
            opacity: 0.60;
            filter: blur(34px);
          }
        }
        .logo-float {
          animation: logoFloat 2.6s ease-in-out infinite;
          will-change: transform;
        }
        .logo-glow-anim {
          animation: glowBreath 2.6s ease-in-out infinite;
          will-change: transform, opacity, filter;
        }
      `}</style>

      {/* texture légère si pas de background image */}
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

      {/* glow “ambiance” */}
      {!hasBackgroundImage && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full blur-3xl opacity-25"
            style={{ background: "hsl(32 65% 45%)" }}
          />
        </div>
      )}

      <div className="relative flex flex-col items-center text-center px-6 max-w-md">
        {/* LOGO + GLOW (animés) */}
        <div className="relative mb-8">
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-butter/50 logo-float shadow-[0_10px_55px_-10px_hsl(32_65%_45%_/_0.55)]">
            <img
              src={logo}
              alt="La Crêperie des Saveurs"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="sync"
            />
          </div>

          <div
            className="absolute inset-0 rounded-full -z-10 scale-125 logo-glow-anim"
            style={{ background: "hsl(32 65% 45%)" }}
          />
        </div>

        <h1
          className={`font-display text-3xl md:text-4xl font-semibold mb-3 animate-fade-in ${
            hasBackgroundImage ? "text-white drop-shadow-lg" : "text-espresso"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            config.event_title
          )}
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

        {/* CTA : garde animation + glow même quand on clique (disabled sans fade) */}
        <Button
          onClick={handleEnter}
          size="lg"
          disabled={!canEnter}
          className="text-base md:text-lg px-8 py-6 rounded-full animate-fade-in cta-animated
                     shadow-[0_20px_75px_-20px_rgba(143,90,32,1)]
                     hover:shadow-[0_34px_115px_-28px_rgba(143,90,32,1)]
                     disabled:opacity-100 disabled:cursor-not-allowed"
          style={{
            animationDelay: "0.3s",
            backgroundImage:
              "linear-gradient(90deg, hsl(32 65% 45%), hsl(38 75% 58%), hsl(32 65% 45%))",
          }}
        >
          {!logoReady || isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isEntering ? (
            "Ouverture…"
          ) : (
            config.cta_text
          )}
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div
          className={`w-16 h-1 rounded-full ${
            hasBackgroundImage ? "bg-white/30" : "bg-caramel/30"
          }`}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
