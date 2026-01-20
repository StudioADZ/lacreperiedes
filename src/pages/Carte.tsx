import { UtensilsCrossed, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SocialFooter from "@/components/SocialFooter";
import SecretCodeInput from "@/components/carte/SecretCodeInput";
import SecretMenuDisplay from "@/components/carte/SecretMenuDisplay";
import CartePublicDisplay from "@/components/carte/CartePublicDisplay";
import { useSecretAccess } from "@/hooks/useSecretAccess";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode, verifyAdminAccess, isAdminAccess } = useSecretAccess();

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
        {/* Header */}
        <div className="text-center mb-10">
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
        </div>

        {/* Public Menu Section */}
        <CartePublicDisplay />

        {/* Separator */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <Lock className="w-5 h-5 text-caramel" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Secret Menu Section */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1.5 bg-caramel/10 text-caramel rounded-full text-sm font-medium mb-4">
            ✨ Menu Secret
          </span>
          <p className="text-sm text-muted-foreground">
            Créations exclusives réservées aux initiés
          </p>
        </div>

        {hasAccess ? (
          <SecretMenuDisplay />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {/* Blurred Preview */}
            <div className="filter blur-sm opacity-50 pointer-events-none mb-6">
              <div className="card-warm p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-caramel" />
                </div>
                <p className="font-display font-bold text-lg">Menu verrouillé</p>
                <p className="text-sm text-muted-foreground">Entrez le code du jour</p>
              </div>
            </div>
          </motion.div>
        )}

        {!hasAccess && (
          <SecretCodeInput 
            onSubmit={verifyCode}
            onAdminSubmit={verifyAdminAccess}
          />
        )}

        {isAdminAccess && (
          <div className="mt-4 p-2 rounded-lg bg-primary/10 text-center">
            <p className="text-xs text-primary font-medium">
              🔓 Accès Admin actif (permanent)
            </p>
          </div>
        )}

        <SocialFooter />
      </div>
    </div>
  );
};

export default Carte;
