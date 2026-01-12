import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SecretCodeFormProps {
  onSubmit: (code: string) => Promise<boolean>;
  isLoading?: boolean;
}

const SecretCodeForm = ({ onSubmit, isLoading }: SecretCodeFormProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-warm max-w-md mx-auto text-center"
    >
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
    </motion.div>
  );
};

export default SecretCodeForm;
