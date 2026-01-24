import logo from "@/assets/logo.png";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="fixed left-3 z-50 top-[calc(env(safe-area-inset-top)+10px)]">
      {/* Logo seul — cliquable (ouvre le menu) */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="flex items-center justify-center rounded-full border border-white/25 bg-white/70 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-2"
      >
        <div className="h-12 w-12 rounded-full overflow-hidden shadow-warm">
          <img
            src={logo}
            alt="La Crêperie des Saveurs"
            className="h-full w-full object-cover"
          />
        </div>
      </button>
    </header>
  );
};

export default Header;
