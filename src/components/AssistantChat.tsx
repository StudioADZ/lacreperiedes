import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  FileText,
  Gift,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  Trophy,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_REVIEW_LINK } from "@/components/common/GoogleReviewCTA";
import logo from "@/assets/logo.png";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=La%20cr%C3%AAperie%20des%20saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers";
const WHATSAPP_LINK = "https://wa.me/message/QVZO5N4ZDR64M1";
const PHONE_LINK = "tel:+33259660176";

type AssistantAction =
  | { type: "route"; to: string }
  | { type: "external"; href: string }
  | { type: "phone"; href: string };

interface MessageButton {
  label: string;
  icon?: LucideIcon;
  action: AssistantAction;
}

interface Message {
  id: string;
  type: "user" | "bot";
  text: string;
  buttons?: MessageButton[];
}

type QuickActionKey =
  | "quiz"
  | "reserver"
  | "avis"
  | "trouver"
  | "legal"
  | "carte"
  | "appeler"
  | "whatsapp"
  | "client";

type QuickAction = {
  key: QuickActionKey;
  label: string;
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  { key: "quiz", label: "Quiz", icon: Trophy },
  { key: "reserver", label: "Réserver", icon: Calendar },
  { key: "carte", label: "Carte", icon: UtensilsCrossed },
  { key: "client", label: "Compte", icon: Gift },
  { key: "trouver", label: "Nous trouver", icon: MapPin },
  { key: "avis", label: "Avis", icon: Star },
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

const AssistantAvatar = ({ compact = false }: { compact?: boolean }) => (
  <span
    className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-caramel/25 bg-ivory shadow-warm ${
      compact ? "h-10 w-10" : "h-12 w-12"
    }`}
  >
    <img
      src={logo}
      alt=""
      width={compact ? 40 : 48}
      height={compact ? 40 : 48}
      decoding="async"
      className="h-full w-full object-cover"
    />
  </span>
);

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

  const runAssistantAction = (action: AssistantAction) => {
    if (action.type === "route") {
      setIsOpen(false);
      navigate(action.to);
      return;
    }

    if (action.type === "phone") {
      window.location.href = action.href;
      return;
    }

    openExternal(action.href);
  };

  const addBotMessage = (text: string, buttons?: MessageButton[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        type: "bot",
        text,
        buttons,
      },
    ]);
  };

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    setMessages([
      {
        id: createMessageId(),
        type: "bot",
        text:
          "Bonjour ! Je suis l’assistant de La Crêperie des Saveurs. Je peux vous expliquer le quiz, les récompenses, la carte, l’espace client, les horaires, la réservation et comment nous contacter — sans vous balader partout pour rien.",
        buttons: [
          { label: "Comment marche le quiz ?", icon: Trophy, action: { type: "route", to: "/quiz" } },
          { label: "Réserver", icon: Calendar, action: { type: "external", href: BOOKING_LINK } },
        ],
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
        addBotMessage(
          "Le quiz hebdomadaire se joue en 10 questions. Vous avez 30 secondes par question. Selon votre score, vous pouvez gagner :\n\n• 100% : formule complète\n• 90 à 99% : galette\n• 80 à 89% : crêpe\n\nÀ la fin, si vous gagnez, l’application affiche un code/QR à présenter au restaurant. Une participation gagnante maximum par semaine et par personne.",
          [{ label: "Ouvrir le quiz", icon: Trophy, action: { type: "route", to: "/quiz" } }],
        );
        break;
      case "reserver":
        addBotMessage(
          "Pour réserver, utilisez le calendrier en ligne. Vous pouvez aussi nous appeler si vous préférez confirmer directement avec l’équipe.",
          [
            { label: "Ouvrir la réservation", icon: Calendar, action: { type: "external", href: BOOKING_LINK } },
            { label: "Appeler", icon: Phone, action: { type: "phone", href: PHONE_LINK } },
          ],
        );
        break;
      case "avis":
        addBotMessage(
          "Vous pouvez consulter les avis ou laisser le vôtre sur Google. Pour une petite crêperie locale, chaque avis compte vraiment.",
          [{ label: "Laisser un avis", icon: Star, action: { type: "external", href: GOOGLE_REVIEW_LINK } }],
        );
        break;
      case "trouver":
        addBotMessage(
          "Nous sommes à La Crêperie des Saveurs, 17 Place Carnot, Galerie des Halles, 72600 Mamers. Le bouton ci-dessous ouvre la fiche Google Maps de l’établissement.",
          [{ label: "Nous trouver", icon: MapPin, action: { type: "external", href: MAPS_LINK } }],
        );
        break;
      case "legal":
        addBotMessage(
          "Les mentions légales, conditions et informations de confidentialité sont disponibles dans la page dédiée de l’application.",
          [{ label: "Ouvrir les infos légales", icon: FileText, action: { type: "route", to: "/legal" } }],
        );
        break;
      case "carte":
        addBotMessage(
          "La carte contient les créations publiques de la crêperie. Une partie “menu secret” existe aussi : elle se débloque avec un code obtenu via le quiz ou un accès réservé.",
          [{ label: "Voir la carte", icon: UtensilsCrossed, action: { type: "route", to: "/carte" } }],
        );
        break;
      case "appeler":
        addBotMessage(
          "Vous pouvez nous appeler au 02 59 66 01 76.",
          [{ label: "Appeler maintenant", icon: Phone, action: { type: "phone", href: PHONE_LINK } }],
        );
        break;
      case "whatsapp":
        addBotMessage(
          "Vous pouvez continuer sur WhatsApp pour poser une question directement à l’équipe.",
          [{ label: "Ouvrir WhatsApp", icon: MessageCircle, action: { type: "external", href: WHATSAPP_LINK } }],
        );
        break;
      case "client":
        addBotMessage(
          "L’espace client permet de se connecter ou créer un compte avec email, Google ou Apple. Une fois connecté, vous retrouvez vos avantages : points fidélité, carte secrète, historique des gains et réservations. La fidélité fonctionne sur le principe : 9 visites = 1 menu offert.",
          [{ label: "Ouvrir mon compte", icon: Gift, action: { type: "route", to: "/client" } }],
        );
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
      window.setTimeout(() => addBotMessage("Cette zone est réservée à l’équipe."), 350);
      return;
    }

    if (lowerText.includes("comment") && (lowerText.includes("quiz") || lowerText.includes("jouer"))) {
      window.setTimeout(() => handleQuickAction("quiz"), 350);
      return;
    }

    if (
      lowerText.includes("recompense") ||
      lowerText.includes("cadeau") ||
      lowerText.includes("gain") ||
      lowerText.includes("gagne") ||
      lowerText.includes("lot") ||
      lowerText.includes("qr") ||
      lowerText.includes("code")
    ) {
      window.setTimeout(
        () =>
          addBotMessage(
            "Si vous gagnez au quiz, l’application affiche un code/QR à présenter au restaurant. Le lot dépend du score : 100% pour une formule complète, 90 à 99% pour une galette, 80 à 89% pour une crêpe. Le code est valable pour la semaine en cours.",
            [{ label: "Ouvrir le quiz", icon: Trophy, action: { type: "route", to: "/quiz" } }],
          ),
        350,
      );
      return;
    }

    if (lowerText.includes("horaire") || lowerText.includes("heure") || lowerText.includes("ouvert") || lowerText.includes("ferme")) {
      window.setTimeout(
        () =>
          addBotMessage(
            "Nos horaires indiqués dans l’application : samedi et dimanche, de 12h00 à 14h00 puis de 19h00 à 21h00. Pour une confirmation rapide, vous pouvez appeler la crêperie.",
            [{ label: "Appeler", icon: Phone, action: { type: "phone", href: PHONE_LINK } }],
          ),
        350,
      );
      return;
    }

    if (lowerText.includes("adresse") || lowerText.includes("trouver") || lowerText.includes("lieu") || lowerText.includes("localisation") || lowerText.includes("venir")) {
      window.setTimeout(() => handleQuickAction("trouver"), 350);
      return;
    }

    if (lowerText.includes("reserv") || lowerText.includes("table") || lowerText.includes("booking")) {
      window.setTimeout(() => handleQuickAction("reserver"), 350);
      return;
    }

    if (lowerText.includes("quiz") || lowerText.includes("jeu") || lowerText.includes("jouer")) {
      window.setTimeout(() => handleQuickAction("quiz"), 350);
      return;
    }

    if (lowerText.includes("avis") || lowerText.includes("note") || lowerText.includes("etoile") || lowerText.includes("review")) {
      window.setTimeout(() => handleQuickAction("avis"), 350);
      return;
    }

    if (lowerText.includes("carte") || lowerText.includes("menu") || lowerText.includes("manger") || lowerText.includes("crepe") || lowerText.includes("galette")) {
      window.setTimeout(() => handleQuickAction("carte"), 350);
      return;
    }

    if (lowerText.includes("compte") || lowerText.includes("connexion") || lowerText.includes("inscription") || lowerText.includes("fidelite") || lowerText.includes("point")) {
      window.setTimeout(() => handleQuickAction("client"), 350);
      return;
    }

    if (lowerText.includes("telephone") || lowerText.includes("appel") || lowerText.includes("contact") || lowerText.includes("numero")) {
      window.setTimeout(() => handleQuickAction("appeler"), 350);
      return;
    }

    if (lowerText.includes("whatsapp") || lowerText.includes("message")) {
      window.setTimeout(() => handleQuickAction("whatsapp"), 350);
      return;
    }

    if (lowerText.includes("reglement") || lowerText.includes("rgpd") || lowerText.includes("confidentialite") || lowerText.includes("condition") || lowerText.includes("legal")) {
      window.setTimeout(() => handleQuickAction("legal"), 350);
      return;
    }

    if (lowerText.includes("prix") || lowerText.includes("tarif") || lowerText.includes("combien") || lowerText.includes("cout")) {
      window.setTimeout(
        () =>
          addBotMessage(
            "Les prix sont à consulter dans la carte. Le menu secret, lui, se débloque grâce au quiz ou avec un code réservé.",
            [{ label: "Voir la carte", icon: UtensilsCrossed, action: { type: "route", to: "/carte" } }],
          ),
        350,
      );
      return;
    }

    if (lowerText.includes("merci") || lowerText.includes("super") || lowerText.includes("genial")) {
      window.setTimeout(() => addBotMessage("Avec plaisir ! À bientôt à La Crêperie des Saveurs."), 350);
      return;
    }

    window.setTimeout(
      () =>
        addBotMessage(
          "Je peux vous expliquer le quiz, les récompenses, la carte, le compte client, les horaires, la réservation, l’adresse, les avis ou le contact WhatsApp. Exemple : “comment recevoir ma récompense ?” ou “comment marche le menu secret ?”.",
          [
            { label: "Quiz", icon: Trophy, action: { type: "route", to: "/quiz" } },
            { label: "Compte client", icon: Gift, action: { type: "route", to: "/client" } },
          ],
        ),
      350,
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
            className="group fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-caramel/30 bg-gradient-to-br from-ivory via-butter/80 to-white text-caramel shadow-[0_12px_32px_rgba(76,48,25,0.24)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(76,48,25,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
            aria-label="Ouvrir l’assistant de la crêperie"
          >
            <AssistantAvatar />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ivory bg-caramel text-white shadow-md">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span className="sr-only">Ouvrir l’assistant</span>
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
                <AssistantAvatar compact />
                <div>
                  <h3 className="font-display font-bold text-espresso">Assistant Crêperie</h3>
                  <p className="text-xs text-muted-foreground">Quiz, récompenses, carte, compte et contact</p>
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

                    {message.buttons && message.buttons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.buttons.map((button) => {
                          const Icon = button.icon;
                          return (
                            <button
                              key={button.label}
                              type="button"
                              onClick={() => runAssistantAction(button.action)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-caramel/20 bg-caramel/10 px-3 py-1.5 text-xs font-semibold text-caramel transition-colors hover:bg-caramel/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              {Icon && <Icon className="h-3.5 w-3.5" />}
                              {button.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-caramel/10 px-4 py-2">
              <button
                type="button"
                onClick={() => handleQuickAction("whatsapp")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
