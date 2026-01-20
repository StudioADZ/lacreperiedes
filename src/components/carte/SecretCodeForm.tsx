import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, Sparkles, Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SecretCodeFormProps {
  onSubmit: (code: string) => Promise<boolean>;
  onAdminSubmit?: (password: string) => Promise<boolean>;
  isLoading?: boolean;
}

const SecretCodeForm = ({ onSubmit, onAdminSubmit, isLoading }: SecretCodeFormProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Entrez un code');
      return;
    }

    setSubmitting(true);
    setError('');

    const success = await onSubmit(code.toUpperCase());
    
    if (!success) {
      setError('Code incorrect ou expiré');
    }
    
    setSubmitting(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim() || !onAdminSubmit) return;

    setAdminSubmitting(true);
    setAdminError('');

    const success = await onAdminSubmit(adminPassword);
    
    if (!success) {
      setAdminError('Mot de passe admin incorrect');
    }
    
    setAdminSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full px-4 sm:px-0"
    >
      {/* Main Secret Code Form */}
      <div className="max-w-md mx-auto bg-card/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-border/50 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-caramel/20 to-caramel/5 flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-inner">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-caramel" />
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Menu Secret
        </h2>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-xs mx-auto">
          Entrez le code secret pour découvrir
          <br />
          les créations exclusives de la semaine
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="CODE SECRET"
              className={`
                w-full text-center font-mono text-lg sm:text-xl tracking-[0.2em] 
                py-4 sm:py-5 px-4
                bg-background/80 border-2 
                focus:border-caramel focus:ring-2 focus:ring-caramel/20
                placeholder:text-muted-foreground/50 placeholder:tracking-[0.15em]
                transition-all duration-200
                ${error ? 'border-destructive/70 bg-destructive/5' : 'border-border'}
              `}
              maxLength={20}
              disabled={submitting || isLoading}
              autoComplete="off"
              autoCapitalize="characters"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive/80 text-sm mt-2 font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>

          <Button
            type="submit"
            className="
              w-full py-5 sm:py-6 text-base sm:text-lg font-semibold
              bg-gradient-to-r from-caramel to-caramel-dark 
              hover:from-caramel-dark hover:to-caramel
              text-white shadow-lg shadow-caramel/25
              transition-all duration-300 hover:shadow-xl hover:shadow-caramel/30
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            disabled={submitting || isLoading || !code.trim()}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Débloquer le menu
              </>
            )}
          </Button>
        </form>

        {/* Help Section */}
        <div className="mt-6 sm:mt-8 p-4 rounded-xl bg-secondary/40 border border-border/30">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Gift className="w-4 h-4 text-caramel" />
            <span className="font-medium">Comment obtenir le code ?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Participez au quiz de la crêperie pour débloquer l'accès au menu secret de la semaine !
          </p>
          <a
            href="/quiz"
            className="inline-flex items-center gap-1 mt-3 text-sm text-caramel hover:text-caramel-dark font-medium transition-colors"
          >
            🎮 Jouer au Quiz
          </a>
        </div>
      </div>

      {/* Admin Access Toggle */}
      {onAdminSubmit && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
          >
            <Shield className="w-3 h-3" />
            {showAdminForm ? 'Masquer accès admin' : 'Accès admin'}
          </button>
        </div>
      )}

      {/* Admin Password Form */}
      {showAdminForm && onAdminSubmit && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleAdminSubmit}
          className="card-warm max-w-md mx-auto border-2 border-primary/20 space-y-4"
        >
          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-display font-bold">Accès Admin</h4>
            <p className="text-xs text-muted-foreground">
              Accès permanent sans expiration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword" className="text-sm">
              Mot de passe admin
            </Label>
            <Input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setAdminError('');
              }}
              placeholder="••••••••"
              className={adminError ? 'border-destructive' : ''}
              disabled={adminSubmitting}
            />
            {adminError && (
              <p className="text-xs text-destructive text-center">{adminError}</p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="outline"
            className="w-full"
            disabled={adminSubmitting || !adminPassword.trim()}
          >
            {adminSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Connexion Admin'
            )}
          </Button>
        </motion.form>
      )}
    </motion.div>
  );
};

export default SecretCodeForm;
