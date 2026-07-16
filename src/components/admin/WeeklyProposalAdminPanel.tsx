import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ImagePlus, Loader2, Save, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TYPES = [
  ["galette", "Galette", "🥞"],
  ["crepe", "Crêpe", "🍯"],
  ["milkshake", "Milkshake", "🥤"],
  ["smoothie", "Smoothie", "🍹"],
] as const;

type TypeKey = typeof TYPES[number][0];
type Proposal = Record<string, string | boolean | null> & { id?: string };

const emptyProposal: Proposal = {
  menu_name: "Propositions de la semaine",
  valid_from: "",
  valid_to: "",
  is_active: true,
};

for (const [type] of TYPES) {
  emptyProposal[`${type}_special`] = "";
  emptyProposal[`${type}_special_description`] = "";
  emptyProposal[`${type}_special_price`] = "";
  emptyProposal[`${type}_special_image_url`] = "";
  emptyProposal[`${type}_special_video_url`] = "";
}

const WeeklyProposalAdminPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [proposal, setProposal] = useState<Proposal>({ ...emptyProposal });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const request = async (payload: Record<string, unknown>) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-weekly-proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Service indisponible");
    return data;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await request({ action: "get" });
      const current = data.proposal as Proposal | null;
      if (current) {
        setProposal({
          ...emptyProposal,
          ...current,
          valid_from: typeof current.valid_from === "string" ? current.valid_from.slice(0, 10) : "",
          valid_to: typeof current.valid_to === "string" ? current.valid_to.slice(0, 10) : "",
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const update = (key: string, value: string | boolean) => setProposal((current) => ({ ...current, [key]: value }));
  const filledCount = useMemo(() => TYPES.filter(([type]) => Boolean(proposal[`${type}_special`])).length, [proposal]);

  const upload = async (type: TypeKey, file: File) => {
    const key = `${type}-image`;
    setUploading(key);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `weekly-proposals/${type}-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      update(`${type}_special_image_url`, data.publicUrl);
      toast.success("Image ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = await request({ action: "save", proposalId: proposal.id || null, proposal });
      setProposal((current) => ({ ...current, ...(data.proposal as Proposal) }));
      toast.success("Propositions de la semaine enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-2">
        <Mini label="Propositions" value={`${filledCount}/4`} />
        <Mini label="Statut" value={proposal.is_active ? "Publié" : "Masqué"} />
        <Mini label="Accès" value="Après quiz" />
      </section>

      <section className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            <Label htmlFor="proposal-name">Titre public</Label>
            <Input id="proposal-name" value={String(proposal.menu_name || "")} onChange={(e) => update("menu_name", e.target.value)} className="h-12 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateInput label="Début" value={String(proposal.valid_from || "")} onChange={(value) => update("valid_from", value)} />
            <DateInput label="Fin" value={String(proposal.valid_to || "")} onChange={(value) => update("valid_to", value)} />
          </div>
          <div className="flex h-12 items-center gap-3 rounded-2xl border px-4">
            <Switch checked={proposal.is_active !== false} onCheckedChange={(value) => update("is_active", value)} />
            <span className="text-sm font-bold">Visible</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        {TYPES.map(([type, label, emoji]) => (
          <article key={type} className="rounded-3xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3"><span className="text-3xl">{emoji}</span><div><h3 className="font-display text-xl font-black text-espresso">{label} de la semaine</h3><p className="text-xs text-muted-foreground">Nom, description, prix et visuel.</p></div></div>
            <div className="space-y-3">
              <Input value={String(proposal[`${type}_special`] || "")} onChange={(e) => update(`${type}_special`, e.target.value)} placeholder={`Nom du ${label.toLowerCase()}`} className="h-11 rounded-xl" />
              <Textarea value={String(proposal[`${type}_special_description`] || "")} onChange={(e) => update(`${type}_special_description`, e.target.value)} placeholder="Description courte et gourmande" className="min-h-24 rounded-xl" />
              <div className="grid grid-cols-[130px_1fr] gap-2">
                <Input value={String(proposal[`${type}_special_price`] || "")} onChange={(e) => update(`${type}_special_price`, e.target.value)} placeholder="Prix" className="h-11 rounded-xl" />
                <Input value={String(proposal[`${type}_special_image_url`] || "")} onChange={(e) => update(`${type}_special_image_url`, e.target.value)} placeholder="URL de l’image" className="h-11 rounded-xl" />
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-caramel/30 p-3 text-sm font-bold text-caramel hover:bg-butter/20">
                {uploading === `${type}-image` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Importer une image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(type, file); }} />
              </label>
            </div>
          </article>
        ))}
      </section>

      <Button onClick={save} disabled={saving} className="h-14 w-full rounded-2xl bg-caramel font-black text-white">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" />Enregistrer les propositions</>}
      </Button>
    </div>
  );
};

const Mini = ({ label, value }: { label: string; value: string }) => <div className="rounded-xl border border-caramel/15 bg-white px-3 py-2 shadow-sm"><p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p><p className="font-display text-lg font-black text-espresso">{value}</p></div>;
const DateInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <div><Label className="mb-1 flex items-center gap-1 text-xs"><CalendarDays className="h-3.5 w-3.5" />{label}</Label><Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl" /></div>;

export default WeeklyProposalAdminPanel;
