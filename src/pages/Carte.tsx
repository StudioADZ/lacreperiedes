import { useState } from "react";
import { UtensilsCrossed, Lock, Loader2 } from "lucide-react";
import SocialFooter from "@/components/SocialFooter";
import SecretCodeForm from "@/components/carte/SecretCodeForm";
import SecretMenuDisplay from "@/components/carte/SecretMenuDisplay";
import { useSecretAccess } from "@/hooks/useSecretAccess";
import GoogleReviewCTA from "@/components/common/GoogleReviewCTA";

// ✅ A REMPLACER par TON composant existant de carte publique
// ex: import MenuPublic from "@/components/carte/MenuPublic";
import PublicMenuDisplay from "@/components/carte/PublicMenuDisplay";

const Carte = () => {
  const { hasAccess, isLoading: accessLoading, verifyCode } = useSecretAccess();
  const [submitting, setSubmitting] = useState(false);

  const handleVerifyCode = async (code: string) => {
    try {
      setSubmitting(true);
      await verifyCode(code);
    } finally {
      setSubmitting(false);
    }
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">La Carte</h1>
          <p className="text-muted-foreground">
            Découvrez notre carte… et débloquez le Menu Secret si vous avez le code.
          </p>
        </div>

        {/* ✅ 1) CARTE PUBLIQUE — TOUJOURS VISIBLE */}
        <div className="mb-10">
          <PublicMenuDisplay />
          {/* ou ton composant existant: <MenuPublic /> */}
        </div>

        {/* ✅ 2) MENU SECRET — SEULEMENT ICI */}
        <div className="mb-6">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <UtensilsCrossed className="w-4 h-4" />
              Menu Secret
            </span>
          </div>

          {hasAccess ? (
            <>
              <SecretMenuDisplay />
              <GoogleReviewCTA variant="card" className="mt-8" />
            </>
          ) : (
            <>
              <div className="card-warm mb-6 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-caramel" />
                </div>
                <p className="font-display font-bold text-lg">Menu Secret verrouillé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Entrez le code obtenu après le quiz pour accéder aux créations exclusives de la semaine.
                </p>
              </div>

              {/* ✅ Pas d'admin sur cette page */}
              <SecretCodeForm onSubmit={handleVerifyCode} isLoading={submitting} />
            </>
          )}
        </div>

        <SocialFooter />
      </div>
    </div>
  );
};

export default Carte;
