import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import ClientDashboard from '@/components/client/ClientDashboard';
import { Button } from '@/components/ui/button';
import { User, Gift, Calendar, Lock, Star, ChevronRight, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const Client = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-caramel" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <ClientDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-caramel/20 to-background px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-caramel shadow-lg">
            <img src={logo} alt="La Crêperie des Saveurs" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Espace Client</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Accédez à vos avantages exclusifs, suivez vos points fidélité et gérez vos réservations
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="px-4 py-8 space-y-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card-warm p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-caramel/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-caramel" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Points Fidélité</h3>
            <p className="text-sm text-muted-foreground">9 visites = 1 menu offert</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card-warm p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-terracotta/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-terracotta" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Carte Secrète</h3>
            <p className="text-sm text-muted-foreground">Accès au menu exclusif</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card-warm p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-herb/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-herb" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Historique Gains</h3>
            <p className="text-sm text-muted-foreground">Tous vos coupons et lots</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card-warm p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Réservations</h3>
            <p className="text-sm text-muted-foreground">Gérez vos visites</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </div>

      {/* Auth Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 pb-8 space-y-3 max-w-md mx-auto"
      >
        <Button 
          className="w-full h-12 text-base" 
          onClick={() => handleOpenAuth('login')}
        >
          <User className="w-5 h-5 mr-2" />
          Se connecter
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-12 text-base"
          onClick={() => handleOpenAuth('signup')}
        >
          Créer un compte
        </Button>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
};

export default Client;
