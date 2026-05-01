import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  ChefHat,
  Copy,
  Euro,
  Eye,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type SecretMenu = {
  id: string;
  week_start: string;
  menu_name: string;
  secret_code: string;
  galette_special: string | null;
  galette_special_description: string | null;
  galette_special_price: string | null;
  galette_special_image_url: string | null;
  galette_special_video_url: string | null;
  crepe_special: string | null;
  crepe_special_description: string | null;
  crepe_special_price: string | null;
  crepe_special_image_url: string | null;
  crepe_special_video_url: string | null;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
};

type SpecialType = "galette" | "crepe";

type FormData = {
  menu_name: string;
  secret_code: string;
  galette_special: string;
  galette_special_description: string;
  galette_special_price: string;
  galette_special_image_url: string;
  galette_special_video_url: string;
  crepe_special: string;
  crepe_special_description: string;
  crepe_special_price: string;
  crepe_special_image_url: string;
  crepe_special_video_url: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
};

const emptyForm: FormData = {
  menu_name: "",
  secret_code: "",
  galette_special: "",
  galette_special_description: "",
  galette_special_price: "",
  galette_special_image_url: "",
  galette_special_video_url: "",
  crepe_special: "",
  crepe_special_description: "",
  crepe_special_price: "",
  crepe_special_image_url: "",
  crepe_special_video_url: "",
  valid_from: "",
  valid_to: "",
  is_active: true,
};

const SecretMenuAdminPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState<SecretMenu | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [dailyCode, setDailyCode] = useState<string | null>(null);
  const [dailyCodeCopied, setDailyCodeCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);

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

      if (!response.ok) throw new Error("Failed to fetch menu");
      const result = await response.json();
      const data = result.menu as SecretMenu | null;
      if (!data) return;

      setMenu(data);
      setFormData({
        menu_name: data.menu_name || "",
        secret_code: data.secret_code || "",
        galette_special: data.galette_special || "",
        galette_special_description: data.galette_special_description || "",
        galette_special_price: data.galette_special_price || "",
        galette_special_image_url: data.galette_special_image_url || "",
        galette_special_video_url: data.galette_special_video_url || "",
        crepe_special: data.crepe_special || "",
        crepe_special_description: data.crepe_special_description || "",
        crepe_special_price: data.crepe_special_price || "",
        crepe_special_image_url: data.crepe_special_image_url || "",
        crepe_special_video_url: data.crepe_special_video_url || "",
        valid_from: data.valid_from?.split("T")[0] || "",
        valid_to: data.valid_to?.split("T")[0] || "",
        is_active: data.is_active,
      });

      if (data.secret_code) void fetchDailyCode(data.secret_code);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyCode = async (secretCode: string) => {
    try {
      const { data } = await supabase.rpc("get_daily_code", { p_secret_code: secretCode });
      if (data) setDailyCode(data);
    } catch (error) {
      console.error("Error fetching daily code:", error);
    }
  };

  const handleSave = async () => {
    if (!menu) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_secret_menu",
          adminPassword,
          menuId: menu.id,
          menuData: {
            menu_name: formData.menu_name,
            secret_code: formData.secret_code,
            galette_special: formData.galette_special || null,
            galette_special_description: formData.galette_special_description || null,
            galette_special_price: formData.galette_special_price || null,
            galette_special_image_url: formData.galette_special_image_url || null,
            galette_special_video_url: formData.galette_special_video_url || null,
            crepe_special: formData.crepe_special || null,
            crepe_special_description: formData.crepe_special_description || null,
            crepe_special_price: formData.crepe_special_price || null,
            crepe_special_image_url: formData.crepe_special_image_url || null,
            crepe_special_video_url: formData.crepe_special_video_url || null,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to,
            is_active: formData.is_active,
          },
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setSaveMessage({ type: "success", text: "Menu secret mis à jour." });
        await fetchMenu();
      } else {
        setSaveMessage({ type: "error", text: result.message || "Erreur lors de la sauvegarde" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Erreur de connexion" });
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = () => {
    const codes = ["CREPE", "GALETTE", "SARTHE", "MAMERS", "BRETAGNE", "CIDRE", "CARAMEL", "SECRET"];
    const newCode = `${codes[Math.floor(Math.random() * codes.length)]}${Math.floor(Math.random() * 100)}`;
    updateForm({ secret_code: newCode });
    void fetchDailyCode(newCode);
  };

  const copyDailyCode = () => {
    if (!dailyCode) return;
    navigator.clipboard.writeText(dailyCode);
    setDailyCodeCopied(true);
    setTimeout(() => setDailyCodeCopied(false), 2000);
  };

  const mediaKeys = (type: SpecialType) => ({
    image: type === "galette" ? "galette_special_image_url" : "crepe_special_image_url",
    video: type === "galette" ? "galette_special_video_url" : "crepe_special_video_url",
  } as const);

  const handleSpecialImageUpload = async (type: SpecialType, file: File) => {
    const key = `special-${type}-image`;
    setUploadingImage(key);
    try {
      const filePath = `secret-menu/special-${type}-image-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("images").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      updateForm({ [mediaKeys(type).image]: publicUrl } as Partial<FormData>);
    } catch (error) {
      console.error("Error uploading special image:", error);
      setSaveMessage({ type: "error", text: "Erreur lors du téléchargement de l’image" });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSpecialVideoUpload = async (type: SpecialType, file: File) => {
    const key = `special-${type}-video`;
    setUploadingVideo(key);

    if (file.size > 50 * 1024 * 1024) {
      setSaveMessage({ type: "error", text: "Vidéo trop volumineuse, maximum 50MB." });
      setUploadingVideo(null);
      return;
    }

    try {
      const filePath = `secret-menu/special-${type}-video-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("images").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);
      updateForm({ [mediaKeys(type).video]: publicUrl } as Partial<FormData>);
    } catch (error) {
      console.error("Error uploading special video:", error);
      setSaveMessage({ type: "error", text: "Erreur lors du téléchargement de la vidéo" });
    } finally {
      setUploadingVideo(null);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-caramel" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <section className="rounded-[1.75rem] border border-caramel/15 bg-white/85 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-butter/25 p-3">
          <div>
            <p className="font-display text-lg font-black text-espresso">Menu actif</p>
            <p className="text-xs text-muted-foreground">Visible côté client après participation au quiz.</p>
          </div>
          <Switch checked={formData.is_active} onCheckedChange={(checked) => updateForm({ is_active: checked })} />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu_name">Nom du menu</Label>
            <Input id="menu_name" value={formData.menu_name} onChange={(e) => updateForm({ menu_name: e.target.value })} placeholder="Menu secret du week-end" className="h-12 rounded-2xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DateField id="valid_from" label="Début" value={formData.valid_from} onChange={(value) => updateForm({ valid_from: value })} />
            <DateField id="valid_to" label="Fin" value={formData.valid_to} onChange={(value) => updateForm({ valid_to: value })} />
          </div>
        </div>
      </section>

      <SpecialCard type="galette" title="Galette secrète" formData={formData} updateForm={updateForm} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} onImageUpload={handleSpecialImageUpload} onVideoUpload={handleSpecialVideoUpload} getYoutubeEmbedUrl={getYoutubeEmbedUrl} />
      <SpecialCard type="crepe" title="Crêpe secrète" formData={formData} updateForm={updateForm} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} onImageUpload={handleSpecialImageUpload} onVideoUpload={handleSpecialVideoUpload} getYoutubeEmbedUrl={getYoutubeEmbedUrl} />

      {saveMessage && (
        <div className={`rounded-2xl p-3 text-center text-sm font-semibold ${saveMessage.type === "success" ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>{saveMessage.text}</div>
      )}

      <Button onClick={handleSave} className="h-14 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90" disabled={isSaving}>
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" />Enregistrer le menu secret</>}
      </Button>
    </motion.div>
  );
};

const DateField = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2"><Calendar className="h-4 w-4 text-caramel" />{label}</Label>
    <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-2xl" />
  </div>
);

const SpecialCard = ({ type, title, formData, updateForm, uploadingImage, uploadingVideo, onImageUpload, onVideoUpload, getYoutubeEmbedUrl }: { type: SpecialType; title: string; formData: FormData; updateForm: (patch: Partial<FormData>) => void; uploadingImage: string | null; uploadingVideo: string | null; onImageUpload: (type: SpecialType, file: File) => void; onVideoUpload: (type: SpecialType, file: File) => void; getYoutubeEmbedUrl: (url: string) => string | null }) => {
  const prefix = type === "galette" ? "galette_special" : "crepe_special";
  const nameKey = prefix as keyof FormData;
  const descriptionKey = `${prefix}_description` as keyof FormData;
  const priceKey = `${prefix}_price` as keyof FormData;
  const imageKey = `${prefix}_image_url` as keyof FormData;
  const videoKey = `${prefix}_video_url` as keyof FormData;
  const imageUploadKey = `special-${type}-image`;
  const videoUploadKey = `special-${type}-video`;
  const videoUrl = formData[videoKey];
  const imageUrl = formData[imageKey];

  return (
    <section className="rounded-[1.75rem] border border-border/60 bg-white/85 p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Sparkles className="h-5 w-5" /></div>
        <div>
          <h3 className="font-display text-xl font-black text-espresso">{title}</h3>
          <p className="text-xs text-muted-foreground">Texte, prix, photo ou vidéo.</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input value={formData[nameKey]} onChange={(e) => updateForm({ [nameKey]: e.target.value } as Partial<FormData>)} placeholder="Nom de la création" className="h-12 rounded-2xl" />
        <Textarea value={formData[descriptionKey]} onChange={(e) => updateForm({ [descriptionKey]: e.target.value } as Partial<FormData>)} placeholder="Description, ingrédients, petite histoire..." rows={3} className="rounded-2xl" />
        <div className="flex items-center gap-2"><Euro className="h-4 w-4 text-muted-foreground" /><Input value={formData[priceKey]} onChange={(e) => updateForm({ [priceKey]: e.target.value } as Partial<FormData>)} placeholder="Prix" className="h-12 rounded-2xl font-mono" /></div>

        <MediaUploader label="Photo" icon="image" value={imageUrl} uploading={uploadingImage === imageUploadKey} accept="image/*" onUpload={(file) => onImageUpload(type, file)} onClear={() => updateForm({ [imageKey]: "" } as Partial<FormData>)} />
        <MediaUploader label="Vidéo" icon="video" value={videoUrl} uploading={uploadingVideo === videoUploadKey} accept="video/mp4,video/webm" onUpload={(file) => onVideoUpload(type, file)} onClear={() => updateForm({ [videoKey]: "" } as Partial<FormData>)} />

        {videoUrl && (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            {getYoutubeEmbedUrl(videoUrl) ? <iframe src={getYoutubeEmbedUrl(videoUrl) || ""} className="h-full w-full" allowFullScreen /> : <video src={videoUrl} controls className="h-full w-full object-contain" />}
          </div>
        )}

        {(formData[nameKey] || imageUrl) && (
          <div className="rounded-2xl border border-caramel/20 bg-butter/15 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Eye className="h-3 w-3" /> Aperçu client</p>
            <div className="flex gap-3">
              {imageUrl && <img src={imageUrl} alt="Aperçu" className="h-16 w-16 rounded-2xl object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="font-display font-black text-espresso">{formData[nameKey] || title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{formData[descriptionKey]}</p>
                {formData[priceKey] && <p className="mt-1 font-mono text-sm font-black text-caramel">{formData[priceKey]}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const MediaUploader = ({ label, icon, value, uploading, accept, onUpload, onClear }: { label: string; icon: "image" | "video"; value: string; uploading: boolean; accept: string; onUpload: (file: File) => void; onClear: () => void }) => {
  const Icon = icon === "image" ? ImageIcon : FileVideo;
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1 text-xs"><Icon className="h-3 w-3" /> {label}</Label>
      {value && icon === "image" ? (
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/60">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <button type="button" onClick={onClear} className="absolute right-2 top-2 rounded-full bg-destructive p-2 text-white"><Trash2 className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input value={value} onChange={() => undefined} placeholder={icon === "video" ? "Vidéo importée ou lien vidéo" : "Aucune photo"} readOnly className="h-12 flex-1 rounded-2xl" />
          {value && <Button type="button" variant="outline" size="icon" onClick={onClear} className="h-12 w-12 rounded-2xl text-destructive"><Trash2 className="h-4 w-4" /></Button>}
          <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border bg-background hover:bg-accent">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <input type="file" accept={accept} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }} />
          </label>
        </div>
      )}
    </div>
  );
};

export default SecretMenuAdminPanel;
