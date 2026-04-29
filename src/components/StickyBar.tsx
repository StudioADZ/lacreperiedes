import { Link, useLocation } from "react-router-dom";
import { Calendar, HelpCircle, MessageCircle, Star, type LucideIcon } from "lucide-react";

type StickyItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  ariaLabel?: string;
};

const stickyItems: StickyItem[] = [
  {
    path: "/quiz",
    label: "Quiz",
    icon: HelpCircle,
    ariaLabel: "Participer au quiz",
  },
  {
    path: "/reserver",
    label: "Réserver",
    icon: Calendar,
    ariaLabel: "Réserver une table",
  },
  {
    path: "/avis",
    label: "Avis",
    icon: Star,
    ariaLabel: "Voir les avis clients",
  },
  {
    path: "https://wa.me/message/QVZO5N4ZDR64M1",
    label: "WhatsApp",
    icon: MessageCircle,
    external: true,
    ariaLabel: "Contacter la crêperie sur WhatsApp",
  },
];

const isActiveRoute = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const itemClassName = (isActive = false) =>
  `group relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
    isActive
      ? "bg-primary text-primary-foreground shadow-warm"
      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
  }`;

const StickyBar = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="sticky-bar safe-area-bottom"
      aria-label="Actions rapides"
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-1.5 px-2 py-2">
        {stickyItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.external && isActiveRoute(pathname, item.path);
          const content = (
            <>
              <Icon
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-primary-foreground" : "text-caramel"
                }`}
                aria-hidden="true"
              />
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </>
          );

          if (item.external) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.ariaLabel}
                className={itemClassName(false)}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={itemClassName(isActive)}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default StickyBar;
