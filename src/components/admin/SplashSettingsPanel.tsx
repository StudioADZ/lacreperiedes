import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, MonitorSmartphone, Save, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const THEMES = [
  { label: "Quiz", emoji: "🎉", title: "Quiz & Récompenses", subtitle: "Tentez votre chance et découvrez votre surprise.", gameLine: "Jeu gourmand en cours", cta: "Participer au quiz" },
  { label: "Saison", emoji: "🌿", title: "Les saveurs du moment", subtitle: "Découvrez nos créations artisanales et nos nouveautés.", gameLine: "Créations du moment", cta: "Découvrir" },
  { label: "Été", emoji: "☀️", title: "Un été gourmand", subtitle: "Galettes, crêpes, milkshakes et smoothies à savourer.", gameLine: "Fraîcheur estivale", cta: "Voir la carte" },
  { label: "Noël", emoji: "🎄", title: "Noël à la Crêperie", subtitle: "Une parenthèse chaleureuse, festive et gourmande.", gameLine: "Magie de Noël", cta: "Découvrir l'événement" },
  { label: "Saint-Valentin", emoji: "❤️", title: "Saint-Valentin gourmande", subtitle: "Un moment à partager autour de créations généreuses.", gameLine: "L'amour se déguste", cta: "Réserver" },
  { label: "Pâques", emoji: "🐰", title: "Pâques gourmand", subtitle: "Des douceurs à découvrir en famille.", gameLine: "Chasse aux douceurs", cta: "Participer" },
] as const;

const SplashSettingsPanel = ({ adminPassword: _adminToken }: { adminPassword: string }) => {
  const [settings, setSettings] = useState<SplashSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("splash_settings")
        .select("id, event_title, event_subtitle, game_line, cta_text, background_image_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) toast.error("Impossible de charger l'accueil");
      setSettings(data as SplashSettings | null);
      setLoading(false);
    };
    void load();
  }, []);

  const completeness = useMemo(() => {
    if (!settings) return 0;
    return [settings.event_title, settings.event_subtitle, settings.game_line, settings.cta_text, settings.background_image_url]
      .filter(Boolean).length;
  }, [settings]);

  const applyTheme = (theme: typeof THEMES[number]) => {
    if (!settings) return;
    setSettings({
      ...settings,
      event_title: `${theme.emoji} ${theme.title}`,
      event_subtitle: theme.subtitle,
      game_line: theme.gameLine,
      cta_text: theme.cta,
    });
  };

  const uploadImage = async (file: File) => {
    if (!settings) return;
    setUploading(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `splash/${settings.id}-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      setSettings({ ...settings, background_image_url: data.publicUrl });
      toast.success("Image d'accueil ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setUploading(false);
    }
  };

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
    else toast.success("Accueil de l'application mis à jour");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;
  if (!settings) return <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">Aucun accueil actif trouvé.</div>;

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-3 gap-2">
        <Metric label="Contenu" value={`${completeness}/5`} />
        <Metric label="Format" value="Mobile" />
        <Metric label="Statut" value="Actif" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
        <div className="space-y-3">
          <div className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-caramel">Ambiance</p>
                <h2 className="font-display text-xl font-black text-espresso">Thèmes rapides</h2>
              </div>
              <Sparkles className="h-5 w-5 text-caramel" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {THEMES.map((theme) => (
                <button key={theme.label} type="button" onClick={() => applyTheme(theme)} className="rounded-2xl border border-caramel/15 bg-butter/20 p-3 text-center transition hover:border-caramel/40 hover:bg-butter/40">
                  <span className="block text-2xl">{theme.emoji}</span>
                  <span className="mt-1 block text-[10px] font-black uppercase text-espresso">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Type className="h-5 w-5 text-caramel" /><h2 className="font-display text-xl font-black text-espresso">Contenu de l'accueil</h2></div>
            <div className="grid gap-3">
              <Field label="Titre principal" count={`${settings.event_title.length}/100`}><Input value={settings.event_title} onChange={(event) => setSettings({ ...settings, event_title: event.target.value })} maxLength={100} className="h-11 rounded-xl" /></Field>
              <Field label="Sous-titre" count={`${settings.event_subtitle.length}/180`}><Textarea value={settings.event_subtitle} onChange={(event) => setSettings({ ...settings, event_subtitle: event.target.value })} maxLength={180} className="min-h-24 rounded-xl" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Accroche" count={`${settings.game_line.length}/120`}><Input value={settings.game_line} onChange={(event) => setSettings({ ...settings, game_line: event.target.value })} maxLength={120} className="h-11 rounded-xl" /></Field>
                <Field label="Bouton" count={`${settings.cta_text.length}/60`}><Input value={settings.cta_text} onChange={(event) => setSettings({ ...settings, cta_text: event.target.value })} maxLength={60} className="h-11 rounded-xl" /></Field>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2"><ImagePlus className="h-5 w-5 text-caramel" /><h2 className="font-display text-xl font-black text-espresso">Visuel principal</h2></div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input type="url" value={settings.background_image_url || ""} onChange={(event) => setSettings({ ...settings, background_image_url: event.target.value || null })} placeholder="URL de l'image" className="h-11 rounded-xl" />
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-caramel/35 px-4 text-sm font-black text-caramel hover:bg-butter/20">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Importer
                <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />
              </label>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm xl:sticky xl:top-4 xl:self-start">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-caramel">Aperçu en direct</p><h2 className="font-display text-xl font-black text-espresso">Écran mobile</h2></div><MonitorSmartphone className="h-5 w-5 text-caramel" /></div>
          <div className="mx-auto max-w-[340px] rounded-[2.6rem] bg-espresso p-2 shadow-xl">
            <div className="relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-[2.15rem] p-6 text-center" style={{ background: settings.background_image_url ? `linear-gradient(180deg,rgba(20,10,4,.12),rgba(20,10,4,.82)),url(${settings.background_image_url}) center/cover` : "linear-gradient(180deg,#f7ead8,#d6ad7f)" }}>
              <div className="relative z-10 rounded-3xl border border-white/20 bg-black/20 p-5 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{settings.game_line || "Votre accroche"}</p>
                <h3 className="mt-3 font-display text-3xl font-black leading-tight text-white">{settings.event_title || "Titre de l'accueil"}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85">{settings.event_subtitle || "Votre sous-titre s'affichera ici."}</p>
                <div className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-espresso shadow-lg">{settings.cta_text || "Découvrir"}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-herb"><CheckCircle2 className="h-4 w-4" />Aperçu synchronisé avec les champs</div>
        </aside>
      </section>

      <Button onClick={save} disabled={saving} className="h-14 w-full rounded-2xl bg-caramel font-black text-white">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" />Enregistrer l'accueil</>}
      </Button>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => <div className="rounded-xl border border-caramel/15 bg-white px-3 py-2 shadow-sm"><p className="font-display text-lg font-black leading-none text-espresso">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p></div>;
const Field = ({ label, count, children }: { label: string; count: string; children: React.ReactNode }) => <div><div className="mb-1.5 flex items-center justify-between"><Label className="text-xs font-black text-espresso">{label}</Label><span className="text-[10px] text-muted-foreground">{count}</span></div>{children}</div>;

export default SplashSettingsPanel;
