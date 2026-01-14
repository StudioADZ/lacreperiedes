import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Gift, Calendar, History, Lock, Star, 
  ChevronRight, Trophy, QrCode, LogOut, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

interface PrizeHistory {
  id: string;
  prize_type: string;
  prize_code: string | null;
  won_at: string;
  is_claimed: boolean;
}

const ClientDashboard = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'prizes' | 'reservations' | 'settings'>('overview');
  const [prizes, setPrizes] = useState<PrizeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrizes();
    }
  }, [user]);

  const fetchPrizes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('prize_history')
        .select('*')
        .eq('user_id', user.id)
        .order('won_at', { ascending: false });

      if (error) throw error;
      setPrizes(data || []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Calculate loyalty progress (9 visits = free menu)
  const loyaltyProgress = profile ? Math.min((profile.total_visits / 9) * 100, 100) : 0;
  const visitsUntilReward = profile ? Math.max(9 - profile.total_visits, 0) : 9;

  const menuItems = [
    { id: 'overview', label: 'Aperçu', icon: User },
    { id: 'prizes', label: 'Mes gains', icon: Gift },
    { id: 'reservations', label: 'Réservations', icon: Calendar },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-caramel/20 to-terracotta/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-caramel">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src={logo} alt="La Crêperie" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold">
              {profile?.first_name || 'Client'} {profile?.last_name || ''}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Loyalty Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-card/80 backdrop-blur"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              <span className="font-semibold">Programme Fidélité</span>
            </div>
            <span className="text-sm text-caramel font-bold">
              {profile?.loyalty_points || 0} pts
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loyaltyProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-caramel to-terracotta rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {visitsUntilReward > 0 
              ? `Encore ${visitsUntilReward} visite${visitsUntilReward > 1 ? 's' : ''} pour un menu offert !`
              : '🎉 Menu complet offert disponible !'
            }
          </p>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-border overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
              activeTab === item.id
                ? 'text-caramel border-b-2 border-caramel'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Secret Menu Card */}
            <div className="card-warm p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  profile?.secret_menu_unlocked 
                    ? 'bg-herb/20 text-herb' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Lock className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Carte Secrète</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.secret_menu_unlocked 
                      ? 'Débloquée ! Accédez au menu exclusif'
                      : 'Participez au quiz pour débloquer'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-warm p-4 text-center">
                <Star className="w-8 h-8 mx-auto text-caramel mb-2" />
                <p className="text-2xl font-bold">{profile?.total_visits || 0}</p>
                <p className="text-xs text-muted-foreground">Visites</p>
              </div>
              <div className="card-warm p-4 text-center">
                <Gift className="w-8 h-8 mx-auto text-terracotta mb-2" />
                <p className="text-2xl font-bold">{prizes.length}</p>
                <p className="text-xs text-muted-foreground">Gains</p>
              </div>
            </div>

            {/* Recent Activity */}
            {prizes.length > 0 && (
              <div className="card-warm p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Dernier gain
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{prizes[0].prize_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(prizes[0].won_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {prizes[0].prize_code && (
                    <QrCode className="w-8 h-8 text-caramel" />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'prizes' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="font-display text-lg font-bold mb-4">Historique des gains</h2>
            {prizes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun gain pour le moment</p>
                <p className="text-sm">Participez au quiz pour gagner !</p>
              </div>
            ) : (
              prizes.map((prize) => (
                <div key={prize.id} className="card-warm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{prize.prize_type}</p>
                      <p className="text-xs text-muted-foreground">
                        Gagné le {new Date(prize.won_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prize.is_claimed 
                        ? 'bg-herb/20 text-herb' 
                        : 'bg-caramel/20 text-caramel'
                    }`}>
                      {prize.is_claimed ? 'Réclamé' : 'À utiliser'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'reservations' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold mb-4">Mes réservations</h2>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Réservez votre table</p>
              <Button asChild className="bg-herb hover:bg-herb/90">
                <a 
                  href="https://calendar.app.google/u5ibf9hWCsxUHDB68" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Réserver maintenant
                </a>
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold mb-4">Paramètres du compte</h2>
            <div className="card-warm p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Prénom</label>
                <p className="font-medium">{profile?.first_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Téléphone</label>
                <p className="font-medium">{profile?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Ville</label>
                <p className="font-medium">{profile?.city || '-'}</p>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
