import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type SecretMenu = {
  id: string;
  menu_name: string;
  galette_special: string | null;
  galette_special_description: string | null;
  galette_special_price: string | null;
  crepe_special: string | null;
  crepe_special_description: string | null;
  crepe_special_price: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
};

type FormData = {
  menu_name: string;
  galette_special: string;
  galette_special_description: string;
  galette_special_price: string;
  crepe_special: string;
  crepe_special_description: string;
  crepe_special_price: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
};

const emptyForm: FormData = {
  menu_name: "Menu secret de la semaine",
  galette_special: "",
  galette_special_description: "",
  galette_special_price: "",
  crepe_special: "",
  crepe_special_description: "",
  crepe_special_price: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
};

const SecretMenuSavePanel = ({ adminPassword }: { adminPassword: string }) => {
  const [menu, setMenu] = useState<SecretMenu | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void fetchMenu();
  }, []);

  const updateForm = (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_secret_menu", adminPassword }),
      });
      const result = await response.json();
      const data = result.menu as SecretMenu | null;
      if (data) {
        setMenu(data);
        setFormData({
          menu_name: data.menu_name || "Menu secret de la semaine",
          galette_special: data.galette_special || "",
          galette_special_description: data.galette_special_description || "",
          galette_special_price: data.galette_special_price || "",
          crepe_special: data.crepe_special || "",
          crepe_special_description: data.crepe_special_description || "",
          crepe_special_price: data.crepe_special_price || "",
          valid_from: data.valid_from?.split("T")[0] || "",
          valid_to: data.valid_to?.split("T")[0] || "",
          is_active: data.is_active,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Impossible de charger le menu." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/secret-menu-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword, menuId: menu?.id, menuData: formData }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Erreur de sauvegarde");
      setMenu(result.menu);
      setMessage({ type: "success", text: "Menu secret de la semaine enregistré." });
      await fetchMenu();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erreur de sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-caramel" /></div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-caramel/15 bg-white/85 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-butter/25 p-3">
          <div>
            <p className="font-display text-lg font-black text-espresso">Menu actif</p>
            <p className="text-xs text-muted-foreground">Menu secret de la semaine, visible après participation au quiz.</p>
          </div>
          <Switch checked={formData.is_active} onCheckedChange={(checked) => updateForm({ is_active: checked })} />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du menu</Label>
            <Input value={formData.menu_name} onChange={(e) => updateForm({ menu_name: e.target.value })} className="h-12 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Début</Label><Input type="date" value={formData.valid_from} onChange={(e) => updateForm({ valid_from: e.target.value })} className="h-12 rounded-2xl" /></div>
            <div className="space-y-2"><Label>Fin</Label><Input type="date" value={formData.valid_to} onChange={(e) => updateForm({ valid_to: e.target.value })} className="h-12 rounded-2xl" /></div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/60 bg-white/85 p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-espresso">Galette secrète</h3>
        <div className="mt-3 space-y-3">
          <Input value={formData.galette_special} onChange={(e) => updateForm({ galette_special: e.target.value })} placeholder="Nom de la galette" className="h-12 rounded-2xl" />
          <Textarea value={formData.galette_special_description} onChange={(e) => updateForm({ galette_special_description: e.target.value })} placeholder="Description" className="rounded-2xl" />
          <Input value={formData.galette_special_price} onChange={(e) => updateForm({ galette_special_price: e.target.value })} placeholder="Prix" className="h-12 rounded-2xl" />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/60 bg-white/85 p-4 shadow-sm">
        <h3 className="font-display text-xl font-black text-espresso">Crêpe secrète</h3>
        <div className="mt-3 space-y-3">
          <Input value={formData.crepe_special} onChange={(e) => updateForm({ crepe_special: e.target.value })} placeholder="Nom de la crêpe" className="h-12 rounded-2xl" />
          <Textarea value={formData.crepe_special_description} onChange={(e) => updateForm({ crepe_special_description: e.target.value })} placeholder="Description" className="rounded-2xl" />
          <Input value={formData.crepe_special_price} onChange={(e) => updateForm({ crepe_special_price: e.target.value })} placeholder="Prix" className="h-12 rounded-2xl" />
        </div>
      </section>

      {message && <div className={`rounded-2xl p-3 text-center text-sm font-semibold ${message.type === "success" ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>{message.text}</div>}

      <Button onClick={handleSave} className="h-14 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90" disabled={isSaving}>
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" />Enregistrer le menu secret</>}
      </Button>
    </div>
  );
};

export default SecretMenuSavePanel;
