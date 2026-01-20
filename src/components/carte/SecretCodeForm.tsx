import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, ChefHat, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ✅ Change ça si le rendu public est ailleurs
const PUBLIC_PREVIEW_PATH = '/carte';

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

  // UI-only (comme carte public)
  const [showPreviewButton, setShowPreviewButton] = useState(true);

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenu = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      // On tente, sans casser si RLS bloque
      try {
        await supabase.rpc('ensure_secret_menu');
      } catch (e) {
        console.warn('ensure_secret_menu failed (maybe RLS):', e);
      }

      const { data, error } = await supabase
        .from('secret_menu')
        .select('*')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMenu(null);
        setFormData({
          menu_name: '',
          secret_code: '',
          galette_special: '',
          galette_special_description: '',
          crepe_special: '',
          crepe_special_description: '',
        });
        return;
      }

      setMenu(data);
      setFormData({
        menu_name: data.menu_name || '',
        secret_code: data.secret_code || '',
        galette_special: data.galette_special || '',
        galette_special_description: data.galette_special_description || '',
        crepe_special: data.crepe_special || '',
        crepe_special_description: data.crepe_special_description || '',
      });
    } catch (error) {
      console.error('Error fetching menu:', error);
      setSaveMessage({
        type: 'error',
        text: "Impossible de charger le menu (RLS ?). Si besoin, on passera la lecture via admin-scan.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPublic = () => {
    window.open(PUBLIC_PREVIEW_PATH, '_blank');
  };

  // ✅ Helpers “non destructif”
  const normalize = (v: string) => v.trim();
  const normalizeUpper = (v: string) => v.trim().toUpperCase();

  // Convertit "" => null (si on veut effacer proprement)
  const emptyToNull = (v: string) => {
    const t = normalize(v);
    return t === '' ? null : t;
  };

  // Compare en tenant compte des nulls
  const same = (a: string | null | undefined, b: string | null | undefined) => (a ?? '') === (b ?? '');

  // ✅ Patch uniquement si ça change réellement
  const buildPatch = (m: SecretMenu) => {
    const patch: Record<string, any> = {};

    const nextMenuName = normalize(formData.menu_name);
    if (!same(m.menu_name, nextMenuName)) patch.menu_name = nextMenuName || m.menu_name; // on évite de vider par accident

    const nextCode = normalizeUpper(formData.secret_code);
    // Si l’input est vide => on ne touche PAS au code (anti-erreur)
    if (nextCode && !same(m.secret_code, nextCode)) patch.secret_code = nextCode;

    const nextGalette = emptyToNull(formData.galette_special);
    if (!same(m.galette_special, nextGalette)) patch.galette_special = nextGalette;

    const nextGaletteDesc = emptyToNull(formData.galette_special_description);
    if (!same(m.galette_special_description, nextGaletteDesc)) patch.galette_special_description = nextGaletteDesc;

    const nextCrepe = emptyToNull(formData.crepe_special);
    if (!same(m.crepe_special, nextCrepe)) patch.crepe_special = nextCrepe;

    const nextCrepeDesc = emptyToNull(formData.crepe_special_description);
    if (!same(m.crepe_special_description, nextCrepeDesc)) patch.crepe_special_description = nextCrepeDesc;

    return patch;
  };

  const canSave = useMemo(() => {
    return Boolean(menu) && Boolean(adminPassword?.trim()) && !isSaving;
  }, [menu, adminPassword, isSaving]);

  const handleSave = async () => {
    if (!menu) return;

    if (!adminPassword?.trim()) {
      setSaveMessage({ type: 'error', text: "Mot de passe admin manquant." });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const patch = buildPatch(menu);

      // Rien à sauvegarder => non destructif + feedback clair
      if (Object.keys(patch).length === 0) {
        setSaveMessage({ type: 'success', text: "Aucun changement à enregistrer." });
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_secret_menu',
          adminPassword,
          menuId: menu.id,
          // ✅ on envoie uniquement le patch (non destructif)
          menuData: patch,
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

      {/* Preview toggle + bouton */}
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
        {!menu && (
          <div className="p-3 rounded-xl text-sm text-center bg-destructive/10 text-destructive">
            Aucun menu actif trouvé (ou lecture bloquée par RLS).
          </div>
        )}

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
            Astuce SAFE : si tu laisses le champ vide, on ne change pas le code existant.
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
