import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  HelpCircle,
  UtensilsCrossed,
  Calendar,
  Star,
  Share2,
  FileText,
  Settings,
  Heart,
  User,
} from "lucide-react";
import logo from "@/assets/logo.jpg";

interface DrawerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { path: "/", label: "Accueil", icon: Home, exact: true },
  { path: "/client", label: "Mon Compte", icon: User },
  { path: "/quiz", label: "Quiz", icon: HelpCircle },
  { path: "/carte", label: "La Carte", icon: UtensilsCrossed },
  { path: "/reserver", label: "Réserver", icon: Calendar },
  { path: "/avis", label: "Avis Google", icon: Star },
  { path: "/social", label: "Réseaux", icon: Share2 },
  { path: "/about", label: "À propos", icon: Heart },
  { path: "/legal", label: "Mentions légales", icon: FileText },
] as const;

const adminItem = { path: "/admin", label: "Admin", icon: Settings };

const DrawerMenu = ({ open, onOpenChange }: DrawerMenuProps) => {
  const location = useLocation();

  const isActivePath = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    // ✅ active also for subroutes: /client/*, /quiz/*, etc.
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // ✅ SAFE: hide admin link unless explicitly enabled
  // - doesn’t remove the route, just avoids exposing it in the menu by default
  const showAdminLink = false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 bg-ivory border-r-0 p-0">
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-6 border-b border-border/50 bg-butter/30">
            <Link to="/" onClick={() => onOpenChange(false)} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-warm">
                <img src={logo} alt="La Crêperie des Saveurs" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">La Crêperie</h2>
                <p className="text-sm text-muted-foreground">des Saveurs</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const active = isActivePath(item.path, (item as any).exact);
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => onOpenChange(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-primary text-primary-foreground shadow-warm"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-border/50 bg-butter/20">
            {/* Admin Link - discret (optional) */}
            {showAdminLink && (
              <Link
                to={adminItem.path}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors mb-4"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Administration</span>
              </Link>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">17 Place Carnot – Galerie des Halles</p>
              <p className="text-xs text-muted-foreground mt-1">72600 Mamers</p>
              <p className="text-sm font-medium text-caramel mt-3">02 59 66 01 76</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DrawerMenu;
