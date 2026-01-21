import { useState } from "react";
import { UtensilsCrossed, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SocialFooter from "@/components/SocialFooter";
import CartePublicDisplay from "@/components/carte/CartePublicDisplay";
import SecretMenuLocked from "@/components/carte/SecretMenuLocked";
import SecretMenuUnlocked from "@/components/carte/SecretMenuUnlocked";
import { useSecretAccess } from "@/hooks/useSecretAccess";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode, verifyAdminAccess, isAdminAccess } = useSecretAccess();
  const [justUnlocked, setJustUnlocked] = useState(false);

  const handleUnlock = async (code: string): Promise<boolean> => {
    const success = await verifyCode(code);
    if (success) {
      setJustUnlocked(true);
    }
    return success;
  };

  const handleAdminUnlock = async (password: string): Promise<boolean> => {
    const success = await verifyAdminAccess(password);
    if (success) {
      setJustUnlocked(true);
    }
    return success;
  };

  if (accessLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: CARTE PUBLIQUE
            Visible par tous - Les créations classiques
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <UtensilsCrossed className="w-4 h-4 inline mr-1" />
              La Crêperie des Saveurs
            </span>
            <h1 className="font-display text-3xl font-bold mb-3">
              Notre Carte
            </h1>
            <p className="text-muted-foreground">
              Découvrez nos créations artisanales
            </p>
          </motion.div>

          {/* Public Menu Items */}
          <CartePublicDisplay />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SÉPARATEUR VISUEL
            Transition claire entre les deux sections
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="relative my-12"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-caramel/50 to-caramel" />
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-caramel/10 border border-caramel/20"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(193, 154, 107, 0.2)',
                  '0 0 15px 3px rgba(193, 154, 107, 0.3)',
                  '0 0 0 0 rgba(193, 154, 107, 0.2)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-caramel" />
              <span className="text-xs font-medium text-caramel">EXCLUSIF</span>
              <Sparkles className="w-4 h-4 text-caramel" />
            </motion.div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-caramel/50 to-caramel" />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: MENU SECRET
            Verrouillé par défaut - Effet WOW au déverrouillage
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-caramel/20 to-butter/20 text-caramel rounded-full text-sm font-medium mb-4 border border-caramel/20">
              ✨ Menu Secret ✨
            </span>
            <h2 className="font-display text-2xl font-bold mb-2">
              Créations Exclusives
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasAccess 
                ? "Bienvenue parmi les initiés !" 
                : "Réservé aux participants du quiz"
              }
            </p>
          </motion.div>

          {/* Secret Menu Content - Locked or Unlocked */}
          <AnimatePresence mode="wait">
            {hasAccess ? (
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <SecretMenuUnlocked 
                  justUnlocked={justUnlocked} 
                  isAdminAccess={isAdminAccess}
                />
              </motion.div>
            ) : (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SecretMenuLocked 
                  onUnlock={handleUnlock}
                  onAdminUnlock={handleAdminUnlock}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer */}
        <div className="mt-12">
          <SocialFooter />
        </div>
      </div>
    </div>
  );
};

export default Carte;
