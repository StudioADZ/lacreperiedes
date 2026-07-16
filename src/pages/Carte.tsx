import { useEffect, useState } from "react";
import { Calendar, Loader2, Sparkles, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import SocialFooter from "@/components/SocialFooter";
import CartePublicDisplay from "@/components/carte/CartePublicDisplay";
import SecretMenuLocked from "@/components/carte/SecretMenuLocked";
import SecretMenuUnlocked from "@/components/carte/SecretMenuUnlocked";
import { useWeeklyOfferAccess } from "@/hooks/useWeeklyOfferAccess";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode, verifyAdminAccess, isAdminAccess } = useWeeklyOfferAccess();
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();

  const handleUnlock = async (code: string): Promise<boolean> => {
    const success = await verifyCode(code);
    if (success) setJustUnlocked(true);
    return success;
  };

  const handleAdminUnlock = async (password: string): Promise<boolean> => {
    const success = await verifyAdminAccess(password);
    if (success) setJustUnlocked(true);
    return success;
  };

  useEffect(() => {
    const code = searchParams.get("offer");
    if (!code || accessLoading || hasAccess) return;
    void handleUnlock(code).then((success) => {
      if (success) {
        const next = new URLSearchParams(searchParams);
        next.delete("offer");
        setSearchParams(next, { replace: true });
      }
    });
  }, [accessLoading, hasAccess, searchParams]);

  if (accessLoading) {
    return <div className="flex min-h-screen items-center justify-center px-4 pb-24 pt-20" role="status" aria-label="Chargement de la carte"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-background to-butter/20 px-4 pb-32 pt-20">
      <main className="mx-auto max-w-lg">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"><UtensilsCrossed className="h-4 w-4" aria-hidden="true" />Carte artisanale · Mamers</span>
          <h1 className="font-display text-3xl font-black text-espresso">Notre carte</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Parcourez nos formules, galettes, crêpes, salades et boissons, puis découvrez la proposition du moment après votre participation au quiz.</p>
        </motion.header>

        <section className="mb-12" aria-labelledby="carte-publique-title"><h2 id="carte-publique-title" className="sr-only">Carte publique</h2><CartePublicDisplay /></section>

        <div className="relative my-12" aria-hidden="true"><div className="flex items-center gap-4"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-caramel/50 to-caramel" /><div className="flex items-center gap-2 rounded-full border border-caramel/20 bg-caramel/10 px-4 py-2"><Sparkles className="h-4 w-4 text-caramel" /><span className="text-xs font-bold uppercase tracking-[0.16em] text-caramel">Proposition du moment</span></div><div className="h-px flex-1 bg-gradient-to-l from-transparent via-caramel/50 to-caramel" /></div></div>

        <section aria-labelledby="weekly-proposals-title">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-7 text-center">
            <h2 id="weekly-proposals-title" className="font-display text-2xl font-black text-espresso">Proposition du moment</h2>
            <p className="mt-2 text-sm text-muted-foreground">{hasAccess ? "Votre accès personnel est actif." : "Participez au quiz pour recevoir votre code et votre QR personnels."}</p>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            {hasAccess ? (
              <motion.div key="unlocked" initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} className="space-y-6"><SecretMenuUnlocked justUnlocked={justUnlocked} isAdminAccess={isAdminAccess} /><SecretMenuLocked onUnlock={handleUnlock} compact /></motion.div>
            ) : (
              <motion.div key="locked" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}><SecretMenuLocked onUnlock={handleUnlock} onAdminUnlock={handleAdminUnlock} /></motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="mt-12"><SocialFooter /></div>
      </main>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 px-4 pointer-events-none">
        <Link to="/reserver" className="pointer-events-auto mx-auto flex min-h-14 max-w-md items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-[0_18px_45px_rgba(105,62,28,0.32)] transition-transform hover:-translate-y-0.5"><Calendar className="h-5 w-5" />Réserver une table</Link>
      </div>
    </div>
  );
};

export default Carte;
