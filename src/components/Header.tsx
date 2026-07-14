import { Menu } from "lucide-react";
import logo from "@/assets/logo.png";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header
      className="fixed left-[calc(env(safe-area-inset-left)+0.75rem)] top-[calc(env(safe-area-inset-top)+0.625rem)] z-50"
      aria-label="Navigation principale"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu de navigation"
        aria-haspopup="dialog"
        className="group flex min-h-14 items-center gap-2 rounded-full border border-white/45 bg-white/85 p-1.5 pr-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
      >
        <span className="relative h-11 w-11 overflow-hidden rounded-full shadow-warm ring-1 ring-black/5">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </span>
        <span className="flex items-center gap-1.5 text-sm font-bold text-espresso">
          <Menu className="h-4 w-4" aria-hidden="true" />
          Menu
        </span>
      </button>
    </header>
  );
};

export default Header;
