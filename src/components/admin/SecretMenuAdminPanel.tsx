import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Save, 
  ChefHat, 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload,
  Flame,
  Snowflake,
  Calendar,
  Video,
  Image,
  ExternalLink,
  Eye,
  Euro
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

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
  galette_items: MenuItem[];
  crepe_items: MenuItem[];
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

interface SecretMenuAdminPanelProps {
  adminPassword: string;
}

const emptyMenuItem: MenuItem = { name: '', description: '', price: '' };

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
    galette_items: [{ ...emptyMenuItem }, { ...emptyMenuItem }, { ...emptyMenuItem }] as MenuItem[],
    crepe_items: [{ ...emptyMenuItem }, { ...emptyMenuItem }, { ...emptyMenuItem }] as MenuItem[],
    valid_from: '',
    valid_to: '',
  });
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
        // Parse the data with proper typing
        const rawGaletteItems = data.galette_items;
        const rawCrepeItems = data.crepe_items;
        
        const galetteItems: MenuItem[] = Array.isArray(rawGaletteItems) 
          ? (rawGaletteItems as unknown as MenuItem[]) 
          : [];
        const crepeItems: MenuItem[] = Array.isArray(rawCrepeItems) 
          ? (rawCrepeItems as unknown as MenuItem[]) 
          : [];

        const menuData: SecretMenu = {
          ...data,
          galette_items: galetteItems,
          crepe_items: crepeItems,
        };
        setMenu(menuData);

        // Ensure we always have 3 items
        while (galetteItems.length < 3) galetteItems.push({ ...emptyMenuItem });
        while (crepeItems.length < 3) crepeItems.push({ ...emptyMenuItem });

        setFormData({
          menu_name: menuData.menu_name || '',
          secret_code: menuData.secret_code || '',
          galette_special: menuData.galette_special || '',
          galette_special_description: menuData.galette_special_description || '',
          galette_special_price: menuData.galette_special_price || '',
          galette_special_image_url: menuData.galette_special_image_url || '',
          galette_special_video_url: menuData.galette_special_video_url || '',
          crepe_special: menuData.crepe_special || '',
          crepe_special_description: menuData.crepe_special_description || '',
          crepe_special_price: menuData.crepe_special_price || '',
          crepe_special_image_url: menuData.crepe_special_image_url || '',
          crepe_special_video_url: menuData.crepe_special_video_url || '',
          galette_items: galetteItems.slice(0, 3),
          crepe_items: crepeItems.slice(0, 3),
          valid_from: menuData.valid_from?.split('T')[0] || '',
          valid_to: menuData.valid_to?.split('T')[0] || '',
        });
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!menu) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Filter out empty items
      const cleanGaletteItems = formData.galette_items.filter(item => item.name.trim());
      const cleanCrepeItems = formData.crepe_items.filter(item => item.name.trim());

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_secret_menu',
          adminPassword,
          menuId: menu.id,
          menuData: {
            ...formData,
            galette_items: cleanGaletteItems,
            crepe_items: cleanCrepeItems,
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
    setFormData(prev => ({ ...prev, secret_code: `${randomCode}${randomNum}` }));
  };

  const handleImageUpload = async (type: 'galette' | 'crepe', index: number, file: File) => {
    const key = `${type}-${index}`;
    setUploadingImage(key);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `menu-${type}-${index}-${Date.now()}.${fileExt}`;
      const filePath = `secret-menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update form data
      const items = type === 'galette' ? [...formData.galette_items] : [...formData.crepe_items];
      items[index] = { ...items[index], image_url: publicUrl };

      if (type === 'galette') {
        setFormData(prev => ({ ...prev, galette_items: items }));
      } else {
        setFormData(prev => ({ ...prev, crepe_items: items }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors du téléchargement de l\'image' });
    } finally {
      setUploadingImage(null);
    }
  };

  // Upload special image
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

  // Upload special video
  const handleSpecialVideoUpload = async (type: 'galette' | 'crepe', file: File) => {
    const key = `special-${type}-video`;
    setUploadingVideo(key);

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Vidéo trop volumineuse (max 50MB). Utilisez un lien YouTube/externe.' });
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

  // Check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || 
           url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  // Get YouTube embed URL
  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const updateMenuItem = (type: 'galette' | 'crepe', index: number, field: keyof MenuItem, value: string) => {
    const items = type === 'galette' ? [...formData.galette_items] : [...formData.crepe_items];
    items[index] = { ...items[index], [field]: value };

    if (type === 'galette') {
      setFormData(prev => ({ ...prev, galette_items: items }));
    } else {
      setFormData(prev => ({ ...prev, crepe_items: items }));
    }
  };

  const removeImage = (type: 'galette' | 'crepe', index: number) => {
    const items = type === 'galette' ? [...formData.galette_items] : [...formData.crepe_items];
    items[index] = { ...items[index], image_url: undefined };

    if (type === 'galette') {
      setFormData(prev => ({ ...prev, galette_items: items }));
    } else {
      setFormData(prev => ({ ...prev, crepe_items: items }));
    }
  };

  const renderItemEditor = (type: 'galette' | 'crepe', index: number, item: MenuItem) => {
    const key = `${type}-${index}`;
    const icon = type === 'galette' ? <Flame className="w-4 h-4 text-terracotta" /> : <Snowflake className="w-4 h-4 text-caramel" />;
    const label = type === 'galette' ? `Galette ${index + 1}` : `Crêpe ${index + 1}`;

    return (
      <div key={key} className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-sm">{label}</span>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          {item.image_url ? (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img src={item.image_url} alt={item.name || label} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(type, index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
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

        {/* Name */}
        <Input
          value={item.name}
          onChange={(e) => updateMenuItem(type, index, 'name', e.target.value)}
          placeholder="Nom de la création"
          className="font-medium"
        />

        {/* Description */}
        <Textarea
          value={item.description}
          onChange={(e) => updateMenuItem(type, index, 'description', e.target.value)}
          placeholder="Ingrédients / description"
          rows={2}
        />

        {/* Price */}
        <Input
          value={item.price}
          onChange={(e) => updateMenuItem(type, index, 'price', e.target.value)}
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
        <h2 className="font-display text-xl font-bold">Menu Secret du Week-end</h2>
        <p className="text-sm text-muted-foreground">
          Semaine du {menu ? new Date(menu.week_start).toLocaleDateString('fr-FR') : '...'}
        </p>
        
        {/* Admin visibility info */}
        <div className="mt-4 p-3 rounded-xl bg-herb/10 border border-herb/30">
          <p className="text-xs text-herb font-medium">
            👁️ Vue Admin : 3 galettes + 3 crêpes visibles ici
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Côté public : invisible sans code secret valide
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-caramel" />
          Informations générales
        </h3>

        {/* Menu Name */}
        <div className="space-y-2">
          <Label htmlFor="menu_name">Nom du menu</Label>
          <Input
            id="menu_name"
            value={formData.menu_name}
            onChange={(e) => setFormData(prev => ({ ...prev, menu_name: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, secret_code: e.target.value.toUpperCase() }))}
              placeholder="CREPE2025"
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={generateCode}>
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Validity Period */}
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

      {/* Signature Specials */}
      <div className="card-warm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">✨ Spécialités du Week-end</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/carte', '_blank')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir rendu public
          </Button>
        </div>

        {/* Galette Special */}
        <div className="p-4 rounded-xl bg-terracotta/5 border border-terracotta/20 space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-terracotta" />
            <Label className="font-semibold">Spécial #1 - Galette Signature</Label>
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Image className="w-3 h-3" /> Photo
            </Label>
            {formData.galette_special_image_url ? (
              <div className="relative aspect-video rounded-lg overflow-hidden max-w-xs">
                <img 
                  src={formData.galette_special_image_url} 
                  alt="Galette special" 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, galette_special_image_url: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-terracotta/50 transition-colors">
                {uploadingImage === 'special-galette-image' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Ajouter photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSpecialImageUpload('galette', file);
                  }}
                  disabled={uploadingImage === 'special-galette-image'}
                />
              </label>
            )}
          </div>

          {/* Video Upload/URL */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Video className="w-3 h-3" /> Vidéo (upload MP4 ou lien YouTube)
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.galette_special_video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, galette_special_video_url: e.target.value }))}
                placeholder="https://youtube.com/... ou upload"
                className="flex-1"
              />
              <label className="flex items-center justify-center px-3 rounded-lg border border-input cursor-pointer hover:bg-accent transition-colors">
                {uploadingVideo === 'special-galette-video' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSpecialVideoUpload('galette', file);
                  }}
                  disabled={uploadingVideo === 'special-galette-video'}
                />
              </label>
              {formData.galette_special_video_url && (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, galette_special_video_url: '' }))}
                  className="p-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Video Preview */}
            {formData.galette_special_video_url && (
              <div className="aspect-video rounded-lg overflow-hidden max-w-xs bg-black">
                {getYoutubeEmbedUrl(formData.galette_special_video_url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(formData.galette_special_video_url) || ''}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={formData.galette_special_video_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
          </div>

          {/* Preview Card */}
          {formData.galette_special && (
            <div className="mt-4 p-3 rounded-lg bg-background/80 border border-terracotta/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Aperçu
              </p>
              <div className="flex gap-3">
                {formData.galette_special_image_url && (
                  <img 
                    src={formData.galette_special_image_url} 
                    alt="Preview" 
                    className="w-16 h-16 rounded object-cover"
                  />
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

        {/* Crepe Special */}
        <div className="p-4 rounded-xl bg-caramel/5 border border-caramel/20 space-y-4">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-caramel" />
            <Label className="font-semibold">Spécial #2 - Crêpe Signature</Label>
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Image className="w-3 h-3" /> Photo
            </Label>
            {formData.crepe_special_image_url ? (
              <div className="relative aspect-video rounded-lg overflow-hidden max-w-xs">
                <img 
                  src={formData.crepe_special_image_url} 
                  alt="Crepe special" 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, crepe_special_image_url: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-caramel/50 transition-colors">
                {uploadingImage === 'special-crepe-image' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Ajouter photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSpecialImageUpload('crepe', file);
                  }}
                  disabled={uploadingImage === 'special-crepe-image'}
                />
              </label>
            )}
          </div>

          {/* Video Upload/URL */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Video className="w-3 h-3" /> Vidéo (upload MP4 ou lien YouTube)
            </Label>
            <div className="flex gap-2">
              <Input
                value={formData.crepe_special_video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, crepe_special_video_url: e.target.value }))}
                placeholder="https://youtube.com/... ou upload"
                className="flex-1"
              />
              <label className="flex items-center justify-center px-3 rounded-lg border border-input cursor-pointer hover:bg-accent transition-colors">
                {uploadingVideo === 'special-crepe-video' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSpecialVideoUpload('crepe', file);
                  }}
                  disabled={uploadingVideo === 'special-crepe-video'}
                />
              </label>
              {formData.crepe_special_video_url && (
                <button
                  onClick={() => setFormData(prev => ({ ...prev, crepe_special_video_url: '' }))}
                  className="p-2 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Video Preview */}
            {formData.crepe_special_video_url && (
              <div className="aspect-video rounded-lg overflow-hidden max-w-xs bg-black">
                {getYoutubeEmbedUrl(formData.crepe_special_video_url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(formData.crepe_special_video_url) || ''}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={formData.crepe_special_video_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
          </div>

          {/* Preview Card */}
          {formData.crepe_special && (
            <div className="mt-4 p-3 rounded-lg bg-background/80 border border-caramel/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Aperçu
              </p>
              <div className="flex gap-3">
                {formData.crepe_special_image_url && (
                  <img 
                    src={formData.crepe_special_image_url} 
                    alt="Preview" 
                    className="w-16 h-16 rounded object-cover"
                  />
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
      </div>

      {/* Galettes Items */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-terracotta" />
          Galettes Secrètes (3 max)
        </h3>
        {formData.galette_items.map((item, index) => renderItemEditor('galette', index, item))}
      </div>

      {/* Crêpes Items */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-caramel" />
          Crêpes Secrètes (3 max)
        </h3>
        {formData.crepe_items.map((item, index) => renderItemEditor('crepe', index, item))}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-xl text-sm text-center ${
          saveMessage.type === 'success' 
            ? 'bg-herb/10 text-herb' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        className="w-full btn-hero py-6"
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Enregistrer le menu
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default SecretMenuAdminPanel;
