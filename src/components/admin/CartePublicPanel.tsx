import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Save, 
  UtensilsCrossed, 
  Flame, 
  Snowflake, 
  Upload, 
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

interface CartePublicData {
  id: string;
  galette_items: MenuItem[];
  crepe_items: MenuItem[];
  updated_at: string;
}

interface CartePublicPanelProps {
  adminPassword: string;
}

const emptyMenuItem: MenuItem = { name: '', description: '', price: '' };

const CartePublicPanel = ({ adminPassword }: CartePublicPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [carte, setCarte] = useState<CartePublicData | null>(null);
  const [formData, setFormData] = useState({
    galette_items: [{ ...emptyMenuItem }, { ...emptyMenuItem }, { ...emptyMenuItem }] as MenuItem[],
    crepe_items: [{ ...emptyMenuItem }, { ...emptyMenuItem }, { ...emptyMenuItem }] as MenuItem[],
  });
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showPreviewButton, setShowPreviewButton] = useState(true);

  useEffect(() => {
    fetchCarte();
  }, []);

  const fetchCarte = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('carte_public')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const galetteItems: MenuItem[] = Array.isArray(data.galette_items) 
          ? (data.galette_items as unknown as MenuItem[]) 
          : [];
        const crepeItems: MenuItem[] = Array.isArray(data.crepe_items) 
          ? (data.crepe_items as unknown as MenuItem[]) 
          : [];

        // Ensure 3 items each
        while (galetteItems.length < 3) galetteItems.push({ ...emptyMenuItem });
        while (crepeItems.length < 3) crepeItems.push({ ...emptyMenuItem });

        setCarte({
          id: data.id,
          galette_items: galetteItems,
          crepe_items: crepeItems,
          updated_at: data.updated_at,
        });

        setFormData({
          galette_items: galetteItems.slice(0, 3),
          crepe_items: crepeItems.slice(0, 3),
        });
      }
    } catch (error) {
      console.error('Error fetching carte:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!carte) return;

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
          action: 'update_carte_public',
          adminPassword,
          carteId: carte.id,
          carteData: {
            galette_items: cleanGaletteItems,
            crepe_items: cleanCrepeItems,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Carte publique mise à jour !' });
        fetchCarte();
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (type: 'galette' | 'crepe', index: number, file: File) => {
    const key = `carte-${type}-${index}`;
    setUploadingImage(key);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `carte-${type}-${index}-${Date.now()}.${fileExt}`;
      const filePath = `carte-public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

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
    const key = `carte-${type}-${index}`;
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
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">La Carte (publique)</h2>
        <p className="text-sm text-muted-foreground">
          Menu visible par tous les visiteurs
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Dernière mise à jour : {carte ? new Date(carte.updated_at).toLocaleString('fr-FR') : '...'}
        </p>
      </div>

      {/* Preview Button Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-3">
          {showPreviewButton ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="font-medium text-sm">Bouton "Voir rendu public"</p>
            <p className="text-xs text-muted-foreground">Afficher le lien vers /carte</p>
          </div>
        </div>
        <Switch
          checked={showPreviewButton}
          onCheckedChange={setShowPreviewButton}
        />
      </div>

      {showPreviewButton && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open('/carte', '_blank')}
        >
          <Eye className="w-4 h-4" />
          Voir rendu public
        </Button>
      )}

      {/* Galettes Section */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-terracotta" />
          Galettes (max 3)
        </h3>
        <div className="space-y-4">
          {formData.galette_items.map((item, index) => renderItemEditor('galette', index, item))}
        </div>
      </div>

      {/* Crêpes Section */}
      <div className="card-warm space-y-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-caramel" />
          Crêpes (max 3)
        </h3>
        <div className="space-y-4">
          {formData.crepe_items.map((item, index) => renderItemEditor('crepe', index, item))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full btn-hero py-6"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Enregistrer la carte
          </>
        )}
      </Button>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-center ${
            saveMessage.type === 'success' 
              ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {saveMessage.text}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CartePublicPanel;
