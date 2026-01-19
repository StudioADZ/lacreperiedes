import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  QrCode, 
  Loader2, 
  Lock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface PaymentQRPanelProps {
  adminPassword: string;
}

const PaymentQRPanel = ({ adminPassword }: PaymentQRPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [adminPassword]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get',
          adminPassword,
          settingKey: 'payment_qr'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.setting) {
        setIsEnabled(result.setting.is_active);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEnabled = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          adminPassword,
          settingKey: 'payment_qr',
          isActive: !isEnabled
        })
      });

      if (response.ok) {
        setIsEnabled(!isEnabled);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header */}
      <div className="card-warm text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold">Paiement / QR</h2>
        <p className="text-sm text-muted-foreground">
          Fonctionnalité en préparation
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Aucun paiement actif actuellement
        </p>
      </div>

      {/* Status Card */}
      <div className={`card-warm border-2 ${isEnabled ? 'border-herb/30' : 'border-muted'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isEnabled ? 'bg-herb/10' : 'bg-muted'
            }`}>
              {isEnabled ? (
                <QrCode className="w-5 h-5 text-herb" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {isEnabled ? 'Activé' : 'Désactivé'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEnabled ? 'Les clients verront l\'option' : 'Fonctionnalité masquée'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleEnabled}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEnabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Désactiver
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Activer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="card-warm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
              Fonctionnalité en préparation
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Cette option permettra aux clients de payer via QR code depuis leur espace.
              La configuration complète (prestataire de paiement, intégration) sera disponible prochainement.
            </p>
          </div>
        </div>
      </div>

      {/* Future Features Preview */}
      <div className="card-warm opacity-60">
        <h3 className="font-display font-bold flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          Configuration (à venir)
        </h3>
        
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <CreditCard className="w-5 h-5" />
            <span>Choix du prestataire de paiement</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <QrCode className="w-5 h-5" />
            <span>Génération de QR codes personnalisés</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Lock className="w-5 h-5" />
            <span>Paiement sécurisé intégré</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentQRPanel;
