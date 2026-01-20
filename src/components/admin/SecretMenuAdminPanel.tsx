import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Save, 
  ChefHat, 
  Sparkles, 
  Flame,
  Snowflake,
  Calendar,
  Video,
  Image,
  Eye,
  Euro,
  Upload,
  Trash2,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SecretMenu {
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
}

interface SecretMenuAdminPanelProps {
  adminPassword: string;
}

const SecretMenuAdminPanel = ({ adminPassword }: SecretMenuAdminPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [menu, setMenu] = useState<SecretMenu | null>(null);
  const [formData, setFormData] = useState({
    menu_name: '',
    secret_code: '',
    galette_special: '',
    galette_special_description: '',
    galette_special_price: '',
    galette_special_image_url: '',
    galette_special_video_url: '',
    crepe_special: '',
    crepe_special_description: '',
    crepe_special_price: '',
    crepe_special_image_url: '',
    crepe_special_video_url: '',
    valid_from: '',
    valid_to: '',
    is_active: true,
  });
  const [dailyCode, setDailyCode] = useState<string | null>(null);
  const [dailyCodeCopied, setDailyCodeCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      await supabase.rpc('ensure_secret_menu');

      const { data, error } = await supabase
        .from('secret_menu')
        .select('*')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMenu(data as SecretMenu);

        setFormData({
          menu_name: data.menu_name || '',
          secret_code: data.secret_code || '',
          galette_special: data.galette_special || '',
          galette_special_description: data.galette_special_description || '',
          galette_special_price: data.galette_special_price || '',
          galette_special_image_url: data.galette_special_image_url || '',
          galette_special_video_url: data.galette_special_video_url || '',
          crepe_special: data.crepe_special || '',
          crepe_special_description: data.crepe_special_description || '',
          crepe_special_price: data.crepe_special_price || '',
          crepe_special_image_url: data.crepe_special_image_url || '',
          crepe_special_video_url: data.crepe_special_video_url || '',
          valid_from: data.valid_from?.split('T')[0] || '',
          valid_to: data.valid_to?.split('T')[0] || '',
          is_active: data.is_active,
        });

        // Get daily code
        if (data.secret_code) {
          fetchDailyCode(data.secret_code);
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyCode = async (secretCode: string) => {
    try {
      const { data } = await supabase.rpc('get_daily_code', { p_secret_code: secretCode });
      if (data) {
        setDailyCode(data);
      }
    } catch (error) {
      console.error('Error fetching daily code:', error);
    }
  };

  const handleSave = async () => {
    if (!menu) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_secret_menu',
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
        setSaveMessage({ type: 'success', text: 'Menu secret mis à jour !' });
        fetchMenu();
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = () => {
    const codes = ['CREPE', 'GALETTE', 'SARTHE', 'MAMERS', 'BRETAGNE', 'CIDRE', 'CARAMEL', 'SECRET'];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    const randomNum = Math.floor(Math.random() * 100);
    const newCode = `${randomCode}${randomNum}`;
    setFormData(prev => ({ ...prev, secret_code: newCode }));
    // Update daily code preview
    fetchDailyCode(newCode);
  };

  const copyDailyCode = () => {
    if (dailyCode) {
      navigator.clipboard.writeText(dailyCode);
      setDailyCodeCopied(true);
      setTimeout(() => setDailyCodeCopied(false), 2000);
    }
  };

  const handleSpecialImageUpload = async (type: 'galette' | 'crepe', file: File) => {
    const key = `special-${type}-image`;
    setUploadingImage(key);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `special-${type}-image-${Date.now()}.${fileExt}`;
      const filePath = `secret-menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (type === 'galette') {
        setFormData(prev => ({ ...prev, galette_special_image_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, crepe_special_image_url: publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading special image:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors du téléchargement de l\'image' });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSpecialVideoUpload = async (type: 'galette' | 'crepe', file: File) => {
    const key = `special-${type}-video`;
    setUploadingVideo(key);

    if (file.size > 50 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Vidéo trop volumineuse (max 50MB). Utilisez un lien YouTube.' });
      setUploadingVideo(null);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `special-${type}-video-${Date.now()}.${fileExt}`;
      const filePath = `secret-menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (type === 'galette') {
        setFormData(prev => ({ ...prev, galette_special_video_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, crepe_special_video_url: publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading special video:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors du téléchargement de la vidéo' });
    } finally {
      setUploadingVideo(null);
    }
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
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
        <div className="w-16 h-16 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-caramel" />
        </div>
        <h2 className="font-display text-xl font-bold">Menu Secret</h2>
        <p className="text-sm text-muted-foreground">
          Créations exclusives réservées aux initiés
        </p>
      </div>

      {/* Daily Code Display */}
      {dailyCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-glow p-4 border-2 border-caramel/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Code du jour (lecture seule)
              </p>
              <p className="font-mono text-2xl font-bold text-caramel">{dailyCode}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyDailyCode}
              className="gap-2"
            >
              {dailyCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {dailyCodeCopied ? 'Copié !' : 'Copier'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ce code change chaque jour pendant la période de validité.
          </p>
        </motion.div>
      )}

      {/* Activation Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div>
          <p className="font-medium text-sm">Menu Secret Actif</p>
          <p className="text-xs text-muted-foreground">Les clients peuvent débloquer le menu</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
      </div>

      {/* Basic Info */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-caramel" />
          Configuration
        </h3>

        <div className="space-y-2">
          <Label htmlFor="menu_name">Nom du menu</Label>
          <Input
            id="menu_name"
            value={formData.menu_name}
            onChange={(e) => setFormData(prev => ({ ...prev, menu_name: e.target.value }))}
            placeholder="Menu Secret du Week-end"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret_code">Code secret (base pour code du jour)</Label>
          <div className="flex gap-2">
            <Input
              id="secret_code"
              value={formData.secret_code}
              onChange={(e) => {
                const newCode = e.target.value.toUpperCase();
                setFormData(prev => ({ ...prev, secret_code: newCode }));
                if (newCode.length >= 4) fetchDailyCode(newCode);
              }}
              placeholder="CREPE2025"
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={generateCode}>
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valid_from" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Début
            </Label>
            <Input
              id="valid_from"
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_to" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fin
            </Label>
            <Input
              id="valid_to"
              type="date"
              value={formData.valid_to}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Galette Special */}
      <div className="card-warm space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-terracotta" />
          <h3 className="font-display font-bold">Galette Spéciale</h3>
        </div>

        <Input
          value={formData.galette_special}
          onChange={(e) => setFormData(prev => ({ ...prev, galette_special: e.target.value }))}
          placeholder="Nom de la galette"
        />
        <Textarea
          value={formData.galette_special_description}
          onChange={(e) => setFormData(prev => ({ ...prev, galette_special_description: e.target.value }))}
          placeholder="Ingrédients et description..."
          rows={2}
        />
        <div className="flex items-center gap-2">
          <Euro className="w-4 h-4 text-muted-foreground" />
          <Input
            value={formData.galette_special_price}
            onChange={(e) => setFormData(prev => ({ ...prev, galette_special_price: e.target.value }))}
            placeholder="Prix (ex: 12,50 €)"
            className="font-mono"
          />
        </div>

        {/* Image */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1">
            <Image className="w-3 h-3" /> Photo
          </Label>
          {formData.galette_special_image_url ? (
            <div className="relative aspect-video rounded-lg overflow-hidden max-w-xs">
              <img src={formData.galette_special_image_url} alt="Galette" className="w-full h-full object-cover" />
              <button
                onClick={() => setFormData(prev => ({ ...prev, galette_special_image_url: '' }))}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-terracotta/50">
              {uploadingImage === 'special-galette-image' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Ajouter photo</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSpecialImageUpload('galette', file);
              }} />
            </label>
          )}
        </div>

        {/* Video */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1">
            <Video className="w-3 h-3" /> Vidéo
          </Label>
          <div className="flex gap-2">
            <Input
              value={formData.galette_special_video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, galette_special_video_url: e.target.value }))}
              placeholder="https://youtube.com/..."
              className="flex-1"
            />
            <label className="flex items-center justify-center px-3 rounded-lg border cursor-pointer hover:bg-accent">
              {uploadingVideo === 'special-galette-video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSpecialVideoUpload('galette', file);
              }} />
            </label>
            {formData.galette_special_video_url && (
              <button onClick={() => setFormData(prev => ({ ...prev, galette_special_video_url: '' }))} className="p-2 rounded-lg border border-destructive/20 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {formData.galette_special_video_url && (
            <div className="aspect-video rounded-lg overflow-hidden max-w-xs bg-black">
              {getYoutubeEmbedUrl(formData.galette_special_video_url) ? (
                <iframe src={getYoutubeEmbedUrl(formData.galette_special_video_url) || ''} className="w-full h-full" allowFullScreen />
              ) : (
                <video src={formData.galette_special_video_url} controls className="w-full h-full object-contain" />
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {formData.galette_special && (
          <div className="p-3 rounded-lg bg-background/80 border border-terracotta/30">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Aperçu
            </p>
            <div className="flex gap-3">
              {formData.galette_special_image_url && (
                <img src={formData.galette_special_image_url} alt="Preview" className="w-16 h-16 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">{formData.galette_special}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{formData.galette_special_description}</p>
                {formData.galette_special_price && (
                  <p className="text-sm font-mono text-terracotta mt-1">{formData.galette_special_price}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crêpe Special */}
      <div className="card-warm space-y-4">
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-caramel" />
          <h3 className="font-display font-bold">Crêpe Spéciale</h3>
        </div>

        <Input
          value={formData.crepe_special}
          onChange={(e) => setFormData(prev => ({ ...prev, crepe_special: e.target.value }))}
          placeholder="Nom de la crêpe"
        />
        <Textarea
          value={formData.crepe_special_description}
          onChange={(e) => setFormData(prev => ({ ...prev, crepe_special_description: e.target.value }))}
          placeholder="Ingrédients et description..."
          rows={2}
        />
        <div className="flex items-center gap-2">
          <Euro className="w-4 h-4 text-muted-foreground" />
          <Input
            value={formData.crepe_special_price}
            onChange={(e) => setFormData(prev => ({ ...prev, crepe_special_price: e.target.value }))}
            placeholder="Prix (ex: 8,50 €)"
            className="font-mono"
          />
        </div>

        {/* Image */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1">
            <Image className="w-3 h-3" /> Photo
          </Label>
          {formData.crepe_special_image_url ? (
            <div className="relative aspect-video rounded-lg overflow-hidden max-w-xs">
              <img src={formData.crepe_special_image_url} alt="Crêpe" className="w-full h-full object-cover" />
              <button
                onClick={() => setFormData(prev => ({ ...prev, crepe_special_image_url: '' }))}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-caramel/50">
              {uploadingImage === 'special-crepe-image' ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Ajouter photo</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSpecialImageUpload('crepe', file);
              }} />
            </label>
          )}
        </div>

        {/* Video */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1">
            <Video className="w-3 h-3" /> Vidéo
          </Label>
          <div className="flex gap-2">
            <Input
              value={formData.crepe_special_video_url}
              onChange={(e) => setFormData(prev => ({ ...prev, crepe_special_video_url: e.target.value }))}
              placeholder="https://youtube.com/..."
              className="flex-1"
            />
            <label className="flex items-center justify-center px-3 rounded-lg border cursor-pointer hover:bg-accent">
              {uploadingVideo === 'special-crepe-video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSpecialVideoUpload('crepe', file);
              }} />
            </label>
            {formData.crepe_special_video_url && (
              <button onClick={() => setFormData(prev => ({ ...prev, crepe_special_video_url: '' }))} className="p-2 rounded-lg border border-destructive/20 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {formData.crepe_special_video_url && (
            <div className="aspect-video rounded-lg overflow-hidden max-w-xs bg-black">
              {getYoutubeEmbedUrl(formData.crepe_special_video_url) ? (
                <iframe src={getYoutubeEmbedUrl(formData.crepe_special_video_url) || ''} className="w-full h-full" allowFullScreen />
              ) : (
                <video src={formData.crepe_special_video_url} controls className="w-full h-full object-contain" />
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {formData.crepe_special && (
          <div className="p-3 rounded-lg bg-background/80 border border-caramel/30">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Aperçu
            </p>
            <div className="flex gap-3">
              {formData.crepe_special_image_url && (
                <img src={formData.crepe_special_image_url} alt="Preview" className="w-16 h-16 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">{formData.crepe_special}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{formData.crepe_special_description}</p>
                {formData.crepe_special_price && (
                  <p className="text-sm font-mono text-caramel mt-1">{formData.crepe_special_price}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {saveMessage && (
        <div className={`p-3 rounded-xl text-sm text-center ${
          saveMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <Button onClick={handleSave} className="w-full btn-hero py-6" disabled={isSaving}>
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Enregistrer le menu secret
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default SecretMenuAdminPanel;
