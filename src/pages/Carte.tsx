import { useState } from 'react';
import { UtensilsCrossed, Flame, Snowflake, Leaf, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import SocialFooter from "@/components/SocialFooter";
import SecretCodeForm from "@/components/carte/SecretCodeForm";
import SecretMenuDisplay from "@/components/carte/SecretMenuDisplay";
import { useSecretAccess } from "@/hooks/useSecretAccess";
import GoogleReviewCTA from "@/components/common/GoogleReviewCTA";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode } = useSecretAccess();
  const [showBlurredPreview, setShowBlurredPreview] = useState(true);

  // Loading state
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
        {/* Header - always visible */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <UtensilsCrossed className="w-4 h-4 inline mr-1" />
            Menu Secret
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">
            La Carte Secrète
          </h1>
          <p className="text-muted-foreground">
            Créations exclusives réservées aux initiés
          </p>
        </div>

        {hasAccess ? (
          /* Unlocked: Show full menu */
          <>
            <SecretMenuDisplay />
            
            {/* Google Review CTA after menu */}
            <GoogleReviewCTA variant="card" className="mt-8" />
          </>
        ) : (
          /* Locked: Show blurred preview + code form */
          <>
            {/* Blurred Preview */}
            {showBlurredPreview && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative mb-8"
              >
                {/* Blurred fake content */}
                <div className="filter blur-sm opacity-50 pointer-events-none">
                  <div className="card-warm mb-4 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-5 h-5 text-terracotta" />
                      <span className="font-semibold">Galette Mystère</span>
                    </div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  
                  <div className="card-warm mb-4 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Snowflake className="w-5 h-5 text-caramel" />
                      <span className="font-semibold">Crêpe Secrète</span>
                    </div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="card-warm p-4">
                      <div className="h-16 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                    <div className="card-warm p-4">
                      <div className="h-16 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-caramel" />
                    </div>
                    <p className="font-display font-bold text-lg">Contenu verrouillé</p>
                    <p className="text-sm text-muted-foreground">Entrez le code secret ci-dessous</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Code Entry Form */}
            <SecretCodeForm 
              onSubmit={verifyCode}
              isLoading={false}
            />
          </>
        )}

        <SocialFooter />
      </div>
    </div>
  );
};

export default Carte;
