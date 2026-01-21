import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Loader2, AlertCircle, KeyRound, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SecretMenuLockedProps {
  onUnlock: (code: string) => Promise<boolean>;
  onAdminUnlock?: (password: string) => Promise<boolean>;
}

const SecretMenuLocked = ({ onUnlock, onAdminUnlock }: SecretMenuLockedProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = showAdminMode && onAdminUnlock 
        ? await onAdminUnlock(code.trim())
        : await onUnlock(code.trim().toUpperCase());

      if (!success) {
        setError(showAdminMode ? 'Mot de passe admin invalide' : 'Code invalide ou expiré');
        setShakeKey(prev => prev + 1); // Trigger shake animation
      }
    } catch (err) {
      setError('Erreur de connexion');
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      {/* Mysterious blurred preview effect */}
      <div className="relative mb-8">
        {/* Fake menu items - blurred */}
        <div className="filter blur-md opacity-40 pointer-events-none space-y-4">
          <div className="card-warm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-caramel/30" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
            <div className="h-5 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-4 bg-caramel/30 rounded w-16 mt-3" />
          </div>
          <div className="card-warm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-terracotta/30" />
              <div className="h-4 bg-muted rounded w-28" />
            </div>
            <div className="h-5 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-4 bg-terracotta/30 rounded w-16 mt-3" />
          </div>
        </div>

        {/* Lock overlay with glassmorphism */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="bg-background/80 backdrop-blur-md rounded-3xl p-8 border-2 border-caramel/20 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            {/* Animated lock icon */}
            <motion.div 
              className="w-20 h-20 rounded-full bg-gradient-to-br from-caramel/20 to-butter/30 flex items-center justify-center mx-auto mb-4 shadow-lg"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(193, 154, 107, 0.3)',
                  '0 0 40px rgba(193, 154, 107, 0.5)',
                  '0 0 20px rgba(193, 154, 107, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-10 h-10 text-caramel" />
            </motion.div>
            
            <h3 className="font-display text-xl font-bold text-center mb-1">
              Menu Verrouillé
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Créations exclusives réservées aux initiés
            </p>
          </motion.div>
        </div>
      </div>

      {/* Code input section */}
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="card-warm p-6 border-2 border-caramel/20 bg-gradient-to-b from-background to-caramel/5"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-caramel/10 mb-3">
            <KeyRound className="w-6 h-6 text-caramel" />
          </div>
          <h4 className="font-display font-bold text-lg">
            {showAdminMode ? 'Accès Admin' : 'Débloquer le Menu Secret'}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {showAdminMode 
              ? 'Entrez votre mot de passe administrateur'
              : 'Entrez le code du jour pour accéder aux créations exclusives'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(showAdminMode ? e.target.value : e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder={showAdminMode ? "Mot de passe admin" : "CODE DU JOUR"}
              className="text-center text-xl font-mono tracking-[0.3em] h-14 uppercase bg-background/50 border-2 border-caramel/30 focus:border-caramel transition-colors"
              autoComplete="off"
              autoCapitalize="characters"
              disabled={isLoading}
            />
            {code.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Sparkles className="w-5 h-5 text-caramel animate-pulse" />
              </motion.div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-caramel via-caramel-dark to-caramel hover:from-caramel-dark hover:via-caramel hover:to-caramel-dark text-white shadow-xl transition-all duration-300 hover:shadow-caramel/30 hover:scale-[1.02]"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Unlock className="w-5 h-5 mr-2" />
                Débloquer
              </>
            )}
          </Button>
        </form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin toggle */}
        {onAdminUnlock && (
          <button
            type="button"
            onClick={() => {
              setShowAdminMode(!showAdminMode);
              setCode('');
              setError(null);
            }}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-caramel transition-colors py-2"
          >
            {showAdminMode ? '← Retour au code secret' : 'Accès administrateur'}
          </button>
        )}
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-muted-foreground mt-6"
      >
        💡 Le code change chaque jour et est donné aux gagnants du quiz
      </motion.p>
    </motion.div>
  );
};

export default SecretMenuLocked;
