import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Sparkles, Image as ImageIcon, Type, MessageSquare, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface SplashSettings {
  id: string;
  event_title: string;
  event_subtitle: string;
  game_line: string;
  cta_text: string;
  background_image_url: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Preset event themes
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

interface SplashSettingsPanelProps {
  adminPassword: string;
}

const SplashSettingsPanel = ({ adminPassword }: SplashSettingsPanelProps) => {
  const [settings, setSettings] = useState<SplashSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/splash_settings?is_active=eq.true&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSettings(data[0]);
        }
      }
    } catch (err) {
      console.error("Could not fetch splash settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/splash_settings?id=eq.${settings.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            event_title: settings.event_title,
            event_subtitle: settings.event_subtitle,
            game_line: settings.game_line,
            cta_text: settings.cta_text,
            background_image_url: settings.background_image_url,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error("Save failed");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handlePresetClick = (preset: typeof EVENT_PRESETS[0]) => {
    if (!settings) return;
    setSettings({
      ...settings,
      event_title: preset.title,
      game_line: preset.gameLine,
    });
  };

  const handleImageUrlChange = (url: string) => {
    if (!settings) return;
    setSettings({ ...settings, background_image_url: url || null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun paramètre trouvé
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center p-4 rounded-xl bg-gradient-to-r from-caramel/10 via-butter/20 to-caramel/10 border border-caramel/20">
        <h2 className="font-display text-xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          SPLASH SCREEN
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez l'écran d'accueil
        </p>
      </div>

      {/* Event Presets */}
      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Thèmes prédéfinis</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${
                settings.event_title === preset.title
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="font-medium">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Title */}
      <div className="card-warm">
        <Label className="mb-2 block font-semibold flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          Titre de l'événement
        </Label>
        <Input
          value={settings.event_title}
          onChange={(e) => setSettings({ ...settings, event_title: e.target.value })}
          placeholder="🎉 Quiz & Récompenses"
          className="text-lg"
        />
      </div>

      {/* Subtitle */}
      <div className="card-warm">
        <Label className="mb-2 block font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Sous-titre
        </Label>
        <Input
          value={settings.event_subtitle}
          onChange={(e) => setSettings({ ...settings, event_subtitle: e.target.value })}
          placeholder="Crêpes & Galettes artisanales – Mamers"
        />
      </div>

      {/* Game Line */}
      <div className="card-warm">
        <Label className="mb-2 block font-semibold">Ligne d'accroche</Label>
        <Input
          value={settings.game_line}
          onChange={(e) => setSettings({ ...settings, game_line: e.target.value })}
          placeholder="Jeu & récompenses en cours"
        />
      </div>

      {/* CTA Text */}
      <div className="card-warm">
        <Label className="mb-2 block font-semibold flex items-center gap-2">
          <MousePointer className="w-4 h-4 text-primary" />
          Texte du bouton
        </Label>
        <Input
          value={settings.cta_text}
          onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
          placeholder="Entrer dans la Crêperie"
        />
      </div>

      {/* Background Image URL */}
      <div className="card-warm">
        <Label className="mb-2 block font-semibold flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Image de fond (URL)
        </Label>
        <Input
          value={settings.background_image_url || ""}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Laissez vide pour utiliser le dégradé par défaut
        </p>

        {/* Preview */}
        {settings.background_image_url && (
          <div className="mt-4 rounded-xl overflow-hidden border border-border aspect-video relative">
            <img
              src={settings.background_image_url}
              alt="Background preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent" />
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="card-glow">
        <Label className="mb-3 block font-semibold">Aperçu en direct</Label>
        <div 
          className="aspect-[9/16] max-h-[300px] rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-4 text-center"
          style={{
            background: settings.background_image_url 
              ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${settings.background_image_url}) center/cover`
              : `linear-gradient(180deg, 
                  hsl(40 33% 96%) 0%, 
                  hsl(35 45% 92%) 30%,
                  hsl(32 50% 88%) 70%,
                  hsl(35 45% 90%) 100%
                )`,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-caramel/50 mb-3" />
          <h3 className={`font-display text-lg font-semibold mb-1 ${settings.background_image_url ? 'text-white' : 'text-espresso'}`}>
            {settings.event_title}
          </h3>
          <p className={`text-sm mb-1 ${settings.background_image_url ? 'text-white/80' : 'text-muted-foreground'}`}>
            {settings.event_subtitle}
          </p>
          <p className={`text-xs uppercase tracking-wider mb-4 ${settings.background_image_url ? 'text-caramel-light' : 'text-caramel'}`}>
            {settings.game_line}
          </p>
          <div className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-full">
            {settings.cta_text}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`w-full btn-hero ${success ? 'bg-herb hover:bg-herb' : ''}`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>

        {error && (
          <p className="text-center text-sm text-destructive mt-3">{error}</p>
        )}
      </motion.div>
    </div>
  );
};

export default SplashSettingsPanel;