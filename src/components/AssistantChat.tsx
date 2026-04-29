import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calendar,
  FileText,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_REVIEW_LINK } from "@/components/common/GoogleReviewCTA";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=La%20cr%C3%AAperie%20des%20saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers";
const WHATSAPP_LINK = "https://wa.me/message/QVZO5N4ZDR64M1";
const PHONE_LINK = "tel:+33259660176";

interface Message {
  id: string;
  type: "user" | "bot";
  text: string;
}

type QuickActionKey =
  | "quiz"
  | "reserver"
  | "avis"
  | "trouver"
  | "legal"
  | "carte"
  | "appeler"
  | "whatsapp";

type QuickAction = {
  key: QuickActionKey;
  label: string;
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "reserver", label: "Réserver", icon: Calendar },
  { key: "avis", label: "Avis", icon: Star },
  { key: "trouver", label: "Nous trouver", icon: MapPin },
  { key: "carte", label: "Carte", icon: UtensilsCrossed },
  { key: "appeler", label: "Appeler", icon: Phone },
  { key: "legal", label: "Infos légales", icon: FileText },
];

const openExternal = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const AssistantChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounterRef = useRef(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHiddenRoute = pathname.startsWith("/admin") || pathname.startsWith("/verify");

  const createMessageId = () => {
    messageCounterRef.current += 1;
    return `${Date.now()}-${messageCounterRef.current}`;
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        type: "bot",
        text,
      },
    ]);
  };

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    setMessages([
      {
        id: createMessageId(),
        type: "bot",
        text: "Bonjour ! Je suis l’assistant de La Crêperie des Saveurs. Je peux vous aider à réserver, trouver l’adresse, voir la carte, jouer au quiz ou nous contacter.",
      },
    ]);
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleQuickAction = (action: QuickActionKey) => {
    switch (action) {
      case "quiz":
        addBotMessage("Je vous emmène au quiz. Bonne chance !");
        window.setTimeout(() => {
          setIsOpen(false);
          navigate("/quiz");
        }, 450);
        break;
      case "reserver":
        addBotMessage("Je vous ouvre notre calendrier de réservation.");
        window.setTimeout(() => openExternal(BOOKING_LINK), 650);
        break;
      case "avis":
        addBotMessage("Merci ! Votre avis aide beaucoup notre crêperie locale.");
        window.setTimeout(() => openExternal(GOOGLE_REVIEW_LINK), 650);
        break;
      case "trouver":
        addBotMessage("Nous sommes au 17 Place Carnot, Galerie des Halles, 72600 Mamers. Je vous ouvre Google Maps.");
        window.setTimeout(() => openExternal(MAPS_LINK), 650);
        break;
      case "legal":
        addBotMessage("Je vous ouvre la page des mentions légales et informations utiles.");
        window.setTimeout(() => navigate("/legal"), 450);
        break;
      case "carte":
        addBotMessage("Je vous emmène vers la carte de la crêperie.");
        window.setTimeout(() => navigate("/carte"), 450);
        break;
      case "appeler":
        addBotMessage("Vous pouvez nous appeler au 02 59 66 01 76. Je lance l’appel.");
        window.setTimeout(() => {
          window.location.href = PHONE_LINK;
        }, 450);
        break;
      case "whatsapp":
        addBotMessage("Je vous ouvre WhatsApp pour continuer la conversation.");
        window.setTimeout(() => openExternal(WHATSAPP_LINK), 650);
        break;
      default:
        break;
    }
  };

  const handleUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        type: "user",
        text,
      },
    ]);
    setInputValue("");

    const lowerText = normalizeText(text);

    if (
      lowerText.includes("admin") ||
      lowerText.includes("backoffice") ||
      lowerText.includes("gestion") ||
      lowerText.includes("qr code") ||
      lowerText.includes("staff")
    ) {
      window.setTimeout(() => addBotMessage("Cette zone est réservée à l’équipe."), 450);
      return;
    }

    if (lowerText.includes("horaire") || lowerText.includes("heure") || lowerText.includes("ouvert")) {
      window.setTimeout(
        () =>
          addBotMessage(
            "Nos horaires : samedi et dimanche, de 12h00 à 14h00 puis de 19h00 à 21h00. Fermé du lundi au vendredi.",
          ),
        450,
      );
      return;
    }

    if (lowerText.includes("adresse") || lowerText.includes("trouver") || lowerText.includes("lieu") || lowerText.includes("localisation")) {
      handleQuickAction("trouver");
      return;
    }

    if (lowerText.includes("reserv") || lowerText.includes("table") || lowerText.includes("booking")) {
      handleQuickAction("reserver");
      return;
    }

    if (lowerText.includes("quiz") || lowerText.includes("jeu") || lowerText.includes("gagner") || lowerText.includes("jouer")) {
      handleQuickAction("quiz");
      return;
    }

    if (lowerText.includes("avis") || lowerText.includes("note") || lowerText.includes("etoile") || lowerText.includes("review")) {
      handleQuickAction("avis");
      return;
    }

    if (lowerText.includes("carte") || lowerText.includes("menu") || lowerText.includes("manger") || lowerText.includes("crepe") || lowerText.includes("galette")) {
      handleQuickAction("carte");
      return;
    }

    if (lowerText.includes("telephone") || lowerText.includes("appel") || lowerText.includes("contact") || lowerText.includes("numero")) {
      handleQuickAction("appeler");
      return;
    }

    if (lowerText.includes("whatsapp") || lowerText.includes("message")) {
      handleQuickAction("whatsapp");
      return;
    }

    if (lowerText.includes("reglement") || lowerText.includes("rgpd") || lowerText.includes("confidentialite") || lowerText.includes("condition") || lowerText.includes("legal")) {
      handleQuickAction("legal");
      return;
    }

    if (lowerText.includes("prix") || lowerText.includes("tarif") || lowerText.includes("combien") || lowerText.includes("cout")) {
      window.setTimeout(
        () => addBotMessage("Vous pouvez consulter nos prix sur la carte. Et pour les surprises, le quiz peut débloquer des offres."),
        450,
      );
      return;
    }

    if (lowerText.includes("merci") || lowerText.includes("super") || lowerText.includes("genial")) {
      window.setTimeout(() => addBotMessage("Avec plaisir ! À bientôt à La Crêperie des Saveurs."), 450);
      return;
    }

    window.setTimeout(
      () =>
        addBotMessage(
          "Je peux vous aider à réserver, trouver l’adresse, consulter la carte, jouer au quiz, laisser un avis ou nous contacter sur WhatsApp.",
        ),
      450,
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextValue = inputValue.trim();
    if (nextValue) handleUserMessage(nextValue);
  };

  if (isHiddenRoute) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
            aria-label="Ouvrir l’assistant"
          >
            <Bot className="h-7 w-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 100, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl border-t border-caramel/20 bg-gradient-to-b from-[hsl(35_45%_96%)] to-[hsl(40_40%_92%)] shadow-2xl sm:bottom-6 sm:left-auto sm:right-4 sm:w-[24rem] sm:rounded-3xl sm:border"
            style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Assistant Crêperie"
          >
            <div className="flex items-center justify-between rounded-t-3xl border-b border-caramel/10 bg-gradient-to-r from-caramel/10 to-butter/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-espresso">Assistant Crêperie</h3>
                  <p className="text-xs text-muted-foreground">Réservation, adresse, carte et contact</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-caramel/10"
                aria-label="Fermer l’assistant"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="border-b border-caramel/10 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => handleQuickAction(action.key)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-caramel/20 bg-white/80 px-3 py-2 text-sm font-medium text-espresso shadow-sm transition-colors hover:bg-caramel/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon className="h-4 w-4 text-caramel" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-[13rem] flex-1 space-y-4 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch]">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-caramel/20 bg-white text-espresso shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line text-sm">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-caramel/10 px-4 py-2">
              <button
                type="button"
                onClick={() => handleQuickAction("whatsapp")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
              >
                <MessageCircle className="h-4 w-4" />
                Continuer sur WhatsApp
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-caramel/10 bg-white/50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:pb-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Posez votre question..."
                  className="min-h-11 flex-1 rounded-full border border-caramel/20 bg-white px-4 py-2.5 text-base text-espresso placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90"
                  disabled={!inputValue.trim()}
                  aria-label="Envoyer le message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistantChat;
