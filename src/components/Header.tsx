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
        className="group flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/75 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
      >
        <span className="sr-only">Menu</span>
        <span className="relative h-12 w-12 overflow-hidden rounded-full shadow-warm ring-1 ring-black/5">
          <img
            src={logo}
            alt="La Crêperie des Saveurs"
            width={48}
            height={48}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </span>
      </button>
    </header>
  );
};

export default Header;
