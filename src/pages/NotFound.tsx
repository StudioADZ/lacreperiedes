import { Home, MapPin, Search, UtensilsCrossed } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const NotFound = () => {
  const location = useLocation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-butter/40 via-background to-background px-4 py-16">
      <section className="w-full max-w-md rounded-[2rem] border border-caramel/20 bg-white/80 p-6 text-center shadow-warm backdrop-blur" aria-labelledby="not-found-title">
        <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-sm ring-2 ring-caramel/20">
          <img src={logo} alt="" aria-hidden="true" className="h-full w-full object-cover" width={96} height={96} />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.18em] text-caramel">Erreur 404</p>
        <h1 id="not-found-title" className="mt-2 font-display text-3xl font-black text-espresso">Cette page n’existe pas</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          L’adresse <span className="break-all font-mono text-xs text-foreground">{location.pathname}</span> ne correspond à aucune page publique de La Crêperie des Saveurs.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to="/" className="block">
            <Button className="h-12 w-full rounded-2xl font-bold">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Accueil
            </Button>
          </Link>
          <Link to="/carte" className="block">
            <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">
              <UtensilsCrossed className="mr-2 h-4 w-4" aria-hidden="true" />
              Voir la carte
            </Button>
          </Link>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <Link to="/reserver" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-caramel hover:bg-caramel/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Réserver une table
          </Link>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-muted-foreground hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Nous trouver à Mamers
          </a>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
