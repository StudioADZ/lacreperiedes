import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showLegalFull, setShowLegalFull] = useState(false);

  // Light constants (safe)
  const LIMITS = useMemo(
    () => ({
      firstNameMin: 2,
      phoneMinDigits: 8,
      firstNameMax: 60,
      emailMax: 254,
      phoneMax: 25,
    }),
    []
  );

  const normalize = () => {
    const cleanFirstName = firstName.trim().slice(0, LIMITS.firstNameMax);
    const cleanEmail = email.trim().toLowerCase().slice(0, LIMITS.emailMax);
    const cleanPhone = phone.trim().slice(0, LIMITS.phoneMax);

    // Used only for validation (keeps display unchanged)
    const digitsOnlyPhone = cleanPhone.replace(/[^\d]/g, '');

    return { cleanFirstName, cleanEmail, cleanPhone, digitsOnlyPhone };
  };

  const validate = () => {
    const { cleanFirstName, cleanEmail, cleanPhone, digitsOnlyPhone } = normalize();
    const newErrors: Record<string, string> = {};

    if (!cleanFirstName || cleanFirstName.length < LIMITS.firstNameMin) {
      newErrors.firstName = `Prénom requis (minimum ${LIMITS.firstNameMin} caractères)`;
    }

    if (!cleanEmail) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Email invalide';
    }

    if (!cleanPhone) {
      newErrors.phone = 'Téléphone requis';
    } else if (digitsOnlyPhone.length < LIMITS.phoneMinDigits) {
      newErrors.phone = `Numéro invalide (minimum ${LIMITS.phoneMinDigits} chiffres)`;
    }

    if (!rgpdConsent) {
      newErrors.rgpdConsent = 'Vous devez accepter le règlement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validate()) return;

    const { cleanFirstName, cleanEmail, cleanPhone } = normalize();
    onSubmit({
      firstName: cleanFirstName,
      email: cleanEmail,
      phone: cleanPhone,
      rgpdConsent,
    });
  };

  const clearFieldError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="card-warm text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold mb-2">Validation de votre participation</h2>
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
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError('firstName');
            }}
            placeholder="Votre prénom"
            className={errors.firstName ? 'border-destructive' : ''}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-xs text-destructive">
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            placeholder="votre@email.com"
            className={errors.email ? 'border-destructive' : ''}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={isLoading}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError('phone');
            }}
            placeholder="06 12 34 56 78"
            className={errors.phone ? 'border-destructive' : ''}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            disabled={isLoading}
            inputMode="tel"
            autoComplete="tel"
          />
          {errors.phone && (
            <p id="phone-error" className="text-xs text-destructive">
              {errors.phone}
            </p>
          )}
        </div>

        {/* RGPD */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="rgpd"
              checked={rgpdConsent}
              onCheckedChange={(checked) => {
                // shadcn can be boolean | "indeterminate"
                setRgpdConsent(checked === true);
                clearFieldError('rgpdConsent');
              }}
              className={errors.rgpdConsent ? 'border-destructive' : ''}
              disabled={isLoading}
            />

            <div className="flex-1">
              <Label htmlFor="rgpd" className="text-sm leading-relaxed cursor-pointer">
                J&apos;accepte le{' '}
                <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  règlement du jeu
                </a>{' '}
                et la{' '}
                <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  politique de confidentialité
                </a>
              </Label>

              {/* Optional: scrollable “full text / options” area */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowLegalFull((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showLegalFull ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Réduire le détail
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Voir le détail
                    </>
                  )}
                </button>

                <div
                  className={`mt-2 rounded-xl border border-border bg-secondary/20 p-3 text-xs text-muted-foreground leading-relaxed ${
                    showLegalFull ? 'max-h-40 overflow-auto' : 'max-h-0 overflow-hidden p-0 border-transparent'
                  }`}
                >
                  <p className="mb-2">
                    En participant, vous acceptez que vos informations soient utilisées uniquement pour gérer le jeu
                    (validation, contact gagnant, remise du lot) et conformément à la politique de confidentialité.
                  </p>
                  <p>
                    Vous pouvez demander la suppression de vos données à tout moment via la page Contact.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {errors.rgpdConsent && <p className="text-xs text-destructive">{errors.rgpdConsent}</p>}
        </div>

        {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">{error}</div>}

        <Button type="submit" className="w-full btn-hero text-lg py-6" disabled={isLoading}>
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
