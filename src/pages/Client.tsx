import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import ClientDashboardPremium from "@/components/client/ClientDashboardPremium";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import logo from "@/assets/logo.png";

const BENEFITS = [
  {
    icon: Star,
    title: "Fidélité",
    text: "Suivez l’avancement de votre carte et retrouvez vos avantages rattachés au compte.",
    tone: "bg-caramel/15 text-caramel",
  },
  {
    icon: Lock,
    title: "Carte secrète",
    text: "Conservez votre accès aux créations exclusives débloquées grâce au quiz.",
    tone: "bg-terracotta/15 text-terracotta",
  },
  {
    icon: Gift,
    title: "Gains et récompenses",
    text: "Retrouvez vos codes, lots et récompenses encore disponibles.",
    tone: "bg-herb/15 text-herb",
  },
  {
    icon: Calendar,
    title: "Préparer votre prochaine visite",
    text: "Accédez rapidement à la réservation depuis votre espace client.",
    tone: "bg-primary/10 text-primary",
  },
];

const Client = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const prefersReducedMotion = useReducedMotion();

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-caramel" aria-hidden="true" />
        <span className="sr-only">Chargement de votre espace client</span>
      </div>
    );
  }

  if (isAuthenticated) return <ClientDashboardPremium />;

  return (
    <main className="min-h-screen bg-gradient-to-b from-butter/35 via-background to-background pb-24">
      <section className="relative overflow-hidden px-4 pb-8 pt-24 text-center" aria-labelledby="client-title">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-caramel/20 to-transparent" aria-hidden="true" />
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto max-w-md"
        >
          <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border-4 border-ivory shadow-elevated ring-2 ring-caramel/30">
            <img src={logo} alt="" aria-hidden="true" className="h-full w-full object-cover" width={96} height={96} />
          </div>
          <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-caramel/20 bg-white/65 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-caramel shadow-sm">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Espace personnel sécurisé
          </p>
          <h1 id="client-title" className="font-display text-3xl font-black text-espresso sm:text-4xl">
            Votre espace client
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
            Centralisez vos récompenses, votre fidélité et vos accès exclusifs dans un seul endroit.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-md px-4" aria-labelledby="client-benefits-title">
        <h2 id="client-benefits-title" className="sr-only">Avantages de l’espace client</h2>
        <div className="grid gap-3">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.article
                key={benefit.title}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.06 }}
                className="flex items-start gap-4 rounded-[1.4rem] border border-caramel/15 bg-white/75 p-4 shadow-sm backdrop-blur"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${benefit.tone}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-espresso">{benefit.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
                </div>
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-herb" aria-hidden="true" />
              </motion.article>
            );
          })}
        </div>
      </section>

      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
        className="mx-auto mt-7 max-w-md space-y-3 px-4"
        aria-label="Connexion à l’espace client"
      >
        <Button className="h-13 w-full rounded-2xl text-base font-bold shadow-warm" onClick={() => handleOpenAuth("login")}>
          <User className="mr-2 h-5 w-5" aria-hidden="true" />
          Se connecter
        </Button>
        <Button variant="outline" className="h-13 w-full rounded-2xl bg-white/70 text-base font-bold" onClick={() => handleOpenAuth("signup")}>
          Créer mon espace client
        </Button>
        <Link
          to="/mot-de-passe-oublie"
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-caramel transition-colors hover:bg-caramel/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Mot de passe oublié ?
        </Link>
        <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">
          La création du compte est gratuite. Vos informations restent liées à votre expérience avec La Crêperie des Saveurs.
        </p>
      </motion.section>

      <section className="mx-auto mt-8 max-w-md px-4">
        <Link
          to="/reserver"
          className="group flex min-h-14 items-center gap-3 rounded-2xl border border-caramel/20 bg-butter/35 px-4 py-3 text-espresso transition-colors hover:bg-butter/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Calendar className="h-5 w-5 text-caramel" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Réserver sans créer de compte</span>
            <span className="block text-xs text-muted-foreground">La réservation reste accessible à tous.</span>
          </span>
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </section>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode={authMode} />
    </main>
  );
};

export default Client;
