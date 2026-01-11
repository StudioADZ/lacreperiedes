import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import DrawerMenu from "./DrawerMenu";
import StickyBar from "./StickyBar";

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

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <DrawerMenu open={menuOpen} onOpenChange={setMenuOpen} />
      
      <main>
        <Outlet />
      </main>
      
      <StickyBar />
    </div>
  );
};

export default Layout;
