import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // ✅ Guard: si jamais exécuté côté SSR par erreur
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const update = () => {
      // ✅ Plus cohérent que innerWidth (utilise la source du media query)
      setIsMobile(mql.matches);
    };

    // ✅ Init immédiate
    update();

    // ✅ Compat: Safari ancien
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      // @ts-expect-error - fallback legacy Safari
      mql.addListener(update);
      // @ts-expect-error - fallback legacy Safari
      return () => mql.removeListener(update);
    }
  }, []);

  // ✅ Même contrat qu’avant: retourne toujours un boolean
  return !!isMobile;
}
