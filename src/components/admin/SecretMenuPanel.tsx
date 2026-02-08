import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, ChefHat, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

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
  const [menu, setMenu] = useState<SecretMenu | null>(null);
  const [formData, setFormData] = useState({
    menu_name: '',
    secret_code: '',
    galette_special: '',
    galette_special_description: '',
    crepe_special: '',
    crepe_special_description: '',
  });
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreviewButton, setShowPreviewButton] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      // Fetch via admin-scan edge function (secret_menu table blocked for direct reads)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_secret_menu', adminPassword }),
      });

      if (!response.ok) throw new Error('Failed to fetch menu');

      const result = await response.json();
      const data = result.menu;

      if (data) {
        setMenu(data);
        setFormData({
          menu_name: data.menu_name || '',
          secret_code: data.secret_code || '',
          galette_special: data.galette_special || '',
          galette_special_description: data.galette_special_description || '',
          crepe_special: data.crepe_special || '',
          crepe_special_description: data.crepe_special_description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPublic = () => {
    window.open('/carte', '_blank');
  };

  const handleSave = async () => {
    if (!menu) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        menu_name: formData.menu_name.trim(),
        secret_code: formData.secret_code.trim().toUpperCase(),
        galette_special: formData.galette_special.trim(),
        galette_special_description: formData.galette_special_description.trim(),
        crepe_special: formData.crepe_special.trim(),
        crepe_special_description: formData.crepe_special_description.trim(),
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_secret_menu',
          adminPassword,
          menuId: menu.id,
          menuData: payload,
        }),
      });

      const result = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        setSaveMessage({ type: 'error', text: result.message || 'Erreur lors de la sauvegarde' });
        return;
      }

      setSaveMessage({ type: 'success', text: 'Menu secret mis à jour !' });
      await fetchMenu();
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setIsSaving(false);
    }
  };

  const generateCode = () => {
    const codes = ['CREPE', 'GALETTE', 'SARTHE', 'MAMERS', 'BRETAGNE', 'CIDRE', 'CARAMEL'];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    const randomNum = Math.floor(Math.random() * 100);
    setFormData(prev => ({ ...prev, secret_code: `${randomCode}${randomNum}` }));
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
          Semaine du {menu ? new Date(menu.week_start).toLocaleDateString('fr-FR') : '...'}
        </p>
      </div>

      {/* Preview toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-3">
          {showPreviewButton ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="font-medium text-sm">Bouton "Voir rendu public"</p>
            <p className="text-xs text-muted-foreground">Afficher le lien vers la page publique</p>
          </div>
        </div>
        <Switch checked={showPreviewButton} onCheckedChange={setShowPreviewButton} />
      </div>

      {showPreviewButton && (
        <Button variant="outline" className="w-full gap-2" onClick={handleViewPublic}>
          <Eye className="w-4 h-4" />
          Voir rendu public
        </Button>
      )}

      {/* Form */}
      <div className="card-warm space-y-4">
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
          <Label htmlFor="secret_code">Code secret</Label>
          <div className="flex gap-2">
            <Input
              id="secret_code"
              value={formData.secret_code}
              onChange={(e) => setFormData(prev => ({ ...prev, secret_code: e.target.value.toUpperCase() }))}
              placeholder="CREPE2025"
              className="font-mono"
            />
            <Button variant="outline" size="sm" onClick={generateCode} type="button">
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Code affiché aux gagnants pour accéder au menu secret
          </p>
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥞</span>
            <Label className="font-semibold">Galette spéciale du week-end</Label>
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
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍫</span>
            <Label className="font-semibold">Crêpe spéciale du week-end</Label>
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
        </div>

        {saveMessage && (
          <div
            className={`p-3 rounded-xl text-sm text-center ${
              saveMessage.type === 'success' ? 'bg-herb/10 text-herb' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        <Button onClick={handleSave} className="w-full btn-hero" disabled={isSaving}>
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
