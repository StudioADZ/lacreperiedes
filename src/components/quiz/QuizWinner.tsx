import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, MessageCircle, Calendar, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizWinnerProps {
  firstName: string;
  prize: string;
  prizeCode: string;
  onPlayAgain: () => void;
}

const QuizWinner = ({ firstName, prize, prizeCode, onPlayAgain }: QuizWinnerProps) => {
  const confettiRef = useRef(false);

  useEffect(() => {
    if (!confettiRef.current) {
      confettiRef.current = true;

      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#b8860b', '#daa520', '#ffd700', '#228b22', '#f5deb3'],
      });

      // Side cannons
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#b8860b', '#daa520', '#ffd700'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#b8860b', '#daa520', '#ffd700'],
        });
      }, 500);

      // Celebration sparkles
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#228b22', '#32cd32', '#90ee90'],
        });
      }, 1000);
    }
  }, []);

  const verifyUrl = `${window.location.origin}/verify/${prizeCode}`;
  const isFormuleComplete = prize.toLowerCase().includes('formule');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Winner Card */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-glow card-quiz-hero text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>

        <h2 className="font-display text-2xl font-bold mb-2">
          Bravo {firstName} !
        </h2>

        <p className="text-muted-foreground mb-4">Vous avez gagné :</p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-caramel/20 to-caramel/10 border-2 border-caramel/30"
        >
          <Gift className="w-5 h-5 text-caramel" />
          <span className="font-display text-xl font-bold text-primary">
            {prize}
          </span>
        </motion.div>
      </motion.div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card-warm text-center"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Présentez ce QR code au restaurant
        </p>

        <div className="inline-block p-4 bg-white rounded-2xl shadow-md">
          <QRCodeSVG
            value={verifyUrl}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="mt-4 p-3 rounded-xl bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">Votre code</p>
          <p className="font-mono text-xl font-bold tracking-wider text-primary">
            {prizeCode}
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-3"
      >
        {/* Google Review */}
        <a
          href="https://share.google/S2rTY32yn85OO48yT"
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

        {/* WhatsApp - Direct number */}
        <a
          href="https://wa.me/33781246918?text=Bonjour%20!%20J%27ai%20gagn%C3%A9%20au%20Quiz%20%F0%9F%8E%89"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-5 border-2 border-herb/30 hover:bg-herb/5"
          >
            <MessageCircle className="w-5 h-5 text-herb" />
            <span>WhatsApp • 07 81 24 69 18</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </a>

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
      </motion.div>

      {/* Info */}
      <p className="text-xs text-center text-muted-foreground">
        Lot valable pendant toute la semaine en cours.
        <br />
        Présentez votre QR code au restaurant pour récupérer votre gain.
      </p>
    </motion.div>
  );
};

export default QuizWinner;