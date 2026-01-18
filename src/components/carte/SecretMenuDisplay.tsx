import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Flame, Snowflake, Euro, Loader2, Lock } from 'lucide-react';
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
}

interface SecretMenuDisplayProps {
  /**
   * ✅ SAFE: si non fourni, on garde le comportement actuel (specials visibles).
   * Si false, on masque uniquement les 2 specials (galette+crêpe), tout le reste reste visible.
   */
  hasAccess?: boolean;
}

const formatDateSafe = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
};

const toYoutubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // youtu.be/<id>
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

  // youtube.com/watch?v=<id>
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

  // youtube.com/embed/<id>
  const embed = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;

  return null;
};

const isLikelyYoutube = (url?: string | null) =>
  !!url && (url.includes('youtube.com') || url.includes('youtu.be'));

const SecretMenuDisplay = ({ hasAccess = true }: SecretMenuDisplayProps) => {
  const [menu, setMenu] = useState<SecretMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('secret_menu')
        .select(
          'menu_name, galette_special, galette_special_description, galette_special_price, galette_special_image_url, galette_special_video_url, crepe_special, crepe_special_description, crepe_special_price, crepe_special_image_url, crepe_special_video_url, galette_items, crepe_items, valid_from, valid_to'
        )
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

  const cleanGaletteItems = useMemo(() => {
    if (!menu) return [];
    return (menu.galette_items || [])
      .filter((i) => i?.name?.trim())
      .slice(0, 3);
  }, [menu]);

  const cleanCrepeItems = useMemo(() => {
    if (!menu) return [];
    return (menu.crepe_items || [])
      .filter((i) => i?.name?.trim())
      .slice(0, 3);
  }, [menu]);

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

  const validFromLabel = formatDateSafe(menu.valid_from);
  const validToLabel = formatDateSafe(menu.valid_to);

  const renderMenuItem = (item: MenuItem, index: number) => (
    <motion.div
      key={`${item.name}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="p-4 rounded-xl bg-background/50 border border-caramel/20"
    >
      {item.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-3">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h4 className="font-display font-bold text-primary">{item.name}</h4>
          {!!item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
        </div>

        {!!item.price && (
          <span className="font-display font-bold text-caramel whitespace-nowrap flex items-center gap-1">
            {item.price}
          </span>
        )}
      </div>
    </motion.div>
  );

  const hasAnySpecial = !!(menu.galette_special || menu.crepe_special);
  const showSpecials = hasAccess;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-caramel/10 text-caramel mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Menu Exclusif</span>
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">{menu.menu_name}</h1>

        {(validFromLabel || validToLabel) && (
          <p className="text-sm text-muted-foreground">
            Valable{validFromLabel ? ` du ${validFromLabel}` : ''}{validToLabel ? ` au ${validToLabel}` : ''}
          </p>
        )}
      </motion.div>

      {/* Featured Specials */}
      {hasAnySpecial && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-caramel" />
            Spécialités du Chef
          </h3>

          {!showSpecials ? (
            // ✅ SAFE: specials masqués uniquement si hasAccess=false
            <div className="card-glow p-5 border-2 border-caramel/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-caramel/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-7 h-7 text-caramel" />
                </div>
                <p className="font-display font-bold text-center">Spécialités verrouillées</p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Ces 2 créations (galette + crêpe) sont réservées au code du week-end.
                </p>
              </div>
            </div>
          ) : (
            <>
              {menu.galette_special && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="card-glow p-5 border-2 border-caramel/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-terracotta" />
                    <span className="font-semibold text-sm text-terracotta">Galette Signature</span>
                  </div>

                  {(menu.galette_special_image_url || menu.galette_special_video_url) && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      {menu.galette_special_video_url ? (
                        <div className="aspect-video bg-black">
                          {isLikelyYoutube(menu.galette_special_video_url) ? (
                            <iframe
                              src={toYoutubeEmbedUrl(menu.galette_special_video_url) || undefined}
                              className="w-full h-full"
                              allowFullScreen
                              title="Galette vidéo"
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
                      ) : (
                        menu.galette_special_image_url && (
                          <img
                            src={menu.galette_special_image_url}
                            alt={menu.galette_special}
                            className="w-full aspect-video object-cover"
                            loading="lazy"
                          />
                        )
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
                  transition={{ delay: 0.2 }}
                  className="card-glow p-5 border-2 border-caramel/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Snowflake className="w-5 h-5 text-caramel" />
                    <span className="font-semibold text-sm text-caramel">Crêpe Signature</span>
                  </div>

                  {(menu.crepe_special_image_url || menu.crepe_special_video_url) && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      {menu.crepe_special_video_url ? (
                        <div className="aspect-video bg-black">
                          {isLikelyYoutube(menu.crepe_special_video_url) ? (
                            <iframe
                              src={toYoutubeEmbedUrl(menu.crepe_special_video_url) || undefined}
                              className="w-full h-full"
                              allowFullScreen
                              title="Crêpe vidéo"
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
                      ) : (
                        menu.crepe_special_image_url && (
                          <img
                            src={menu.crepe_special_image_url}
                            alt={menu.crepe_special}
                            className="w-full aspect-video object-cover"
                            loading="lazy"
                          />
                        )
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
            </>
          )}
        </div>
      )}

      {/* Galettes Section */}
      {cleanGaletteItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-terracotta" />
            Galettes
          </h3>
          <div className="space-y-3">{cleanGaletteItems.map((item, index) => renderMenuItem(item, index))}</div>
        </div>
      )}

      {/* Crêpes Section */}
      {cleanCrepeItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-caramel" />
            Crêpes
          </h3>
          <div className="space-y-3">
            {cleanCrepeItems.map((item, index) => renderMenuItem(item, index + 3))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center p-6 rounded-2xl bg-caramel/5 border border-caramel/10"
      >
        <p className="text-sm text-muted-foreground">
          {hasAccess ? '🔒 Ce menu exclusif est réservé aux participants du quiz' : '✨ Les galettes et crêpes sont visibles, mais les 2 spécialités sont réservées au code.'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Les créations changent chaque semaine !</p>
      </motion.div>
    </motion.div>
  );
};

export default SecretMenuDisplay;
