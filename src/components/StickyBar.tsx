import { Link, useLocation } from "react-router-dom";
import { HelpCircle, Calendar, Star, MessageCircle } from "lucide-react";

const stickyItems = [
  { 
    path: "/quiz", 
    label: "Quiz", 
    icon: HelpCircle,
    emoji: "🎯"
  },
  { 
    path: "/reserver", 
    label: "Réserver", 
    icon: Calendar,
    emoji: "📅"
  },
  { 
    path: "/avis", 
    label: "Avis", 
    icon: Star,
    emoji: "⭐"
  },
  { 
    path: "https://wa.me/message/QVZO5N4ZDR64M1", 
    label: "WhatsApp", 
    icon: MessageCircle,
    emoji: "💬",
    external: true
  },
];

const StickyBar = () => {
  const location = useLocation();

  return (
    <div className="sticky-bar safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {stickyItems.map((item) => {
          const isActive = !item.external && location.pathname === item.path;
          
          if (item.external) {
            return (
              <a
                key={item.path}
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
              key={item.path}
              to={item.path}
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
