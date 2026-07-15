import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  FileText,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Phone,
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

const primaryItems = [
  { path: "/reserver", label: "Réserver une table", description: "Choisir votre créneau", icon: Calendar },
  { path: "/carte", label: "Voir la carte", description: "Galettes, crêpes et formules", icon: UtensilsCrossed },
];

const menuItems = [
  { path: "/", label: "Accueil", icon: Home, end: true },
  { path: "/client", label: "Mon espace client", icon: User, aliases: ["/mon-compte"] },
  { path: "/quiz", label: "Quiz & récompenses", icon: HelpCircle },
  { path: "/avis", label: "Donner mon avis", icon: Star },
  { path: "/social", label: "Réseaux officiels", icon: Share2 },
  { path: "/about", label: "Notre histoire", icon: Heart },
  { path: "/legal", label: "Mentions légales", icon: FileText },
];

const adminItem = { path: "/admin", label: "Administration", icon: Settings };
const businessMapsUrl =
  "https://www.google.com/maps/search/?api=1&query=La%20cr%C3%AAperie%20des%20saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers";
const directionsMapsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=La%20cr%C3%AAperie%20des%20saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers&travelmode=driving";

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
        className="h-dvh max-h-dvh w-[min(23rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain border-r-0 bg-ivory p-0 [-webkit-overflow-scrolling:touch]"
        aria-label="Menu de navigation"
      >
        <div className="flex min-h-dvh flex-col">
          <div className="border-b border-border/50 bg-butter/30 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-warm ring-1 ring-black/5">
                <img
                  src={logo}
                  alt="La Crêperie des Saveurs"
                  width={56}
                  height={56}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="min-w-0 text-left">
                <span className="block font-display text-base font-bold text-espresso">La Crêperie des Saveurs</span>
                <span className="block text-xs text-muted-foreground">Mamers · Ouvert 12h–22h</span>
              </span>
            </Link>
          </div>

          <nav className="p-4" aria-label="Navigation principale">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-caramel">
              Actions rapides
            </p>
            <ul className="grid gap-2">
              {primaryItems.map((item) => {
                const isActive = isActiveRoute(pathname, item);
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-warm"
                          : "border border-caramel/15 bg-white/65 text-foreground shadow-sm hover:bg-white"
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-white/15" : "bg-caramel/10 text-caramel"}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{item.label}</span>
                        <span className={`block text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mb-2 mt-5 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-caramel">
              Découvrir
            </p>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(pathname, item);
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-warm"
                          : "text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive ? "text-primary-foreground" : "text-caramel"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto border-t border-border/50 bg-butter/20 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <a
                href={businessMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-caramel/20 bg-white/55 px-3 py-2.5 text-xs font-semibold text-caramel transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Itinéraire
              </a>
              <a
                href="tel:+33259660176"
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-caramel/20 bg-white/55 px-3 py-2.5 text-xs font-semibold text-caramel transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Appeler
              </a>
            </div>

            <address className="text-center not-italic">
              <a
                href={directionsMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-[11px] leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
              >
                17 Place Carnot · 72600 Mamers
              </a>
            </address>

            <Link
              to={adminItem.path}
              onClick={closeMenu}
              aria-current={isActiveRoute(pathname, adminItem) ? "page" : undefined}
              className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{adminItem.label}</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DrawerMenu;
