import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Flame, Snowflake, Euro, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

interface SecretMenuData {
  menu_name: string;
  galette_special: string | null;
  galette_special_description: string | null;
  crepe_special: string | null;
  crepe_special_description: string | null;
  galette_items: MenuItem[];
  crepe_items: MenuItem[];
  valid_from: string;
  valid_to: string;
}

const SecretMenuDisplay = () => {
  const [menu, setMenu] = useState<SecretMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('secret_menu')
        .select('menu_name, galette_special, galette_special_description, crepe_special, crepe_special_description, galette_items, crepe_items, valid_from, valid_to')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMenu({
          ...data,
          galette_items: Array.isArray(data.galette_items) ? (data.galette_items as unknown as MenuItem[]) : [],
          crepe_items: Array.isArray(data.crepe_items) ? (data.crepe_items as unknown as MenuItem[]) : [],
        });
      }
    } catch (error) {
      console.error('Error fetching secret menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-caramel" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="card-warm text-center py-8">
        <p className="text-muted-foreground">Le menu secret n'est pas encore disponible.</p>
      </div>
    );
  }

  const renderMenuItem = (item: MenuItem, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-background/50 border border-caramel/20"
    >
      {item.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-3">
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h4 className="font-display font-bold text-primary">{item.name}</h4>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </div>
        <span className="font-display font-bold text-caramel whitespace-nowrap flex items-center gap-1">
          {item.price}
        </span>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-caramel/10 text-caramel mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Menu Exclusif</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">{menu.menu_name}</h1>
        <p className="text-sm text-muted-foreground">
          Valable du {new Date(menu.valid_from).toLocaleDateString('fr-FR')} au {new Date(menu.valid_to).toLocaleDateString('fr-FR')}
        </p>
      </motion.div>

      {/* Featured Specials */}
      {(menu.galette_special || menu.crepe_special) && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-caramel" />
            Spécialités du Chef
          </h3>

          {menu.galette_special && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-glow p-5 border-2 border-caramel/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-terracotta" />
                <span className="font-semibold text-sm text-terracotta">Galette Signature</span>
              </div>
              <h4 className="font-display text-xl font-bold text-primary">{menu.galette_special}</h4>
              {menu.galette_special_description && (
                <p className="text-muted-foreground mt-2">{menu.galette_special_description}</p>
              )}
            </motion.div>
          )}

          {menu.crepe_special && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card-glow p-5 border-2 border-caramel/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="w-5 h-5 text-caramel" />
                <span className="font-semibold text-sm text-caramel">Crêpe Signature</span>
              </div>
              <h4 className="font-display text-xl font-bold text-primary">{menu.crepe_special}</h4>
              {menu.crepe_special_description && (
                <p className="text-muted-foreground mt-2">{menu.crepe_special_description}</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Galettes Section */}
      {menu.galette_items.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-terracotta" />
            Galettes Secrètes
          </h3>
          <div className="space-y-3">
            {menu.galette_items.map((item, index) => renderMenuItem(item, index))}
          </div>
        </div>
      )}

      {/* Crêpes Section */}
      {menu.crepe_items.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-caramel" />
            Crêpes Secrètes
          </h3>
          <div className="space-y-3">
            {menu.crepe_items.map((item, index) => renderMenuItem(item, index + 3))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center p-6 rounded-2xl bg-caramel/5 border border-caramel/10"
      >
        <p className="text-sm text-muted-foreground">
          🔒 Ce menu exclusif est réservé aux participants du quiz
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Les créations changent chaque semaine !
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SecretMenuDisplay;
