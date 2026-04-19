import { useState, useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";
import AssistantChat from "./AssistantChat";

/**
 * Layout global de l'application.
 * - Conserve Header / DrawerMenu / StickyBar / AssistantChat / Outlet
 * - Pilote l'affichage des éléments globaux (sticky bar, assistant) via une
 *   configuration centralisée et extensible par préfixe de route.
 * - Ferme automatiquement le drawer et restaure le scroll à chaque navigation.
 */

// ---------------------------------------------------------------------------
// Configuration des routes
// ---------------------------------------------------------------------------
// Pour ajouter un nouveau type de page (admin, verify, espace client, etc.),
// il suffit d'ajouter le préfixe dans la liste correspondante ci-dessous.

type RouteFlags = {
  /** Cache la barre sticky (CTA bas de page) */
  hideSticky?: boolean;
  /** Cache l'assistant flottant (chat) */
  hideAssistant?: boolean;
};

/**
 * Map préfixe → flags. L'ordre n'a pas d'importance : on prend le préfixe
 * le plus spécifique (le plus long) qui matche l'URL courante.
 */
const ROUTE_CONFIG: Record<string, RouteFlags> = {
  "/admin": { hideSticky: true, hideAssistant: true },
  "/verify": { hideSticky: true, hideAssistant: true },
  "/mon-compte": { hideSticky: true },
  "/client": { hideSticky: true },
};

const isPrefixMatch = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Résout les flags pour la route courante en prenant le préfixe le plus spécifique. */
const resolveRouteFlags = (pathname: string): RouteFlags => {
  let matched: RouteFlags = {};
  let bestLength = -1;

  for (const [prefix, flags] of Object.entries(ROUTE_CONFIG)) {
    if (isPrefixMatch(pathname, prefix) && prefix.length > bestLength) {
      matched = flags;
      bestLength = prefix.length;
    }
  }

  return matched;
};

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Ferme le menu à chaque navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Retour en haut à chaque changement de route (avant peinture pour éviter le flash)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // Verrouille le scroll du body quand le drawer est ouvert (mobile-friendly).
  // Restaure proprement l'état initial à la fermeture / au démontage.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const { hideSticky, hideAssistant } = resolveRouteFlags(pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />

      <main className="flex-1">
        <Outlet />
      </main>

      {!hideSticky && <StickyBar />}
      {!hideAssistant && <AssistantChat />}
    </div>
  );
};

export default Layout;
