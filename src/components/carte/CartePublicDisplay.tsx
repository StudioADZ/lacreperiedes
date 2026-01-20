import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Snowflake, Loader2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

const CartePublicDisplay = () => {
  const [galetteItems, setGaletteItems] = useState<MenuItem[]>([]);
  const [crepeItems, setCrepeItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCarte();
  }, []);

  const fetchCarte = async () => {
    try {
      const { data, error } = await supabase
        .from('carte_public')
        .select('galette_items, crepe_items')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGaletteItems(
          Array.isArray(data.galette_items) 
            ? (data.galette_items as unknown as MenuItem[]).filter(item => item.name) 
            : []
        );
        setCrepeItems(
          Array.isArray(data.crepe_items) 
            ? (data.crepe_items as unknown as MenuItem[]).filter(item => item.name) 
            : []
        );
      }
    } catch (error) {
      console.error('Error fetching carte:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMenuItem = (item: MenuItem, index: number, type: 'galette' | 'crepe') => (
    <motion.div
      key={`${type}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-colors"
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
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
        </div>
        {item.price && (
          <span className="font-display font-bold text-caramel whitespace-nowrap">
            {item.price}
          </span>
        )}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasContent = galetteItems.length > 0 || crepeItems.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <UtensilsCrossed className="w-4 h-4" />
          <span className="text-sm font-medium">Notre Carte</span>
        </div>
      </div>

      {/* Galettes Section */}
      {galetteItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-terracotta" />
            Galettes
          </h3>
          <div className="space-y-3">
            {galetteItems.map((item, index) => renderMenuItem(item, index, 'galette'))}
          </div>
        </div>
      )}

      {/* Crêpes Section */}
      {crepeItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-caramel" />
            Crêpes
          </h3>
          <div className="space-y-3">
            {crepeItems.map((item, index) => renderMenuItem(item, index, 'crepe'))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CartePublicDisplay;
