import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import ClientDashboard from "@/components/client/ClientDashboard";
import { Button } from "@/components/ui/button";
import { User, Gift, Calendar, Lock, Star, ChevronRight, Loader2 } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Client = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Non destructif : si l’utilisateur clique une carte, on propose juste de se connecter.
  const handleRequireAuth = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-caramel" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <ClientDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-caramel/20 to-background px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-caramel shadow-lg">
            <img src={logo} alt="La Crêperie des Saveurs" className="w-full h-full object-cover" />
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Espace Client</h1>

          <p className="text-muted-foreground max-w-sm mx-auto">
            Retrouvez votre carte fidélité, vos gains (code + QR) et vos réservations.
          </p>

          {/* Microcopy important : compte optionnel, sans casser la logique */}
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-3">
            Le compte est <strong className="text-foreground">optionnel</strong>. Il sert surtout à retrouver vos infos,
            vos points et vos gains après le quiz.
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="px-4 py-8 space-y-4 max-w-md mx-auto">
        {/* Fidélité */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleRequireAuth}
          className="card-warm p-4 w-full text-left flex items-center gap-4 active:scale-[0.99] transition-transform"
          aria-label="Accéder aux points fidélité (connexion requise)"
        >
          <div className="w-12 h-12 rounded-full bg-caramel/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-caramel" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Carte Fidélité</h3>
            <p className="text-sm text-muted-foreground">1 visite = 1 point • 10 points = 1 menu offert</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Les points sont ajoutés après votre passage au restaurant.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Menu secret */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleRequireAuth}
          className="card-warm p-4 w-full text-left flex items-center gap-4 active:scale-[0.99] transition-transform"
          aria-label="Accéder au menu secret (connexion requise)"
        >
          <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-terracotta" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Menu secret (par code)</h3>
            <p className="text-sm text-muted-foreground">Débloqué après le quiz avec le code de la semaine</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Le compte ne débloque pas le menu : c’est le <strong className="text-foreground">code</strong> qui le fait.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Gains */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleRequireAuth}
          className="card-warm p-4 w-full text-left flex items-center gap-4 active:scale-[0.99] transition-transform"
          aria-label="Accéder à l’historique des gains (connexion requise)"
        >
          <div className="w-12 h-12 rounded-full bg-herb/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-herb" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Mes gains (QR + code)</h3>
            <p className="text-sm text-muted-foreground">Retrouvez vos coupons gagnés au quiz</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Après le quiz, connectez-vous pour afficher votre <strong className="text-foreground">QR</strong> en caisse.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* Réservations */}
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleRequireAuth}
          className="card-warm p-4 w-full text-left flex items-center gap-4 active:scale-[0.99] transition-transform"
          aria-label="Accéder aux réservations (connexion requise)"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Réservations</h3>
            <p className="text-sm text-muted-foreground">Gérez vos visites</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Auth Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 pb-8 space-y-3 max-w-md mx-auto"
      >
        <Button className="w-full h-12 text-base" onClick={() => handleOpenAuth("login")}>
          <User className="w-5 h-5 mr-2" />
          Se connecter
        </Button>

        <Button variant="outline" className="w-full h-12 text-base" onClick={() => handleOpenAuth("signup")}>
          Créer un compte
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Astuce : vous pouvez jouer au quiz sans compte. La connexion sert à <strong className="text-foreground">retrouver vos gains</strong>.
        </p>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
};

export default Client;
