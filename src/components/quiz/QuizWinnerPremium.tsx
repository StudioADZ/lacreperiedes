import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Star, 
  MessageCircle, 
  Calendar, 
  Gift, 
  Mail, 
  Loader2,
  ChefHat,
  Sparkles,
  Lock,
  Shield,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useSecretAccess } from '@/hooks/useSecretAccess';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface SecretMenu {
  secret_code: string;
  menu_name: string;
  galette_special: string | null;
  galette_special_description: string | null;
  crepe_special: string | null;
  crepe_special_description: string | null;
}

interface QuizWinnerPremiumProps {
  firstName: string;
  email: string;
  phone: string;
  prize: string;
  prizeCode: string;
  onPlayAgain: () => void;
}

// Generate security token that changes every 10 seconds (must match server)
const generateSecurityToken = (): string => {
  const now = Math.floor(Date.now() / 10000);
  const hash = ((now * 9301 + 49297) % 233280).toString();
  return hash.padStart(4, '0').slice(-4);
};

const QuizWinnerPremium = ({ 
  firstName, 
  email,
  phone,
  prize, 
  prizeCode, 
  onPlayAgain 
}: QuizWinnerPremiumProps) => {
  const confettiRef = useRef(false);
  const [secretMenu, setSecretMenu] = useState<SecretMenu | null>(null);
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const { grantAccessFromQuiz } = useSecretAccess();
  
  // Anti-fraud: Security token that changes every 10 seconds
  const [currentToken, setCurrentToken] = useState(generateSecurityToken());
  const [tokenCountdown, setTokenCountdown] = useState(10);
  const [showCode, setShowCode] = useState(false);

  // Update token every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = generateSecurityToken();
      if (newToken !== currentToken) {
        setCurrentToken(newToken);
        setTokenCountdown(10);
      } else {
        setTokenCountdown(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentToken]);

  useEffect(() => {
    if (!confettiRef.current) {
      confettiRef.current = true;

      // Epic celebration
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#b8860b', '#daa520', '#ffd700', '#228b22', '#f5deb3'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#b8860b', '#daa520', '#ffd700'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#b8860b', '#daa520', '#ffd700'],
        });
      }, 400);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.3 },
          colors: ['#228b22', '#32cd32', '#90ee90'],
        });
      }, 800);
    }

    // Fetch secret menu
    fetchSecretMenu();
  }, []);

  const fetchSecretMenu = async () => {
    try {
      const { data } = await supabase
        .from('secret_menu')
        .select('secret_code, menu_name, galette_special, galette_special_description, crepe_special, crepe_special_description')
        .eq('is_active', true)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setSecretMenu(data);
      }
    } catch (error) {
      console.error('Error fetching secret menu:', error);
    }
  };

  // Updated verify URL with query param format
  const verifyUrl = `${window.location.origin}/verify?code=${prizeCode}`;
  const isFormuleComplete = prize.toLowerCase().includes('formule');

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-prize-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          prize,
          prizeCode,
          verifyUrl,
          secretCode: secretMenu?.secret_code,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `🎉 J'ai gagné au Quiz de la Crêperie !\n\n` +
      `Mon lot : ${prize}\n` +
      `Mon code : ${prizeCode}\n\n` +
      `${secretMenu?.secret_code ? `Code secret du menu : ${secretMenu.secret_code}\n\n` : ''}` +
      `Je viens récupérer mon gain ! 🥞`
    );
    window.open(`https://wa.me/33781246918?text=${message}`, '_blank');
  };

  const handleUnlockMenu = async () => {
    if (!secretMenu?.secret_code) return;
    
    const token = await grantAccessFromQuiz(email, phone, firstName, secretMenu.secret_code);
    if (token) {
      setAccessGranted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Winner Card Premium */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-glow card-quiz-hero text-center py-8 border-2 border-caramel/50"
      >
        {/* Logo placeholder */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-caramel to-caramel/60 flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <ChefHat className="w-10 h-10 text-white" />
        </motion.div>

        {/* Badge Gagné */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="inline-block px-6 py-2 mb-4 rounded-full bg-gradient-to-r from-herb/20 to-herb/10 border-2 border-herb/40"
        >
          <span className="text-herb font-bold text-lg">🏆 GAGNÉ !</span>
        </motion.div>

        <h2 className="font-display text-2xl font-bold mb-2">
          Félicitations {firstName} !
        </h2>

        <p className="text-muted-foreground mb-4">Tu as gagné :</p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-caramel/20 to-caramel/10 border-2 border-caramel/30"
        >
          <Gift className="w-6 h-6 text-caramel" />
          <span className="font-display text-2xl font-bold text-primary">
            {prize}
          </span>
        </motion.div>
      </motion.div>

      {/* QR Code & Coupon with Security */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card-warm text-center"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Présente ce QR code au restaurant
        </p>

        <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border-2 border-caramel/20">
          <QRCodeSVG
            value={verifyUrl}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Security Token - Anti-fraud */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Jeton de sécurité</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-widest text-primary">
              {currentToken}
            </span>
            <div className="flex flex-col items-center">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${tokenCountdown <= 3 ? 'animate-spin' : ''}`} />
              <span className="text-xs text-muted-foreground">{tokenCountdown}s</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ce jeton change toutes les 10 secondes
          </p>
        </motion.div>

        {/* Code - Hidden by default */}
        <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Ton code unique</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              className="h-6 px-2"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="ml-1 text-xs">{showCode ? 'Masquer' : 'Afficher'}</span>
            </Button>
          </div>
          {showCode ? (
            <p className="font-mono text-2xl font-bold tracking-wider text-primary">
              {prizeCode}
            </p>
          ) : (
            <p className="font-mono text-2xl font-bold tracking-wider text-muted-foreground">
              ••••••••
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-xs text-destructive">
            ⚠️ Ne partage pas ce coupon. Il est nominatif et vérifié par le staff.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          ⏰ Valable 7 jours – 1 gain max par semaine
        </p>
      </motion.div>

      {/* Secret Menu Unlock */}
      {secretMenu && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card-glow border-2 border-dashed border-caramel/40"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-caramel" />
              <span className="font-display font-bold">Bonus Gagnant</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Tu débloques aussi l'accès au Menu Secret de la semaine !
            </p>

            {/* Secret Code Display */}
            <div className="p-4 rounded-xl bg-caramel/10 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Ton code secret</p>
              <p className="font-mono text-2xl font-bold text-caramel tracking-wider">
                {secretMenu.secret_code}
              </p>
            </div>

            {!accessGranted ? (
              <Button 
                onClick={handleUnlockMenu}
                className="w-full"
                variant="outline"
              >
                <Lock className="w-5 h-5 mr-2" />
                Débloquer le Menu Secret
              </Button>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-herb/10 border border-herb/30 mb-3">
                  <p className="text-herb font-semibold text-sm">✓ Accès débloqué !</p>
                </div>

                <a href="/carte" className="block">
                  <Button className="w-full" variant="outline">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Découvrir le Menu Secret
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </>
            )}

            {/* Preview menu specials */}
            {showSecretMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 text-left space-y-3"
              >
                <h4 className="font-display font-bold text-lg text-center">
                  {secretMenu.menu_name}
                </h4>
                
                {secretMenu.galette_special && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="font-semibold text-sm">🥞 Galette spéciale</p>
                    <p className="text-primary font-medium">{secretMenu.galette_special}</p>
                    {secretMenu.galette_special_description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {secretMenu.galette_special_description}
                      </p>
                    )}
                  </div>
                )}
                
                {secretMenu.crepe_special && (
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="font-semibold text-sm">🍫 Crêpe spéciale</p>
                    <p className="text-primary font-medium">{secretMenu.crepe_special}</p>
                    {secretMenu.crepe_special_description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {secretMenu.crepe_special_description}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {!showSecretMenu && accessGranted && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSecretMenu(true)}
                className="mt-2"
              >
                🔮 Aperçu rapide
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Send Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="space-y-3"
      >
        <p className="text-sm text-center text-muted-foreground mb-2">
          Recevoir mon coupon par :
        </p>

        {/* Email */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-5 border-2 border-primary/30 hover:bg-primary/5"
          onClick={handleSendEmail}
          disabled={sendingEmail || emailSent}
        >
          {sendingEmail ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : emailSent ? (
            <>✅ Email envoyé !</>
          ) : (
            <>
              <Mail className="w-5 h-5 text-primary" />
              <span>Recevoir par Email</span>
            </>
          )}
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-5 border-2 border-herb/30 hover:bg-herb/5"
          onClick={handleSendWhatsApp}
        >
          <MessageCircle className="w-5 h-5 text-herb" />
          <span>Recevoir par WhatsApp</span>
          <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
        </Button>
      </motion.div>

      {/* Additional Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="space-y-3"
      >
        {/* Google Review */}
        <a
          href="https://g.page/r/CVTqauGmET0TEAE/preview"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-5 border-2 border-caramel/30 hover:bg-caramel/5"
          >
            <Star className="w-5 h-5 text-caramel" />
            <span>Laisser un avis Google</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Merci, ça aide énormément une petite crêperie locale. 💛
        </p>

        {/* Book (only for Formule Complete) */}
        {isFormuleComplete && (
          <a
            href="https://calendar.app.google/u5ibf9hWCsxUHDB68"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="w-full btn-hero flex items-center justify-center gap-2 py-5">
              <Calendar className="w-5 h-5" />
              <span>Réserver une table</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
            </Button>
          </a>
        )}

        {/* Rejouer */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={onPlayAgain}
        >
          🎮 Rejouer
        </Button>
      </motion.div>

      {/* Info */}
      <p className="text-xs text-center text-muted-foreground">
        Lot valable pendant 7 jours.
        <br />
        Présente ton QR code au restaurant pour récupérer ton gain.
      </p>
    </motion.div>
  );
};

export default QuizWinnerPremium;
