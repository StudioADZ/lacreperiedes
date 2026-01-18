import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Home, Gift, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log léger (évite de polluer la console en "error")
    console.warn("404: route inexistante :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1.5 text-primary text-sm font-medium">
          Oups… page introuvable
        </div>

        <h1 className="mb-2 font-display text-5xl font-bold">404</h1>
        <p className="mb-6 text-muted-foreground">
          Cette page n’existe pas (ou a été déplacée).
        </p>

        {/* Quick actions */}
        <div className="grid gap-3">
          <Link to="/" className="block">
            <Button className="w-full btn-hero gap-2">
              <Home className="w-4 h-4" />
              Retour à l’accueil
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/quiz" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Gift className="w-4 h-4" />
                Quiz
              </Button>
            </Link>

            <Link to="/carte" className="block">
              <Button variant="outline" className="w-full gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                La carte
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Route demandée : <span className="font-mono">{location.pathname}</span>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
