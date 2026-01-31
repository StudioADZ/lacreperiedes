import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface QuizFormProps {
  onSubmit: (data: { firstName: string; email: string; phone: string; rgpdConsent: boolean }) => void;
  isLoading: boolean;
  error?: string;
}

const QuizForm = ({ onSubmit, isLoading, error }: QuizFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'Prénom requis (minimum 2 caractères)';
    }

    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Téléphone requis';
    } else if (phone.replace(/\s/g, '').length < 8) {
      newErrors.phone = 'Numéro invalide (minimum 8 chiffres)';
    }

    if (!rgpdConsent) {
      newErrors.rgpdConsent = 'Vous devez accepter le règlement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ firstName, email, phone, rgpdConsent });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="card-warm text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Validation de votre participation
        </h2>
        <p className="text-muted-foreground">
          Renseignez vos coordonnées pour valider votre participation au tirage de la semaine
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-warm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Votre prénom"
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="rgpd"
              checked={rgpdConsent}
              onCheckedChange={(checked) => setRgpdConsent(checked as boolean)}
              className={errors.rgpdConsent ? 'border-destructive' : ''}
            />
            <Label htmlFor="rgpd" className="text-sm leading-relaxed cursor-pointer">
              J'accepte le{' '}
              <a href="/legal" target="_blank" className="text-primary underline">
                règlement du jeu
              </a>{' '}
              et la{' '}
              <a href="/legal" target="_blank" className="text-primary underline">
                politique de confidentialité
              </a>
            </Label>
          </div>
          {errors.rgpdConsent && (
            <p className="text-xs text-destructive">{errors.rgpdConsent}</p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full btn-hero text-lg py-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Validation...
            </>
          ) : (
            'Valider ma participation'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          * Champs obligatoires – 1 participation gagnante max par semaine
        </p>
      </form>
    </motion.div>
  );
};

export default QuizForm;