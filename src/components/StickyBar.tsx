import { Link, useLocation } from "react-router-dom";

const stickyItems = [
  {
    path: "/quiz",
    label: "Quiz",
    emoji: "🎯",
  },
  {
    path: "/reserver",
    label: "Réserver",
    emoji: "📅",
  },
  {
    path: "/avis",
    label: "Avis",
    emoji: "⭐",
  },
  {
    path: "https://wa.me/message/QVZO5N4ZDR64M1",
    label: "WhatsApp",
    emoji: "💬",
    external: true,
  },
] as const;

const StickyBar = () => {
  const location = useLocation();

  const isPathActive = (path: string) => {
    // ✅ Active même si sous-route (ex: /quiz/intro)
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="sticky-bar safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {stickyItems.map((item) => {
          const isActive = !("external" in item) && isPathActive(item.path);

          if ("external" in item && item.external) {
            return (
              <a
                key={`${item.label}-${item.path}`}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="sticky-bar-item flex-1 max-w-[80px]"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={`${item.label}-${item.path}`}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`sticky-bar-item flex-1 max-w-[80px] ${isActive ? "active" : ""}`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StickyBar;
