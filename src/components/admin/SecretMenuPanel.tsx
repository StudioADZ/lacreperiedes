import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, ChefHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SecretMenu {
  id: string;
  week_start: string;
  menu_name: string;
  secret_code: string;
  galette_special: string | null;
  galette_special_description: string | null;
  crepe_special: string | null;
  crepe_special_description: string | null;
  is_active: boolean;
}

interface SecretMenuPanelProps {
  adminPassword: string;
}

const SecretMenuPanel = ({ adminPassword }: SecretMenuPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Typed menu (for UI)
  const [menu, setMenu] = useState<SecretMenu | null>(null);

  // Raw menu (for safe merge – prevents wiping fields not in this panel)
  const [rawMenu, setRawMenu] = useState<Record<string, unknown> | null>(null);

  const [formData, setFormData] = useState({
    menu_name: "",
    secret_code: "",
    galette_special: "",
    galette_special_description: "",
    crepe_special: "",
    crepe_special_description: "",
  });

  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSave = useMemo(() => {
    return !!menu && !!formData.secret_code.trim() && !isSaving;
  }, [menu, formData.secret_code, isSaving]);

  useEffect(() => {
    fetchMenu();
    // SAFE: si adminPassword évolue dans ton app, on refetch proprement
  }, [adminPassword]);

  const fetchMenu = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      // Ensure exists for this week
      await supabase.rpc("ensure_secret_menu");

      // Fetch active
      const { data, error } = await supabase
        .from("secret_menu")
        .select("*")
        .eq("is_active", true)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // keep raw object to merge safely on save
        setRawMenu(data as unknown as Record<string, unknown>);

        setMenu(data as unknown as SecretMenu);
        setFormData({
          menu_name: (data as any).menu_name || "",
          secret_code: (data as any).secret_code || "",
          galette_special: (data as any).galette_special || "",
          galette_special_description: (data as any).galette_special_description || "",
          crepe_special: (data as any).crepe_special || "",
          crepe_special_description: (data as any).crepe_special_description || "",
        });
      } else {
        setMenu(null);
        setRawMenu(null);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
      setSaveMessage({ type: "error", text: "Impossible de charger le menu secret." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!menu) return;

    const code = formData.secret_code.trim().toUpperCase();
    if (!code) {
      setSaveMessage({ type: "error", text: "Le code secret est obligatoire." });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // ✅ SAFE MERGE:
      // On fusionne avec rawMenu (toutes les colonnes existantes) pour éviter d'écraser
      // les champs non gérés par ce panel (items, prix, images, valid_from/to, etc.)
      const mergedMenuData = {
        ...(rawMenu || {}),
        menu_name: formData.menu_name,
        secret_code: code,
        galette_special: formData.galette_special,
        galette_special_description: formData.galette_special_description,
        crepe_special: formData.crepe_special,
        crepe_special_description: formData.crepe_special_description,
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_secret_menu",
          adminPassword,
          menuId: menu.id,
          menuData: mergedMenuData,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Menu secret mis à jour !" });
        await fetchMenu();
      } else {
        setSaveMessage({ type: "error", text: (result as any)?.message || "Erreur lors de la sauvegarde" });
      }
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: "error", text: "Erreur de connexion" });
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = () => {
    const codes = ["CREPE", "GALETTE", "SARTHE", "MAMERS", "BRETAGNE", "CIDRE", "CARAMEL"];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    const randomNum = Math.floor(Math.random() * 100);
    setFormData((prev) => ({ ...prev, secret_code: `${randomCode}${randomNum}` }));
    setSaveMessage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="card-warm text-center">
        <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-caramel" />
        </div>
        <h2 className="font-display text-xl font-bold">Menu Secret du Week-end</h2>
        <p className="text-sm text-muted-foreground">
          Semaine du {menu ? new Date(menu.week_start).toLocaleDateString("fr-FR") : "..."}
        </p>
      </div>

      {/* Form */}
      <div className="card-warm space-y-4">
        {/* Menu Name */}
        <div className="space-y-2">
          <Label htmlFor="menu_name">Nom du menu</Label>
          <Input
            id="menu_name"
            value={formData.menu_name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, menu_name: e.target.value }));
              setSaveMessage(null);
            }}
            placeholder="Menu Secret du Week-end"
          />
        </div>

        {/* Secret Code */}
        <div className="space-y-2">
          <Label htmlFor="secret_code">Code secret</Label>
          <div className="flex gap-2">
            <Input
              id="secret_code"
              value={formData.secret_code}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, secret_code: e.target.value.toUpperCase() }));
                setSaveMessage(null);
              }}
              placeholder="CREPE2025"
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={generateCode} type="button">
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>

          {!formData.secret_code.trim() && (
            <p className="text-xs text-destructive">Le code est obligatoire (sinon la page publique ne peut pas être déverrouillée).</p>
          )}

          <p className="text-xs text-muted-foreground">Code affiché aux gagnants pour accéder au menu secret</p>
        </div>

        {/* Galette Special */}
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥞</span>
            <Label className="font-semibold">Galette spéciale du week-end</Label>
          </div>
          <Input
            value={formData.galette_special}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, galette_special: e.target.value }));
              setSaveMessage(null);
            }}
            placeholder="Nom de la galette"
          />
          <Textarea
            value={formData.galette_special_description}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, galette_special_description: e.target.value }));
              setSaveMessage(null);
            }}
            placeholder="Ingrédients et description..."
            rows={2}
          />
        </div>

        {/* Crepe Special */}
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍫</span>
            <Label className="font-semibold">Crêpe spéciale du week-end</Label>
          </div>
          <Input
            value={formData.crepe_special}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, crepe_special: e.target.value }));
              setSaveMessage(null);
            }}
            placeholder="Nom de la crêpe"
          />
          <Textarea
            value={formData.crepe_special_description}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, crepe_special_description: e.target.value }));
              setSaveMessage(null);
            }}
            placeholder="Ingrédients et description..."
            rows={2}
          />
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`p-3 rounded-xl text-sm text-center ${
              saveMessage.type === "success" ? "bg-herb/10 text-herb" : "bg-destructive/10 text-destructive"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full btn-hero" disabled={!canSave}>
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistrer le menu
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default SecretMenuPanel;
