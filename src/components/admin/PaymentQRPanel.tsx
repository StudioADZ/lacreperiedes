import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CreditCard, Loader2, Lock, QrCode, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface PaymentQRPanelProps {
  adminPassword: string;
}

const PaymentQRPanel = ({ adminPassword: adminToken }: PaymentQRPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const adminRequest = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Action administrateur impossible");
    return data;
  }, [adminToken]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminRequest({ action: "get_admin_setting", settingKey: "payment_qr" });
      setIsEnabled(Boolean(data.setting?.is_active));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réglage indisponible");
    } finally {
      setIsLoading(false);
    }
  }, [adminRequest]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const toggleEnabled = async () => {
    setIsSaving(true);
    try {
      const data = await adminRequest({
        action: "update_admin_setting",
        settingKey: "payment_qr",
        settingPatch: { is_active: !isEnabled },
      });
      setIsEnabled(Boolean(data.setting?.is_active));
      toast.success(data.setting?.is_active ? "Option activée" : "Option désactivée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Modification impossible");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="sr-only">Chargement des réglages de paiement</span></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="card-warm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"><CreditCard className="h-8 w-8 text-muted-foreground" aria-hidden="true" /></div>
        <h2 className="font-display text-xl font-bold">Paiement / QR</h2>
        <p className="text-sm text-muted-foreground">Fonctionnalité en préparation</p>
      </div>

      <div className={`card-warm border-2 ${isEnabled ? "border-herb/30" : "border-muted"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isEnabled ? "bg-herb/10" : "bg-muted"}`}>
              {isEnabled ? <QrCode className="h-5 w-5 text-herb" aria-hidden="true" /> : <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            </div>
            <div><p className="font-semibold">{isEnabled ? "Activé" : "Désactivé"}</p><p className="text-xs text-muted-foreground">{isEnabled ? "Option visible selon le site public" : "Fonctionnalité masquée"}</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleEnabled} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnabled ? <><ToggleRight className="h-4 w-4" />Désactiver</> : <><ToggleLeft className="h-4 w-4" />Activer</>}
          </Button>
        </div>
      </div>

      <div className="card-warm border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div><p className="text-sm font-semibold text-amber-800">Ne pas activer en production</p><p className="mt-1 text-xs text-amber-700">Aucun prestataire de paiement n’est encore configuré. Le changement passe désormais par la fonction admin sécurisée et est journalisé.</p></div>
        </div>
      </div>

      <div className="card-warm opacity-60">
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold"><Settings className="h-5 w-5" aria-hidden="true" />Configuration à venir</h3>
        <div className="space-y-3 text-sm text-muted-foreground"><div className="rounded-lg bg-muted/30 p-3">Choix du prestataire de paiement</div><div className="rounded-lg bg-muted/30 p-3">Génération de QR codes personnalisés</div><div className="rounded-lg bg-muted/30 p-3">Paiement sécurisé intégré</div></div>
      </div>
    </motion.div>
  );
};

export default PaymentQRPanel;
