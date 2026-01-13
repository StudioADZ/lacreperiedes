import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, MapPin, Calendar, Star, Phone, HelpCircle, UtensilsCrossed, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  buttons?: QuickButton[];
}

interface QuickButton {
  emoji: string;
  label: string;
  action: () => void;
}

// Forbidden routes - never mention or link to these
const FORBIDDEN_ROUTES = ['/admin'];

const AssistantChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on admin page
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'bot',
        text: "Bonjour ! 👋 Je suis l'assistant de La Crêperie des Saveurs. Comment puis-je vous aider aujourd'hui ?",
      }]);
    }
  }, [isOpen, messages.length]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'quiz':
        addBotMessage("🎯 C'est parti ! Je vous emmène au quiz...");
        setTimeout(() => {
          setIsOpen(false);
          navigate('/quiz');
        }, 500);
        break;
      case 'reserver':
        addBotMessage("📅 Super ! Vous pouvez réserver via notre calendrier en ligne. Je vous y emmène !");
        setTimeout(() => {
          window.open('https://calendar.app.google/u5ibf9hWCsxUHDB68', '_blank');
        }, 1000);
        break;
      case 'avis':
        addBotMessage("⭐ Merci de vouloir nous laisser un avis ! Votre feedback nous aide à nous améliorer.");
        setTimeout(() => {
          window.open('https://share.google/S2rTY32yn85OO48yT', '_blank');
        }, 1000);
        break;
      case 'trouver':
        addBotMessage("📍 Nous sommes situés au :\n\n**17 Place Carnot**\nGalerie des Halles\n**72600 Mamers**\n\nJe vous ouvre Google Maps !");
        setTimeout(() => {
          window.open('https://maps.app.goo.gl/6KdHfHSUs1MbzakLA', '_blank');
        }, 1500);
        break;
      case 'legal':
        addBotMessage("📜 Vous trouverez notre règlement, politique de confidentialité et conditions d'utilisation sur la page dédiée.");
        setTimeout(() => navigate('/legal'), 1000);
        break;
      case 'carte':
        addBotMessage("🍽️ Notre carte secrète vous réserve des surprises ! Participez au quiz pour débloquer l'accès.");
        setTimeout(() => navigate('/carte'), 1000);
        break;
      case 'appeler':
        addBotMessage("📞 Vous pouvez nous appeler au **02 59 66 01 76**. Je lance l'appel !");
        setTimeout(() => {
          window.location.href = 'tel:0259660176';
        }, 1000);
        break;
      case 'whatsapp':
        addBotMessage("💬 Je vous redirige vers WhatsApp pour continuer la conversation !");
        setTimeout(() => {
          window.open('https://wa.me/message/QVZO5N4ZDR64M1', '_blank');
        }, 1000);
        break;
      default:
        break;
    }
  };

  const addBotMessage = (text: string, buttons?: QuickButton[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'bot',
      text,
      buttons
    }]);
  };

  const handleUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Process user message
    const lowerText = text.toLowerCase();

    // Check for forbidden content (admin access attempts)
    if (lowerText.includes('admin') || lowerText.includes('scanner') || 
        lowerText.includes('backoffice') || lowerText.includes('gestion') ||
        lowerText.includes('qr code') || lowerText.includes('valider lot')) {
      setTimeout(() => {
        addBotMessage("🔒 Zone staff uniquement.");
      }, 500);
      return;
    }

    // Horaires
    if (lowerText.includes('horaire') || lowerText.includes('heure') || lowerText.includes('ouvert')) {
      setTimeout(() => {
        addBotMessage("🕐 Nos horaires d'ouverture :\n\n**Samedi & Dimanche**\n• 12h00 - 14h00\n• 19h00 - 21h00\n\nFermé du lundi au vendredi.");
      }, 500);
      return;
    }

    // Adresse / Localisation
    if (lowerText.includes('adresse') || lowerText.includes('où') || lowerText.includes('trouver') || lowerText.includes('lieu') || lowerText.includes('localisation')) {
      handleQuickAction('trouver');
      return;
    }

    // Réservation
    if (lowerText.includes('réserv') || lowerText.includes('table') || lowerText.includes('booking')) {
      handleQuickAction('reserver');
      return;
    }

    // Quiz
    if (lowerText.includes('quiz') || lowerText.includes('jeu') || lowerText.includes('gagner') || lowerText.includes('jouer')) {
      handleQuickAction('quiz');
      return;
    }

    // Avis
    if (lowerText.includes('avis') || lowerText.includes('note') || lowerText.includes('étoile') || lowerText.includes('review')) {
      handleQuickAction('avis');
      return;
    }

    // Carte / Menu
    if (lowerText.includes('carte') || lowerText.includes('menu') || lowerText.includes('manger') || lowerText.includes('crêpe') || lowerText.includes('galette')) {
      handleQuickAction('carte');
      return;
    }

    // Contact / Téléphone
    if (lowerText.includes('téléphone') || lowerText.includes('appel') || lowerText.includes('contact') || lowerText.includes('numéro')) {
      handleQuickAction('appeler');
      return;
    }

    // WhatsApp
    if (lowerText.includes('whatsapp') || lowerText.includes('message')) {
      handleQuickAction('whatsapp');
      return;
    }

    // Règlement / RGPD
    if (lowerText.includes('règlement') || lowerText.includes('rgpd') || lowerText.includes('confidentialité') || lowerText.includes('condition') || lowerText.includes('légal')) {
      handleQuickAction('legal');
      return;
    }

    // Prix / Tarif
    if (lowerText.includes('prix') || lowerText.includes('tarif') || lowerText.includes('combien') || lowerText.includes('coût')) {
      setTimeout(() => {
        addBotMessage("💰 Nos prix sont doux ! Consultez notre carte pour découvrir nos formules. Pour les offres spéciales, participez au quiz et gagnez des crêpes gratuites ! 🎁");
      }, 500);
      return;
    }

    // Merci
    if (lowerText.includes('merci') || lowerText.includes('super') || lowerText.includes('génial')) {
      setTimeout(() => {
        addBotMessage("🥰 Avec plaisir ! N'hésitez pas si vous avez d'autres questions. À bientôt à La Crêperie des Saveurs ! 🥞");
      }, 500);
      return;
    }

    // Default response
    setTimeout(() => {
      addBotMessage("Je ne suis pas sûr de comprendre votre demande. Voici ce que je peux faire pour vous :\n\n• 🎯 Vous guider vers le quiz\n• 📅 Vous aider à réserver\n• 📍 Vous indiquer comment nous trouver\n• ⭐ Recueillir votre avis\n\nVous pouvez aussi continuer sur WhatsApp si vous préférez parler à un humain ! 💬");
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleUserMessage(inputValue.trim());
    }
  };

  const quickButtons = [
    { emoji: "🎯", label: "Jouer au quiz", action: () => handleQuickAction('quiz') },
    { emoji: "📅", label: "Réserver", action: () => handleQuickAction('reserver') },
    { emoji: "⭐", label: "Laisser un avis", action: () => handleQuickAction('avis') },
    { emoji: "🗺️", label: "Nous trouver", action: () => handleQuickAction('trouver') },
    { emoji: "📜", label: "Règlement / RGPD", action: () => handleQuickAction('legal') },
    { emoji: "🍽️", label: "Carte", action: () => handleQuickAction('carte') },
    { emoji: "📞", label: "Appeler", action: () => handleQuickAction('appeler') },
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            style={{
              boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)"
            }}
            aria-label="Ouvrir l'assistant"
          >
            <Bot className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] flex flex-col bg-gradient-to-b from-[hsl(35_45%_96%)] to-[hsl(40_40%_92%)] rounded-t-3xl shadow-2xl border-t border-caramel/20"
            style={{
              boxShadow: "0 -10px 40px rgba(0,0,0,0.15)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-caramel/10 bg-gradient-to-r from-caramel/10 to-butter/20 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-espresso">Assistant Crêperie</h3>
                  <p className="text-xs text-muted-foreground">En ligne • Répond instantanément</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-caramel/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-b border-caramel/10 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 border border-caramel/20 text-sm font-medium hover:bg-caramel/10 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <span>{btn.emoji}</span>
                    <span className="text-espresso">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[40vh]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-white border border-caramel/20 text-espresso rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp CTA */}
            <div className="px-4 py-2 border-t border-caramel/10">
              <button
                onClick={() => handleQuickAction('whatsapp')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                💬 Continuer sur WhatsApp
              </button>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-caramel/10 bg-white/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-caramel/20 bg-white text-espresso placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-primary hover:bg-primary/90"
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistantChat;
