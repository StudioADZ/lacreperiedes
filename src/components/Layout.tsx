import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";
import AssistantChat from "./AssistantChat";

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const showAssistant = !isAdminRoute;

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />

      {/* 
        SAFE: compense Header fixed + StickyBar fixed
        - pt-16 : ajuste si ton header n'est pas ~64px
        - pb-24 : ajuste selon la hauteur de StickyBar
      */}
      <main className="pt-16 pb-24">
        <Outlet />
      </main>

      <StickyBar />
      {showAssistant && <AssistantChat />}
    </div>
  );
};

export default Layout;
