import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";
import AssistantChat from "./AssistantChat";

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Don't show assistant on admin page
  const showAssistant = !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />
      
      <main>
        <Outlet />
      </main>
      
      <StickyBar />
      {showAssistant && <AssistantChat />}
    </div>
  );
};

export default Layout;
