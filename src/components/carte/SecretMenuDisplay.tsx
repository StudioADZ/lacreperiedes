import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Flame, Snowflake, Euro, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SecretMenuData {
  menu_name: string;
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
  valid_from: string | null;
  valid_to: string | null;
}

const SecretMenuDisplay = () => {
  const [menu, setMenu] = useState<SecretMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      // Use the public view that hides the secret_code
      const { data, error } = await supabase
        .from('secret_menu_public')
        .select('menu_name, galette_special, galette_special_description, galette_special_price, galette_special_image_url, galette_special_video_url, crepe_special, crepe_special_description, crepe_special_price, crepe_special_image_url, crepe_special_video_url, valid_from, valid_to')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMenu(data as SecretMenuData);
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

  // Check if there's any special content
  const hasContent = menu.galette_special || menu.crepe_special;

  if (!hasContent) {
    return (
      <div className="card-warm text-center py-8">
        <p className="text-muted-foreground">Le menu secret de cette semaine arrive bientôt...</p>
      </div>
    );
  }

  // Format validity dates safely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
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
        {menu.menu_name && (
          <h2 className="font-display text-2xl font-bold mb-2">{menu.menu_name}</h2>
        )}
        {(menu.valid_from || menu.valid_to) && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            {menu.valid_from && formatDate(menu.valid_from)}
            {menu.valid_from && menu.valid_to && ' → '}
            {menu.valid_to && formatDate(menu.valid_to)}
          </p>
        )}
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
              
              {/* Media - Image or Video */}
              {(menu.galette_special_image_url || menu.galette_special_video_url) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {menu.galette_special_video_url ? (
                    <div className="aspect-video bg-black">
                      {menu.galette_special_video_url.includes('youtube') || menu.galette_special_video_url.includes('youtu.be') ? (
                        <iframe
                          src={menu.galette_special_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={menu.galette_special_video_url}
                          controls
                          className="w-full h-full object-contain"
                          poster={menu.galette_special_image_url || undefined}
                        />
                      )}
                    </div>
                  ) : menu.galette_special_image_url && (
                    <img 
                      src={menu.galette_special_image_url} 
                      alt={menu.galette_special}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                </div>
              )}
              
              <h4 className="font-display text-xl font-bold text-primary">{menu.galette_special}</h4>
              {menu.galette_special_description && (
                <p className="text-muted-foreground mt-2">{menu.galette_special_description}</p>
              )}
              {menu.galette_special_price && (
                <p className="mt-3 font-display text-lg font-bold text-terracotta flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {menu.galette_special_price}
                </p>
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
              
              {/* Media - Image or Video */}
              {(menu.crepe_special_image_url || menu.crepe_special_video_url) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {menu.crepe_special_video_url ? (
                    <div className="aspect-video bg-black">
                      {menu.crepe_special_video_url.includes('youtube') || menu.crepe_special_video_url.includes('youtu.be') ? (
                        <iframe
                          src={menu.crepe_special_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={menu.crepe_special_video_url}
                          controls
                          className="w-full h-full object-contain"
                          poster={menu.crepe_special_image_url || undefined}
                        />
                      )}
                    </div>
                  ) : menu.crepe_special_image_url && (
                    <img 
                      src={menu.crepe_special_image_url} 
                      alt={menu.crepe_special}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                </div>
              )}
              
              <h4 className="font-display text-xl font-bold text-primary">{menu.crepe_special}</h4>
              {menu.crepe_special_description && (
                <p className="text-muted-foreground mt-2">{menu.crepe_special_description}</p>
              )}
              {menu.crepe_special_price && (
                <p className="mt-3 font-display text-lg font-bold text-caramel flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {menu.crepe_special_price}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center p-4 rounded-xl bg-caramel/5 border border-caramel/10"
      >
        <p className="text-sm text-muted-foreground">
          🔒 Menu exclusif réservé aux participants du quiz
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Les créations changent chaque semaine !
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SecretMenuDisplay;
