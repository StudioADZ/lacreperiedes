import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
      });
      if (error) throw error;
      setSentTo(normalizedEmail);
    } catch (error) {
      console.error("[ForgotPassword] reset email failed:", error);
      toast.error("Impossible d’envoyer l’email pour le moment");
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

        <section className="rounded-[2rem] border border-caramel/20 bg-white/80 p-5 shadow-warm backdrop-blur" aria-labelledby="forgot-password-title">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
            {sentTo ? <CheckCircle2 className="h-8 w-8" aria-hidden="true" /> : <KeyRound className="h-8 w-8" aria-hidden="true" />}
          </div>

          {sentTo ? (
            <div className="text-center" aria-live="polite">
              <h1 id="forgot-password-title" className="font-display text-2xl font-black text-espresso">Email envoyé</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Consultez la boîte de réception de <strong className="text-foreground">{sentTo}</strong>, puis ouvrez le lien reçu pour choisir un nouveau mot de passe.
              </p>
              <div className="mt-5 rounded-2xl border border-caramel/20 bg-butter/30 p-4 text-left text-sm text-muted-foreground">
                Vérifiez aussi les dossiers Spam, Indésirables ou Promotions. Le lien est personnel et temporaire.
              </div>
              <Button className="mt-5 h-12 w-full rounded-2xl" onClick={() => setSentTo(null)}>
                Renvoyer un email
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 id="forgot-password-title" className="font-display text-2xl font-black text-espresso">Mot de passe oublié</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Saisissez l’adresse email de votre compte. Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="votre@email.com"
                      autoComplete="email"
                      inputMode="email"
                      className="h-12 pl-10 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-2xl font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "Recevoir le lien sécurisé"}
                </Button>
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-caramel" aria-hidden="true" />
                <p>Pour votre sécurité, le message affiché reste identique même si aucun compte ne correspond à l’adresse saisie.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;
