import { motion } from 'framer-motion';
import { Shield, FileText, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface RGPDConsentBannerProps {
  onAccept: () => void;
  context?: 'quiz' | 'form' | 'general';
}

const RGPDConsentBanner = ({ onAccept, context = 'general' }: RGPDConsentBannerProps) => {
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const canAccept = privacyChecked && termsChecked;

  const contextMessages = {
    quiz: {
      title: '🎮 Avant de jouer',
      subtitle: 'Votre consentement est requis pour participer au quiz',
    },
    form: {
      title: '📝 Avant de continuer',
      subtitle: 'Votre consentement est requis pour soumettre ce formulaire',
    },
    general: {
      title: '🔒 Protection de vos données',
      subtitle: 'Votre consentement est requis pour continuer',
    },
  };

  const message = contextMessages[context];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-warm border-2 border-primary/30 bg-gradient-to-br from-butter/50 to-ivory"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">{message.title}</h2>
        <p className="text-sm text-muted-foreground">{message.subtitle}</p>
      </div>

      {/* Consent Items */}
      <div className="space-y-4 mb-6">
        {/* Privacy Policy */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50 cursor-pointer hover:bg-background/80 transition-colors">
          <Checkbox
            checked={privacyChecked}
            onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Politique de confidentialité</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              J'accepte la{' '}
              <Link 
                to="/legal#privacy" 
                className="text-primary underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                politique de confidentialité
              </Link>
              {' '}et le traitement de mes données personnelles.
            </p>
          </div>
        </label>

        {/* Terms of Use */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50 cursor-pointer hover:bg-background/80 transition-colors">
          <Checkbox
            checked={termsChecked}
            onCheckedChange={(checked) => setTermsChecked(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Conditions d'utilisation</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              J'accepte les{' '}
              <Link 
                to="/legal#terms" 
                className="text-primary underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                conditions générales d'utilisation
              </Link>
              {' '}du site et du quiz.
            </p>
          </div>
        </label>
      </div>

      {/* RGPD Info */}
      <div className="p-3 rounded-xl bg-herb/5 border border-herb/20 mb-6">
        <p className="text-xs text-herb">
          <strong>🇪🇺 Conformité RGPD :</strong> Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers. Vous pouvez demander leur suppression à tout moment.
        </p>
      </div>

      {/* Accept Button */}
      <Button
        onClick={onAccept}
        disabled={!canAccept}
        className="w-full btn-hero py-6 text-lg"
      >
        {canAccept ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            J'accepte et je continue
          </>
        ) : (
          'Veuillez accepter les conditions'
        )}
      </Button>

      {/* Additional info */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        En continuant, vous confirmez avoir plus de 16 ans.
      </p>
    </motion.div>
  );
};

export default RGPDConsentBanner;
