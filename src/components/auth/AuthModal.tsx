import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.37 1.43c0 1.14-.43 2.18-1.13 2.98-.77.88-2.03 1.55-3.09 1.46-.14-1.09.39-2.25 1.1-3.03.78-.86 2.11-1.52 3.12-1.41ZM20.45 17.37c-.57 1.31-.84 1.9-1.57 3.06-1.02 1.57-2.46 3.53-4.24 3.55-1.58.02-1.99-1.03-4.14-1.01-2.15.01-2.6 1.03-4.18 1.01-1.78-.02-3.14-1.78-4.16-3.35C-.7 16.23-.99 11.08.93 8.12c1.36-2.1 3.52-3.34 5.55-3.34 2.06 0 3.36 1.05 5.06 1.05 1.65 0 2.66-1.05 5.04-1.05 1.8 0 3.71.98 5.06 2.67-4.44 2.44-3.72 8.77.81 9.92Z"
    />
  </svg>
);

const getAuthErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const AuthModal = ({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();

  useEffect(() => {
    if (isOpen) setMode(defaultMode);
  }, [defaultMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, firstName.trim());
        toast.success("Compte créé ! Bienvenue 🎉");
      } else {
        await signIn(email.trim(), password);
        toast.success("Connexion réussie ! 👋");
      }
      onClose();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Une erreur est survenue"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading("google");
    try {
      await signInWithGoogle();
    } catch (error) {
      setOauthLoading(null);
      toast.error(getAuthErrorMessage(error, "Erreur de connexion Google"));
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading("apple");
    try {
      await signInWithApple();
    } catch (error) {
      setOauthLoading(null);
      toast.error(getAuthErrorMessage(error, "Erreur de connexion Apple"));
    }
  };

  if (!isOpen) return null;

  const disabled = isLoading || oauthLoading !== null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 12 }}
          className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-2xl [-webkit-overflow-scrolling:touch]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="relative bg-gradient-to-r from-caramel/20 to-terracotta/20 p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="auth-modal-title" className="font-display text-2xl font-bold">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Accédez à votre espace client"
                : "Rejoignez la communauté"}
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3"
                onClick={handleGoogleSignIn}
                disabled={disabled}
              >
                {oauthLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continuer avec Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-3 bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                onClick={handleAppleSignIn}
                disabled={disabled}
              >
                {oauthLoading === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
                Continuer avec Apple
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Votre prénom"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 pl-10 text-base"
                      autoComplete="given-name"
                      required
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 text-base"
                    autoComplete="email"
                    inputMode="email"
                    required
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 text-base"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    disabled={disabled}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={disabled}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "login" ? (
                  "Se connecter"
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-caramel hover:underline"
                    disabled={disabled}
                  >
                    S'inscrire
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-caramel hover:underline"
                    disabled={disabled}
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
