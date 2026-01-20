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
      className="space-y-4"
    >
      {/* Main Secret Code Form */}
      <div className="card-warm max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-caramel" />
        </div>

        <h2 className="font-display text-2xl font-bold mb-2">Menu Secret</h2>
        <p className="text-muted-foreground mb-6">
          Entrez le code secret pour découvrir les créations exclusives de la semaine
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="CODE SECRET"
              className={`text-center font-mono text-xl tracking-widest py-6 ${
                error ? 'border-destructive' : ''
              }`}
              maxLength={20}
              disabled={submitting || isLoading}
            />
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-hero py-6"
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

        <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Gift className="w-4 h-4" />
            <span className="font-medium">Comment obtenir le code ?</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Participez au quiz de la crêperie pour débloquer l'accès au menu secret de la semaine !
          </p>
          <a
            href="/quiz"
            className="inline-block mt-3 text-sm text-primary hover:underline font-medium"
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
