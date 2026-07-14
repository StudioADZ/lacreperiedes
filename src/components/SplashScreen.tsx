import { useEffect, useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

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
  event_title: "Bienvenue à La Crêperie des Saveurs",
  event_subtitle: "Crêpes et galettes artisanales à Mamers",
  game_line: "Ouvert tous les jours · 12h–22h",
  cta_text: "Découvrir la crêperie",
  background_image_url: null,
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [config, setConfig] = useState<SplashSettings>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSettings = async () => {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/splash_settings?is_active=eq.true&limit=1`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            signal: controller.signal,
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.length) {
            setConfig({
              event_title: data[0].event_title || DEFAULT_CONFIG.event_title,
              event_subtitle: data[0].event_subtitle || DEFAULT_CONFIG.event_subtitle,
              game_line: data[0].game_line || DEFAULT_CONFIG.game_line,
              cta_text: data[0].cta_text || DEFAULT_CONFIG.cta_text,
              background_image_url: data[0].background_image_url,
            });
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          // Keep the local fallback so entry is never blocked.
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    const safetyTimer = window.setTimeout(() => setIsLoading(false), 1600);

    return () => {
      controller.abort();
      window.clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onComplete();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onComplete]);

  const leave = () => {
    if (isLeaving) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      onComplete();
      return;
    }

    setIsLeaving(true);
    window.setTimeout(onComplete, 420);
  };

  const backgroundStyle = config.background_image_url
    ? {
        backgroundImage: `linear-gradient(rgba(39,23,13,.55), rgba(39,23,13,.72)), url(${config.background_image_url})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
      aria-describedby="splash-description"
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(40_45%_96%)] via-[hsl(35_48%_91%)] to-[hsl(31_48%_84%)] px-5 py-8 transition duration-500 ${
        isLeaving ? "scale-[1.015] opacity-0" : "scale-100 opacity-100"
      }`}
      style={backgroundStyle}
    >
      <button
        type="button"
        onClick={onComplete}
        className="absolute right-[calc(env(safe-area-inset-right)+1rem)] top-[calc(env(safe-area-inset-top)+1rem)] inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 text-sm font-semibold text-espresso shadow-sm backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Passer l’écran de bienvenue"
      >
        Passer
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="w-full max-w-md rounded-[2rem] border border-white/45 bg-white/72 p-6 text-center shadow-[0_28px_90px_rgba(66,38,18,.22)] backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-5 h-32 w-32 overflow-hidden rounded-full border-4 border-white/70 shadow-[0_18px_55px_rgba(139,85,35,.28)] sm:h-36 sm:w-36">
          <img
            src={logo}
            alt="Logo de La Crêperie des Saveurs"
            width={144}
            height={144}
            loading="eager"
            decoding="sync"
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-caramel">
          {config.game_line}
        </p>

        <h1 id="splash-title" className="font-display text-3xl font-bold leading-tight text-espresso sm:text-4xl">
          {config.event_title}
        </h1>

        <p id="splash-description" className="mx-auto mt-3 max-w-sm font-serif text-base leading-relaxed text-espresso/75 sm:text-lg">
          {config.event_subtitle}
        </p>

        <Button
          type="button"
          size="lg"
          onClick={leave}
          disabled={isLeaving}
          autoFocus
          className="mt-7 min-h-14 w-full rounded-2xl bg-gradient-to-r from-caramel via-primary to-caramel px-5 text-base font-bold text-white shadow-[0_18px_45px_rgba(143,90,32,.28)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:opacity-80"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Préparation de votre visite…
            </>
          ) : (
            <>
              {config.cta_text}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Accès direct à la carte, aux réservations et aux avantages clients.
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
