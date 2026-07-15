import { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, MessageSquare, MousePointer, Save, Sparkles, Type } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SplashSettings {
  id: string;
  event_title: string;
  event_subtitle: string;
  game_line: string;
  cta_text: string;
  background_image_url: string | null;
}

const EVENT_PRESETS = [
  { title: "🎉 Quiz & Récompenses", gameLine: "Jeu & récompenses en cours" },
  { title: "🎄 Noël à la Crêperie", gameLine: "Magie de Noël en cours" },
  { title: "👑 La Crêpe des Rois", gameLine: "Épiphanie gourmande" },
  { title: "❤️ Saint-Valentin Gourmande", gameLine: "L'amour se déguste" },
  { title: "🐰 Pâques Gourmand", gameLine: "Chasse aux douceurs" },
  { title: "🌸 Printemps Gourmand", gameLine: "Fraîcheur de saison" },
  { title: "☀️ Été Breton", gameLine: "Saveurs estivales" },
  { title: "🍂 Automne Gourmand", gameLine: "Réconfort de saison" },
];

const SplashSettingsPanel = ({ adminPassword: _adminToken }: { adminPassword: string }) => {
  const [settings, setSettings] = useState<SplashSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("splash_settings")
        .select("id, event_title, event_subtitle, game_line, cta_text, background_image_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) toast.error("Impossible de charger le splash screen");
      setSettings(data as SplashSettings | null);
      setLoading(false);
    };
    void load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("splash_settings")
      .update({
        event_title: settings.event_title.trim(),
        event_subtitle: settings.event_subtitle.trim(),
        game_line: settings.game_line.trim(),
        cta_text: settings.cta_text.trim(),
        background_image_url: settings.background_image_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) toast.error("Sauvegarde refusée ou impossible");
    else toast.success("Splash screen mis à jour");
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="sr-only">Chargement du splash screen</span></div>;
  }

  if (!settings) {
    return <div className="rounded-2xl border border-border/60 bg-background/60 p-8 text-center text-muted-foreground">Aucun paramètre actif trouvé.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-caramel/20 bg-gradient-to-r from-caramel/10 via-butter/20 to-caramel/10 p-4 text-center">
        <h2 className="flex items-center justify-center gap-2 font-display text-xl font-bold"><Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />Splash screen</h2>
        <p className="mt-1 text-sm text-muted-foreground">Modification réservée aux comptes administrateurs authentifiés.</p>
      </div>

      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Thèmes prédéfinis</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_PRESETS.map((preset) => (
            <button key={preset.title} type="button" onClick={() => setSettings({ ...settings, event_title: preset.title, game_line: preset.gameLine })} className={`rounded-xl border-2 p-3 text-left text-sm ${settings.event_title === preset.title ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="font-medium">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      <Field icon={Type} label="Titre de l'événement">
        <Input value={settings.event_title} onChange={(event) => setSettings({ ...settings, event_title: event.target.value })} maxLength={100} />
      </Field>

      <Field icon={MessageSquare} label="Sous-titre">
        <Input value={settings.event_subtitle} onChange={(event) => setSettings({ ...settings, event_subtitle: event.target.value })} maxLength={180} />
      </Field>

      <Field icon={Sparkles} label="Ligne d'accroche">
        <Input value={settings.game_line} onChange={(event) => setSettings({ ...settings, game_line: event.target.value })} maxLength={120} />
      </Field>

      <Field icon={MousePointer} label="Texte du bouton">
        <Input value={settings.cta_text} onChange={(event) => setSettings({ ...settings, cta_text: event.target.value })} maxLength={60} />
      </Field>

      <Field icon={ImageIcon} label="Image de fond (URL)">
        <Input type="url" value={settings.background_image_url || ""} onChange={(event) => setSettings({ ...settings, background_image_url: event.target.value || null })} placeholder="https://…" />
      </Field>

      <div className="card-glow">
        <Label className="mb-3 block font-semibold">Aperçu</Label>
        <div className="relative flex aspect-[9/16] max-h-[320px] flex-col items-center justify-center overflow-hidden rounded-xl p-4 text-center" style={{ background: settings.background_image_url ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url(${settings.background_image_url}) center/cover` : "linear-gradient(180deg,hsl(40 33% 96%),hsl(35 45% 90%))" }}>
          <h3 className={`font-display text-lg font-semibold ${settings.background_image_url ? "text-white" : "text-espresso"}`}>{settings.event_title}</h3>
          <p className={`mt-1 text-sm ${settings.background_image_url ? "text-white/80" : "text-muted-foreground"}`}>{settings.event_subtitle}</p>
          <p className={`mt-2 text-xs uppercase tracking-wider ${settings.background_image_url ? "text-white/75" : "text-caramel"}`}>{settings.game_line}</p>
          <div className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">{settings.cta_text}</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button onClick={save} disabled={saving} className="btn-hero w-full">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" />Enregistrer les modifications</>}
        </Button>
      </motion.div>
    </div>
  );
};

const Field = ({ icon: Icon, label, children }: { icon: typeof Type; label: string; children: React.ReactNode }) => (
  <div className="card-warm">
    <Label className="mb-2 flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" aria-hidden="true" />{label}</Label>
    {children}
  </div>
);

export default SplashSettingsPanel;
