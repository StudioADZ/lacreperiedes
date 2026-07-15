import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setLinkError("Ce lien est invalide ou a expiré. Demandez un nouvel email de réinitialisation.");
      } else {
        setIsReady(true);
      }
    };

    void checkRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsComplete(true);
      window.setTimeout(() => navigate("/client", { replace: true }), 1200);
    } catch (error) {
      console.error("[ResetPassword] password update failed:", error);
      toast.error("Impossible de modifier le mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-butter/35 via-background to-background px-4 pb-24 pt-20">
      <div className="mx-auto max-w-md">
        <Link to="/client" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-caramel hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l’espace client
        </Link>

        <section className="rounded-[2rem] border border-caramel/20 bg-white/80 p-5 shadow-warm backdrop-blur" aria-labelledby="reset-password-title">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
            {isComplete ? <CheckCircle2 className="h-8 w-8" aria-hidden="true" /> : <KeyRound className="h-8 w-8" aria-hidden="true" />}
          </div>

          {isComplete ? (
            <div className="text-center" aria-live="polite">
              <h1 id="reset-password-title" className="font-display text-2xl font-black text-espresso">Mot de passe modifié</h1>
              <p className="mt-3 text-sm text-muted-foreground">Votre compte est sécurisé. Redirection vers votre espace client…</p>
            </div>
          ) : linkError ? (
            <div className="text-center" role="alert">
              <h1 id="reset-password-title" className="font-display text-2xl font-black text-espresso">Lien non valide</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{linkError}</p>
              <Link to="/mot-de-passe-oublie" className="mt-5 block">
                <Button className="h-12 w-full rounded-2xl">Recevoir un nouveau lien</Button>
              </Link>
            </div>
          ) : !isReady ? (
            <div className="py-8 text-center" role="status" aria-live="polite">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-caramel" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">Vérification du lien sécurisé…</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 id="reset-password-title" className="font-display text-2xl font-black text-espresso">Créer un nouveau mot de passe</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Choisissez un mot de passe unique d’au moins 8 caractères.</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      className="h-12 pr-11 text-base"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    className="h-12 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="h-12 w-full rounded-2xl font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "Enregistrer le nouveau mot de passe"}
                </Button>
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-caramel" aria-hidden="true" />
                <p>N’utilisez pas le même mot de passe que sur un autre service.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default ResetPassword;
