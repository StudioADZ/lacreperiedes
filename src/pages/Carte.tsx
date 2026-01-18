import { useState } from "react";
import {
  UtensilsCrossed,
  Flame,
  Snowflake,
  Lock,
  Loader2,
  Leaf,
} from "lucide-react";
import { motion } from "framer-motion";
import SocialFooter from "@/components/SocialFooter";
import SecretCodeForm from "@/components/carte/SecretCodeForm";
import SecretMenuDisplay from "@/components/carte/SecretMenuDisplay";
import { useSecretAccess } from "@/hooks/useSecretAccess";
import GoogleReviewCTA from "@/components/common/GoogleReviewCTA";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode, verifyAdminAccess, isAdminAccess } =
    useSecretAccess();

  // (UI only) — si tu veux masquer l’encart “spéciales” verrouillé et ne garder que le formulaire
  const [showLockedPreview, setShowLockedPreview] = useState(true);

  // Loading state
  if (accessLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Menu classique : 3 galettes + 3 crêpes (VISIBLES POUR TOUS)
  // IMPORTANT : ceci est UI-only.
  // Si tu as déjà un composant “Menu classique” connecté à ta DB ailleurs,
  // remplace simplement ce bloc par le composant existant.
  const classicGalettes = [
    { name: "Complète", desc: "Jambon, œuf, fromage", price: "—" },
    { name: "Campagnarde", desc: "Poulet, champignons, crème", price: "—" },
    { name: "Végétarienne", desc: "Légumes de saison, fromage", price: "—" },
  ];

  const classicCrepes = [
    { name: "Sucre", desc: "Simple & efficace", price: "—" },
    { name: "Chocolat", desc: "Chocolat fondant", price: "—" },
    { name: "Caramel beurre salé", desc: "Classique breton", price: "—" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <UtensilsCrossed className="w-4 h-4 inline mr-1" />
            Ma carte
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">La carte</h1>
          <p className="text-muted-foreground">
            Le menu classique est visible pour tous.
            <br />
            Les <strong>spéciales du week-end</strong> se débloquent avec un code.
          </p>
        </div>

        {/* ✅ MENU CLASSIQUE — VISIBLE À TOUS */}
        <section className="mb-8">
          <div className="card-warm">
            <h2 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-herb" />
              Menu classique (sélection)
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              3 galettes + 3 crêpes — visible pour tous.
            </p>

            <div className="space-y-5">
              <div>
                <h3 className="font-semibold mb-3">Galettes</h3>
                <div className="space-y-3">
                  {classicGalettes.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-5">
                <h3 className="font-semibold mb-3">Crêpes</h3>
                <div className="space-y-3">
                  {classicCrepes.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-5">
              ℹ️ Les prix/recettes exactes peuvent varier selon la semaine.
            </p>
          </div>
        </section>

        {/* ✅ SPÉCIALES DU WEEK-END — SEULE SECTION VERROUILLÉE */}
        <section className="mb-8">
          <div className="card-warm">
            <h2 className="font-display text-xl font-bold mb-2 flex items-center gap-2">
              <Flame className="w-5 h-5 text-terracotta" />
              Spéciales du week-end
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              1 galette exclusive + 1 crêpe exclusive.
              <br />
              Débloquez-les avec un code (obtenu via le quiz).
            </p>

            {hasAccess ? (
              <>
                {/* Débloqué : on affiche le menu secret existant */}
                <SecretMenuDisplay />

                {/* CTA avis (après) */}
                <GoogleReviewCTA variant="card" className="mt-8" />
              </>
            ) : (
              <>
                {/* Verrouillé : on montre juste 2 cartes “lockées” (pas tout le menu) */}
                {showLockedPreview && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                    <div className="grid gap-4">
                      <div className="relative overflow-hidden rounded-2xl border border-border/60 p-5 bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-caramel" />
                          <p className="font-semibold">Galette spéciale (verrouillée)</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Entrez le code pour voir la recette et le prix.
                        </p>
                      </div>

                      <div className="relative overflow-hidden rounded-2xl border border-border/60 p-5 bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-caramel" />
                          <p className="font-semibold">Crêpe spéciale (verrouillée)</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Entrez le code pour voir la recette et le prix.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Formulaire code */}
                <SecretCodeForm onSubmit={verifyCode} onAdminSubmit={verifyAdminAccess} isLoading={false} />
              </>
            )}
          </div>
        </section>

        {/* Admin indicator */}
        {isAdminAccess && (
          <div className="mt-4 p-2 rounded-lg bg-primary/10 text-center">
            <p className="text-xs text-primary font-medium">🔓 Accès Admin actif (permanent)</p>
          </div>
        )}

        <SocialFooter />
      </div>
    </div>
  );
};

export default Carte;
