import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Flame, Snowflake, Upload, Trash2, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

type CartePublicRow = {
  id: string;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  galette_items: MenuItem[];
  crepe_items: MenuItem[];
  created_at: string;
};

interface CartePublicAdminPanelProps {
  adminPassword: string;
  showPublicPreview?: boolean; // ✅ bouton preview activable/désactivable
}

const emptyItem: MenuItem = { name: "", description: "", price: "" };

const ensure3 = (arr: MenuItem[]) => {
  const copy = [...arr];
  while (copy.length < 3) copy.push({ ...emptyItem });
  return copy.slice(0, 3);
};

export default function CartePublicAdminPanel({ adminPassword, showPublicPreview = false }: CartePublicAdminPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [row, setRow] = useState<CartePublicRow | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    is_active: true,
    valid_from: "",
    valid_to: "",
    galette_items: ensure3([]),
    crepe_items: ensure3([]),
  });

  useEffect(() => {
    fetchCarte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCarte = async () => {
    setIsLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_public_carte", adminPassword }),
      });

      if (!res.ok) throw new Error("Impossible de charger la carte");
      const data = await res.json();

      const carte = (data.carte || null) as CartePublicRow | null;
      setRow(carte);

      const gal = ensure3(Array.isArray(carte?.galette_items) ? carte!.galette_items : []);
      const cre = ensure3(Array.isArray(carte?.crepe_items) ? carte!.crepe_items : []);

      setForm({
        is_active: carte?.is_active ?? true,
        valid_from: carte?.valid_from ?? "",
        valid_to: carte?.valid_to ?? "",
        galette_items: gal,
        crepe_items: cre,
      });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Erreur lors du chargement de la carte." });
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = (type: "galette" | "crepe", index: number, field: keyof MenuItem, value: string) => {
    setForm((prev) => {
      const items = type === "galette" ? [...prev.galette_items] : [...prev.crepe_items];
      items[index] = { ...items[index], [field]: value };
      return type === "galette" ? { ...prev, galette_items: items } : { ...prev, crepe_items: items };
    });
  };

  const removeImage = (type: "galette" | "crepe", index: number) => {
    updateItem(type, index, "image_url", "");
  };

  const handleImageUpload = async (type: "galette" | "crepe", index: number, file: File) => {
    const key = `${type}-${index}`;
    setUploadingImage(key);
    setMsg(null);

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `carte-${type}-${index}-${Date.now()}.${fileExt}`;
      const filePath = `carte-public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      updateItem(type, index, "image_url", publicUrl);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Erreur lors du téléchargement de l’image." });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);

    try {
      // Nettoyage : on garde max 3, et on enlève les items totalement vides
      const clean = (items: MenuItem[]) =>
        ensure3(items).map((it) => ({
          name: (it.name || "").trim(),
          description: (it.description || "").trim(),
          price: (it.price || "").trim(),
          image_url: (it.image_url || "").trim() || undefined,
        }));

      const payload = {
        action: "update_public_carte",
        adminPassword,
        carteData: {
          is_active: form.is_active,
          valid_from: form.valid_from || null,
          valid_to: form.valid_to || null,
          galette_items: clean(form.galette_items),
          crepe_items: clean(form.crepe_items),
        },
      };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Erreur sauvegarde");

      setMsg({ type: "success", text: "Carte mise à jour ✅" });
      fetchCarte();
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Impossible de sauvegarder la carte." });
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = (type: "galette" | "crepe", index: number) => {
    const item = type === "galette" ? form.galette_items[index] : form.crepe_items[index];
    const key = `${type}-${index}`;
    const isGal = type === "galette";

    return (
      <div key={key} className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
        <div className="flex items-center gap-2">
          {isGal ? <Flame className="w-4 h-4 text-terracotta" /> : <Snowflake className="w-4 h-4 text-caramel" />}
          <span className="font-semibold text-sm">{isGal ? `Galette ${index + 1}` : `Crêpe ${index + 1}`}</span>
        </div>

        {/* Image */}
        <div className="space-y-2">
          {item.image_url ? (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img src={item.image_url} alt={item.name || key} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(type, index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
                aria-label="Supprimer image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
              {uploadingImage === key ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Ajouter une image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(type, index, file);
                }}
                disabled={uploadingImage === key}
              />
            </label>
          )}
        </div>

        <Input
          value={item.name}
          onChange={(e) => updateItem(type, index, "name", e.target.value)}
          placeholder="Nom"
          className="font-medium"
        />

        <Textarea
          value={item.description}
          onChange={(e) => updateItem(type, index, "description", e.target.value)}
          placeholder="Description"
          rows={2}
        />

        <Input
          value={item.price}
          onChange={(e) => updateItem(type, index, "price", e.target.value)}
          placeholder="Prix (ex: 9,50 €)"
          className="font-mono"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="card-warm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">La Carte</h2>
            <p className="text-sm text-muted-foreground">Gestion des 3 galettes + 3 crêpes (visible public).</p>
          </div>

          {showPublicPreview && (
            <Button variant="outline" size="sm" onClick={() => window.open("/carte", "_blank")} className="gap-2">
              <Eye className="w-4 h-4" /> Voir rendu public
            </Button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Début (optionnel)
            </Label>
            <Input
              type="date"
              value={form.valid_from}
              onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Fin (optionnel)
            </Label>
            <Input
              type="date"
              value={form.valid_to}
              onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant={form.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
          >
            {form.is_active ? "Carte active" : "Carte désactivée"}
          </Button>
        </div>

        {msg && (
          <div
            className={`mt-3 p-3 rounded-xl text-sm ${
              msg.type === "success" ? "bg-herb/10 text-herb" : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      {/* Galettes */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-terracotta" />
          Galettes (3 max)
        </h3>
        {Array.from({ length: 3 }).map((_, i) => renderItem("galette", i))}
      </div>

      {/* Crêpes */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-caramel" />
          Crêpes (3 max)
        </h3>
        {Array.from({ length: 3 }).map((_, i) => renderItem("crepe", i))}
      </div>

      <Button onClick={handleSave} className="w-full btn-hero py-6" disabled={isSaving}>
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sauvegarder la carte</>}
      </Button>
    </motion.div>
  );
}
