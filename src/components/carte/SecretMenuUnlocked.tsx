import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Flame, Snowflake, Euro, Loader2, Calendar, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';

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

interface SecretMenuUnlockedProps {
  justUnlocked?: boolean;
  isAdminAccess?: boolean;
}

const SecretMenuUnlocked = ({ justUnlocked = false, isAdminAccess = false }: SecretMenuUnlockedProps) => {
  const [menu, setMenu] = useState<SecretMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWowEffect, setShowWowEffect] = useState(justUnlocked);

  useEffect(() => {
    fetchMenu();
    
    // Trigger confetti on first unlock
    if (justUnlocked) {
      triggerCelebration();
      // Hide WOW effect after animation
      const timer = setTimeout(() => setShowWowEffect(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [justUnlocked]);

  const triggerCelebration = () => {
    // Multiple bursts of confetti
    const colors = ['#C19A6B', '#8B5A2B', '#F5E6D3', '#D4A574', '#FFD700'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 400);
  };

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('secret_menu_public')
        .select('menu_name, galette_special, galette_special_description, galette_special_price, galette_special_image_url, galette_special_video_url, crepe_special, crepe_special_description, crepe_special_price, crepe_special_image_url, crepe_special_video_url, valid_from, valid_to')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setMenu(data as SecretMenuData);
    } catch (error) {
      console.error('Error fetching secret menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-caramel" />
      </div>
    );
  }

  if (!menu || (!menu.galette_special && !menu.crepe_special)) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-warm text-center py-8"
      >
        <Sparkles className="w-8 h-8 text-caramel mx-auto mb-3" />
        <p className="text-muted-foreground">Le menu secret de cette semaine arrive bientôt...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* WOW Unlock Animation */}
      {showWowEffect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="text-center py-4"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-caramel to-butter text-white font-bold shadow-xl"
          >
            <PartyPopper className="w-6 h-6" />
            Menu Débloqué !
            <PartyPopper className="w-6 h-6" />
          </motion.div>
        </motion.div>
      )}

      {/* Admin Badge */}
      {isAdminAccess && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-2 rounded-lg bg-primary/10 text-center"
        >
          <p className="text-xs text-primary font-medium">
            🔓 Accès Admin actif (permanent)
          </p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-caramel/20 to-butter/20 text-caramel mb-4"
          animate={{ 
            boxShadow: showWowEffect 
              ? ['0 0 0 0 rgba(193, 154, 107, 0)', '0 0 20px 5px rgba(193, 154, 107, 0.4)', '0 0 0 0 rgba(193, 154, 107, 0)']
              : 'none'
          }}
          transition={{ duration: 1.5, repeat: showWowEffect ? 3 : 0 }}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Menu Exclusif Débloqué</span>
          <Sparkles className="w-4 h-4" />
        </motion.div>
        
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
      <div className="space-y-4">
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display text-lg font-bold flex items-center gap-2"
        >
          <ChefHat className="w-5 h-5 text-caramel" />
          Spécialités du Chef
        </motion.h3>

        {menu.galette_special && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="card-glow p-5 border-2 border-caramel/30 bg-gradient-to-br from-background to-terracotta/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={showWowEffect ? { rotate: [0, 360] } : {}}
                transition={{ duration: 1 }}
              >
                <Flame className="w-5 h-5 text-terracotta" />
              </motion.div>
              <span className="font-semibold text-sm text-terracotta">Galette Signature</span>
            </div>
            
            {(menu.galette_special_image_url || menu.galette_special_video_url) && (
              <div className="mb-4 rounded-lg overflow-hidden shadow-lg">
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
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="card-glow p-5 border-2 border-caramel/30 bg-gradient-to-br from-background to-caramel/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={showWowEffect ? { rotate: [0, -360] } : {}}
                transition={{ duration: 1 }}
              >
                <Snowflake className="w-5 h-5 text-caramel" />
              </motion.div>
              <span className="font-semibold text-sm text-caramel">Crêpe Signature</span>
            </div>
            
            {(menu.crepe_special_image_url || menu.crepe_special_video_url) && (
              <div className="mb-4 rounded-lg overflow-hidden shadow-lg">
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

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center p-4 rounded-xl bg-gradient-to-r from-caramel/5 to-butter/10 border border-caramel/10"
      >
        <p className="text-sm text-muted-foreground">
          ✨ Félicitations ! Vous avez accès aux créations exclusives
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Les spécialités changent chaque semaine
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SecretMenuUnlocked;
