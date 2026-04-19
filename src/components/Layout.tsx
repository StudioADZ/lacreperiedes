import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";
import AssistantChat from "./AssistantChat";

/**
 * Layout global non-destructif.
 * - Conserve Header / DrawerMenu / StickyBar / AssistantChat
 * - Affichage conditionnel plus fin pour préparer les futurs parcours
 *   (admin, vérification QR, espace client, réservation, commande)
 */
const HIDE_STICKY_PREFIXES = ["/admin", "/verify", "/mon-compte", "/client"];
const HIDE_ASSISTANT_PREFIXES = ["/admin", "/verify"];

const matches = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Ferme le menu et remonte en haut à chaque navigation
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const { showSticky, showAssistant } = useMemo(
    () => ({
      showSticky: !matches(location.pathname, HIDE_STICKY_PREFIXES),
      showAssistant: !matches(location.pathname, HIDE_ASSISTANT_PREFIXES),
    }),
    [location.pathname]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />

      <main className="flex-1">
        <Outlet />
      </main>

      {showSticky && <StickyBar />}
      {showAssistant && <AssistantChat />}
    </div>
  );
};

export default Layout;
