import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";
import AssistantChat from "./AssistantChat";

type RouteFlags = {
  hideSticky?: boolean;
  hideAssistant?: boolean;
};

const ROUTE_CONFIG: Record<string, RouteFlags> = {
  "/admin": { hideSticky: true, hideAssistant: true },
  "/verify": { hideSticky: true, hideAssistant: true },
  "/mon-compte": { hideSticky: true },
  "/client": { hideSticky: true },
};

const isPrefixMatch = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

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

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const { hideSticky, hideAssistant } = useMemo(
    () => resolveRouteFlags(pathname),
    [pathname],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Aller au contenu
      </a>

      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      {!hideSticky && <StickyBar />}
      {!hideAssistant && <AssistantChat />}
    </div>
  );
};

export default Layout;
