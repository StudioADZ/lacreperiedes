import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SecretCodeInputProps {
  onSubmit: (code: string) => Promise<boolean>;
  onAdminSubmit?: (adminPassword: string) => Promise<boolean>;
}

const SecretCodeInput = ({ onSubmit, onAdminSubmit }: SecretCodeInputProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminMode, setShowAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = showAdminMode && onAdminSubmit 
        ? await onAdminSubmit(code.trim())
        : await onSubmit(code.trim().toUpperCase());

      if (!success) {
        setError(showAdminMode ? 'Mot de passe admin invalide' : 'Code invalide ou expiré');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="card-warm p-6 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-caramel" />
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold mb-2">
          Menu Secret
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Entrez le code secret pour découvrir<br />
          les créations exclusives de la semaine
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder={showAdminMode ? "MOT DE PASSE ADMIN" : "CODE SECRET"}
            className="text-center text-lg font-mono tracking-widest h-14 uppercase"
            autoComplete="off"
            autoCapitalize="characters"
            disabled={isLoading}
          />

          <Button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-caramel to-caramel-dark hover:from-caramel-dark hover:to-caramel text-white shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Débloquer le menu
              </>
            )}
          </Button>
        </form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin toggle */}
        {onAdminSubmit && (
          <button
            type="button"
            onClick={() => {
              setShowAdminMode(!showAdminMode);
              setCode('');
              setError(null);
            }}
            className="mt-4 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {showAdminMode ? '← Retour au code secret' : 'Accès admin'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SecretCodeInput;
