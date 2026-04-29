import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  FileText,
  Heart,
  HelpCircle,
  Home,
  Settings,
  Share2,
  Star,
  UtensilsCrossed,
  User,
} from "lucide-react";
import logo from "@/assets/logo.png";

interface DrawerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { path: "/", label: "Accueil", icon: Home, end: true },
  { path: "/client", label: "Mon compte", icon: User, aliases: ["/mon-compte"] },
  { path: "/quiz", label: "Quiz", icon: HelpCircle },
  { path: "/carte", label: "La carte", icon: UtensilsCrossed },
  { path: "/reserver", label: "Réserver", icon: Calendar },
  { path: "/avis", label: "Avis Google", icon: Star },
  { path: "/social", label: "Réseaux", icon: Share2 },
  { path: "/about", label: "À propos", icon: Heart },
  { path: "/legal", label: "Mentions légales", icon: FileText },
];

const adminItem = { path: "/admin", label: "Administration", icon: Settings };

const isActiveRoute = (
  pathname: string,
  item: { path: string; end?: boolean; aliases?: string[] },
) => {
  const candidates = [item.path, ...(item.aliases ?? [])];

  return candidates.some((path) => {
    if (item.end || path === "/") return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  });
};

const DrawerMenu = ({ open, onOpenChange }: DrawerMenuProps) => {
  const { pathname } = useLocation();
  const closeMenu = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden border-r-0 bg-ivory p-0"
        aria-label="Menu de navigation"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border/50 bg-butter/30 px-6 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl px-3 py-2 text-center transition-colors hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="h-16 w-16 overflow-hidden rounded-full shadow-warm ring-1 ring-black/5">
                <img
                  src={logo}
                  alt="La Crêperie des Saveurs"
                  width={64}
                  height={64}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="text-sm font-semibold text-foreground">
                La Crêperie des Saveurs
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4" aria-label="Navigation principale">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(pathname, item);
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-warm"
                          : "text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive ? "text-primary-foreground" : "text-caramel"
                        }`}
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border/50 bg-butter/20 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-5">
            <Link
              to={adminItem.path}
              onClick={closeMenu}
              aria-current={isActiveRoute(pathname, adminItem) ? "page" : undefined}
              className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>{adminItem.label}</span>
            </Link>

            <address className="space-y-1 text-center not-italic">
              <a
                href="https://www.google.com/maps/search/?api=1&query=17%20Place%20Carnot%20Galerie%20des%20Halles%2072600%20Mamers"
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                17 Place Carnot – Galerie des Halles<br />
                72600 Mamers
              </a>
              <a
                href="tel:+33259660176"
                className="mt-3 block text-sm font-semibold text-caramel transition-colors hover:text-primary"
              >
                02 59 66 01 76
              </a>
            </address>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DrawerMenu;
