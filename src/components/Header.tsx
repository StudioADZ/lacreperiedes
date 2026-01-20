import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass">
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-caramel/20 hover:border-caramel/40 transition-colors p-0"
        >
          <img src={logo} alt="Menu" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-espresso/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Menu className="w-5 h-5 text-white" />
          </div>
        </Button>

        <div className="text-center">
          <h1 className="font-display text-lg font-semibold text-foreground">
            La Crêperie
          </h1>
          <p className="text-xs text-muted-foreground -mt-0.5">des Saveurs</p>
        </div>

        <div className="w-12" /> {/* Spacer for balance */}
      </div>
    </header>
  );
};

export default Header;
