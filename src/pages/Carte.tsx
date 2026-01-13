import { useState } from 'react';
import { UtensilsCrossed, Flame, Snowflake, Leaf, Lock, Loader2, Star, MessageSquare, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SocialFooter from "@/components/SocialFooter";
import SecretCodeForm from "@/components/carte/SecretCodeForm";
import SecretMenuDisplay from "@/components/carte/SecretMenuDisplay";
import { useSecretAccess } from "@/hooks/useSecretAccess";

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

        {/* Google Rating & Review Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-warm mb-8 text-center"
        >
          {/* Rating Display */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                />
              ))}
            </div>
            <span className="font-bold text-lg">4.8</span>
            <span className="text-sm text-muted-foreground">(127 avis)</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Nos clients adorent La Crêperie des Saveurs !
          </p>

          {/* Review Buttons */}
          <div className="flex gap-3">
            <a
              href="https://g.page/r/CfHqAKfL6g4XEAE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                Voir les avis
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            </a>
            <a
              href="https://g.page/r/CfHqAKfL6g4XEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="default" className="w-full gap-2">
                <MessageSquare className="w-4 h-4" />
                Laisser un avis
              </Button>
            </a>
          </div>
        </motion.div>

        {hasAccess ? (
          /* Unlocked: Show full menu */
          <SecretMenuDisplay />
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
