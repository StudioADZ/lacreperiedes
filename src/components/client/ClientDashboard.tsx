import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  Gift,
  Calendar,
  History,
  Lock,
  Star,
  ChevronRight,
  Trophy,
  QrCode,
  LogOut,
  Copy,
  Check,
  Gamepad2,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import SocialFooter from '@/components/SocialFooter';
import ContactForm from './ContactForm';

interface PrizeHistory {
  id: string;
  prize_type: string;
  prize_code: string | null;
  won_at: string;
  is_claimed: boolean;
}

const getWeekStartLocalISODate = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) -> 6 (Sat)
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
};

const copyToClipboardSafe = async (text: string) => {
  // Modern
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!ok) throw new Error('copy_failed');
};

const ClientDashboard = () => {
  const { profile, user, signOut, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'prizes' | 'reservations' | 'settings' | 'contact'
  >('overview');

  const [prizes, setPrizes] = useState<PrizeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [codeCopied, setCodeCopied] = useState(false);
  const [canPlayThisWeek, setCanPlayThisWeek] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const run = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPrizes(isMounted), checkQuizEligibility(isMounted)]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  const fetchPrizes = async (isMounted: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prize_history')
        .select('*')
        .eq('user_id', user.id)
        .order('won_at', { ascending: false });

      if (error) throw error;
      if (isMounted) setPrizes(data || []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
      // UX safe: pas de toast agressif ici, on laisse l’écran vivre
    }
  };

  const checkQuizEligibility = async (isMounted: boolean) => {
    if (!user?.email) return;

    try {
      const weekStartStr = getWeekStartLocalISODate();

      const { data, error } = await supabase
        .from('quiz_participations')
        .select('id, prize_won')
        .eq('email', user.email)
        .eq('week_start', weekStartStr)
        .not('prize_won', 'is', null)
        .limit(1);

      if (error) throw error;

      if (isMounted) {
        setCanPlayThisWeek(!data || data.length === 0);
      }
    } catch (error) {
      console.error('Error checking quiz eligibility:', error);
      // Safe fallback: si on ne sait pas, on laisse "jouable" (moins frustrant)
      if (isMounted) setCanPlayThisWeek(true);
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

  const handleCopyCode = useCallback(async () => {
    const code = profile?.secret_menu_code;
    if (!code) return;

    try {
      await copyToClipboardSafe(code);
      setCodeCopied(true);
      toast.success('Code copié !');
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier automatiquement. Essayez un appui long sur le code.");
    }
  }, [profile?.secret_menu_code]);

  // Calculate loyalty progress (9 visits = free menu)
  const loyaltyProgress = useMemo(() => {
    if (!profile) return 0;
    const totalVisits = profile.total_visits || 0;
    return Math.min((totalVisits / 9) * 100, 100);
  }, [profile]);

  const visitsUntilReward = useMemo(() => {
    if (!profile) return 9;
    const totalVisits = profile.total_visits || 0;
    return Math.max(9 - totalVisits, 0);
  }, [profile]);

  const menuItems = useMemo(
    () => [
      { id: 'overview', label: 'Aperçu', icon: User },
      { id: 'prizes', label: 'Mes gains', icon: Gift },
      { id: 'reservations', label: 'Réservations', icon: Calendar },
      { id: 'contact', label: 'Contact', icon: ExternalLink }, // icon safe (sans changer logique)
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-caramel/20 to-terracotta/20 pt-20 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-caramel flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img src={logo} alt="La Crêperie" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold truncate">
                {profile?.first_name || 'Client'} {profile?.last_name || ''}
              </h1>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground font-mono">ID: {user?.id?.slice(0, 8)}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="flex-shrink-0"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Admin Access Button */}
          {isAdmin && (
            <Link to="/admin" className="block mt-4">
              <Button
                variant="outline"
                className="w-full gap-2 bg-herb/10 border-herb/30 text-herb hover:bg-herb/20"
              >
                <Shield className="w-4 h-4" />
                Accès Administration
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 -mt-2">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-warm p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-caramel" />
                Mes Progressions
              </h2>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            {/* Loyalty Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Programme Fidélité</span>
                <span className="text-caramel font-bold">{profile?.loyalty_points || 0} pts</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loyaltyProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-caramel to-terracotta rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {visitsUntilReward > 0
                  ? `🎯 Encore ${visitsUntilReward} visite${visitsUntilReward > 1 ? 's' : ''} pour un menu offert !`
                  : '🎉 Menu complet offert disponible !'}
              </p>
            </div>

            {/* Secret Menu Code */}
            {profile?.secret_menu_unlocked && profile?.secret_menu_code && (
              <div className="p-3 rounded-xl bg-herb/10 border border-herb/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-herb" />
                    <span className="text-sm font-medium">Code Menu Secret</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-1 h-8"
                    aria-label="Copier le code menu secret"
                  >
                    {codeCopied ? (
                      <Check className="w-4 h-4 text-herb" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-xs">{codeCopied ? 'Copié' : 'Copier'}</span>
                  </Button>
                </div>

                <p className="font-mono text-lg font-bold text-herb mt-1 select-all">
                  {profile.secret_menu_code}
                </p>

                <p className="text-[11px] text-muted-foreground mt-1">
                  Astuce : si la copie ne marche pas, appui long sur le code.
                </p>
              </div>
            )}

            {/* Quiz Eligibility */}
            <div
              className={`p-3 rounded-xl ${
                canPlayThisWeek ? 'bg-primary/10 border border-primary/30' : 'bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2
                    className={`w-4 h-4 ${canPlayThisWeek ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span className="text-sm font-medium">Quiz de la semaine</span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    canPlayThisWeek
                      ? 'bg-herb/20 text-herb'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}
                >
                  {canPlayThisWeek ? '1 partie disponible' : 'Déjà joué'}
                </span>
              </div>

              {canPlayThisWeek && (
                <Link to="/quiz" className="block mt-2">
                  <Button size="sm" className="w-full gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Jouer maintenant
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-border overflow-x-auto mt-4 px-4" role="tablist" aria-label="Navigation espace client">
        <div className="max-w-lg mx-auto flex w-full">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                activeTab === item.id
                  ? 'text-caramel border-b-2 border-caramel'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              role="tab"
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        <div className="max-w-lg mx-auto">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Secret Menu Card */}
              <Link to="/carte" className="block">
                <div className="card-warm p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        profile?.secret_menu_unlocked ? 'bg-herb/20 text-herb' : 'bg-muted text-muted-foreground'
                      }`}
                    >
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
              </Link>

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

              {/* Quiz Link */}
              <Link to="/quiz" className="block">
                <div className="card-warm p-4 bg-gradient-to-r from-primary/10 to-caramel/10 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Quiz Hebdomadaire</h3>
                      <p className="text-sm text-muted-foreground">Gagnez des crêpes gratuites chaque semaine !</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Link>

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
                    {prizes[0].prize_code && <QrCode className="w-8 h-8 text-caramel" />}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'prizes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">Historique des gains</h2>
                  <p className="text-sm text-muted-foreground">Tous vos coupons et lots gagnés</p>
                </div>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />}
              </div>

              {prizes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun gain pour le moment</p>
                  <p className="text-sm">Participez au quiz pour gagner !</p>
                  <Link to="/quiz">
                    <Button className="mt-4">Jouer au quiz</Button>
                  </Link>
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          prize.is_claimed ? 'bg-herb/20 text-herb' : 'bg-caramel/20 text-caramel'
                        }`}
                      >
                        {prize.is_claimed ? 'Réclamé' : 'À utiliser'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'reservations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="mb-4">
                <h2 className="font-display text-lg font-bold">Mes réservations</h2>
                <p className="text-sm text-muted-foreground">Gérez vos visites à la crêperie</p>
              </div>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Réservez votre table</p>
                <Button asChild className="bg-herb hover:bg-herb/90">
                  <a
                    href="https://calendar.app.google/nZShjcjWUyTcGLR97"
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

          {activeTab === 'contact' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="mb-4">
                <h2 className="font-display text-lg font-bold">Nous contacter</h2>
                <p className="text-sm text-muted-foreground">Envoyez-nous un message</p>
              </div>
              <ContactForm />
            </motion.div>
          )}
        </div>
      </div>

      <SocialFooter />
    </div>
  );
};

export default ClientDashboard;
