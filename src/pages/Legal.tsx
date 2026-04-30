import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Award,
  ChevronRight,
  FileText,
  Gift,
  Lock,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EMAIL = "dlacreperie@gmail.com";
const PHONE = "02 59 66 01 76";
const PHONE_LINK = "tel:0259660176";
const MAPS_LINK = "https://maps.app.goo.gl/ShXSrr3XBsQTEYZ87?g_st=ac";

const quickLinks = [
  { href: "#identification", label: "Identification", icon: Scale },
  { href: "#privacy", label: "Confidentialité", icon: Lock },
  { href: "#terms", label: "CGU", icon: FileText },
  { href: "#quiz", label: "Règlement quiz", icon: Gift },
];

const Legal = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const element = document.getElementById(location.hash.slice(1));
    if (element) {
      setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              Informations légales
            </div>
            <h1 className="font-display text-3xl font-black leading-tight">Mentions légales</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Les informations essentielles sur l’établissement, l’utilisation de l’application, la protection des données et le règlement du quiz.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a key={link.href} href={link.href} className="rounded-3xl border border-caramel/15 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:border-caramel/30 hover:bg-white">
                <Icon className="mb-3 h-5 w-5 text-caramel" />
                <span className="font-display text-sm font-black text-espresso">{link.label}</span>
              </a>
            );
          })}
        </section>

        <LegalSection id="identification" icon={Scale} eyebrow="Éditeur" title="Identification de l’établissement">
          <InfoLine label="Nom commercial" value="La Crêperie des Saveurs" />
          <InfoLine label="SIRET" value="930 910 187 000 10" />
          <InfoLine label="Adresse" value="17 Place Carnot – Galerie des Halles, 72600 Mamers" />
          <InfoLine label="Email" value={<a href={`mailto:${EMAIL}`} className="text-caramel underline-offset-4 hover:underline">{EMAIL}</a>} />
          <InfoLine label="Téléphone" value={<a href={PHONE_LINK} className="text-caramel underline-offset-4 hover:underline">{PHONE}</a>} />
          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 block">
            <Button variant="outline" className="h-12 w-full rounded-2xl font-black">
              Voir l’adresse sur Google Maps
              <MapPin className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </LegalSection>

        <LegalSection id="privacy" icon={Lock} eyebrow="Données personnelles" title="Politique de confidentialité">
          <Article title="1. Responsable du traitement">
            La Crêperie des Saveurs, située au 17 Place Carnot – Galerie des Halles, 72600 Mamers, est responsable du traitement des données collectées via l’application.
          </Article>

          <Article title="2. Données susceptibles d’être collectées">
            <LegalList
              items={[
                "prénom, email et numéro de téléphone lorsque vous participez au quiz ou utilisez un formulaire ;",
                "identifiant technique de session ou d’appareil, utilisé pour limiter la fraude au quiz ;",
                "informations de compte client si vous vous connectez ;",
                "historique lié aux gains, récompenses ou avantages fidélité lorsque ces fonctions sont utilisées.",
              ]}
            />
          </Article>

          <Article title="3. Finalités">
            <LegalList
              items={[
                "gérer la participation au quiz et l’attribution des lots ;",
                "sécuriser l’application et prévenir les abus ;",
                "gérer l’espace client, les avantages et la fidélité ;",
                "répondre aux demandes envoyées par email, téléphone ou formulaire ;",
                "envoyer des communications uniquement lorsque le consentement est demandé et accepté.",
              ]}
            />
          </Article>

          <Article title="4. Base légale">
            Selon le service utilisé, le traitement repose sur le consentement, l’exécution d’un service demandé, l’intérêt légitime de sécurisation, ou le respect d’obligations légales.
          </Article>

          <Article title="5. Durée de conservation">
            Les données sont conservées uniquement le temps nécessaire aux finalités indiquées. Les données liées au quiz et aux gains peuvent être conservées jusqu’à 1 an après la dernière interaction, sauf obligation ou demande légitime de conservation plus longue.
          </Article>

          <Article title="6. Vos droits">
            Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition au traitement ou le retrait de votre consentement. Pour exercer vos droits, contactez {EMAIL}. Une réponse sera apportée dans les meilleurs délais et au plus tard dans le délai légal applicable.
          </Article>

          <Article title="7. Sécurité et partage">
            Les données ne sont pas vendues. Elles peuvent être traitées par les services techniques nécessaires au fonctionnement de l’application, notamment l’hébergement, l’authentification, la base de données ou les outils de réservation utilisés.
          </Article>
        </LegalSection>

        <LegalSection id="terms" icon={FileText} eyebrow="Utilisation" title="Conditions générales d’utilisation">
          <Article title="1. Objet">
            Les présentes conditions encadrent l’utilisation du site et de l’application La Crêperie des Saveurs : carte, réservation, quiz, espace client, avis, réseaux sociaux et informations pratiques.
          </Article>

          <Article title="2. Accès">
            L’accès est gratuit. Certains services peuvent nécessiter une connexion, une adresse email, un numéro de téléphone ou une validation sur une plateforme tierce.
          </Article>

          <Article title="3. Exactitude des informations">
            L’utilisateur s’engage à fournir des informations exactes. Toute fraude, tentative de contournement ou utilisation abusive peut entraîner l’annulation d’un gain, d’un avantage ou d’un accès.
          </Article>

          <Article title="4. Réservations et plateformes tierces">
            La réservation peut s’appuyer sur Google ou d’autres services externes. Ces plateformes possèdent leurs propres règles, disponibilités et conditions d’utilisation.
          </Article>

          <Article title="5. Propriété intellectuelle">
            Les textes, images, logos, éléments graphiques et contenus de l’application sont protégés. Toute reproduction ou réutilisation non autorisée est interdite.
          </Article>

          <Article title="6. Responsabilité">
            La Crêperie des Saveurs fait ses meilleurs efforts pour proposer une application fiable, mais ne peut garantir l’absence totale d’interruption, d’erreur technique ou d’indisponibilité temporaire.
          </Article>

          <Article title="7. Droit applicable">
            Les présentes conditions sont soumises au droit français. En cas de litige, les juridictions compétentes seront déterminées selon les règles applicables.
          </Article>
        </LegalSection>

        <LegalSection id="quiz" icon={Gift} eyebrow="Jeu gratuit" title="Règlement du quiz">
          <Article title="1. Organisation">
            La Crêperie des Saveurs organise un quiz gratuit, sans obligation d’achat. Le quiz peut être modifié, suspendu ou arrêté en cas de nécessité technique, de fraude ou de force majeure.
          </Article>

          <Article title="2. Participation">
            <LegalList
              items={[
                "une seule participation gagnante par semaine et par personne ;",
                "les informations demandées doivent être exactes ;",
                "les lots sont personnels, non échangeables contre de l’argent et à retirer selon les conditions affichées dans l’application ;",
                "toute tentative de fraude peut entraîner une disqualification.",
              ]}
            />
          </Article>

          <Article title="3. Attribution des lots">
            Le résultat dépend du score obtenu et du stock disponible. À titre indicatif : 100 % peut donner droit à une Formule Complète, 90 % ou plus à une galette, 80 % ou plus à une crêpe. Si le stock hebdomadaire est épuisé, aucun lot ne peut être attribué même si le score est suffisant.
          </Article>

          <Article title="4. Validation du gain">
            Un gain peut nécessiter un QR code, un code unique ou une vérification en restaurant. Le personnel peut refuser un gain expiré, déjà utilisé, falsifié ou ne correspondant pas aux règles.
          </Article>
        </LegalSection>

        <section className="rounded-[2rem] border border-herb/20 bg-herb/10 p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-herb">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-espresso">Protection des données</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Cette page explique clairement les usages principaux. Pour toute question ou demande liée à vos données, contactez directement l’établissement par email.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/20 bg-butter/35 p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-caramel">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-espresso">Non-affiliation</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Le quiz et les opérations de La Crêperie des Saveurs ne sont pas sponsorisés, gérés ou organisés par Google, Facebook, Instagram, WhatsApp, TikTok, YouTube ou toute autre plateforme tierce. Ces noms sont cités uniquement à titre informatif.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/20 bg-white/70 p-5 text-center shadow-warm backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Contact</p>
          <h2 className="mt-1 font-display text-xl font-black text-espresso">Une question ?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={`mailto:${EMAIL}`} className="block">
              <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </a>
            <a href={PHONE_LINK} className="block">
              <Button className="h-12 w-full rounded-2xl bg-caramel font-bold text-white hover:bg-caramel/90">
                <Phone className="mr-2 h-4 w-4" />
                Appeler
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

const LegalSection = ({
  id,
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  id: string;
  icon: typeof FileText;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="card-warm scroll-mt-24 space-y-4">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">{eyebrow}</p>
        <h2 className="font-display text-xl font-black text-espresso">{title}</h2>
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const Article = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border/55 bg-white/65 p-4">
    <h3 className="mb-2 flex items-center gap-2 font-display text-base font-black text-espresso">
      <ChevronRight className="h-4 w-4 text-caramel" />
      {title}
    </h3>
    <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
  </div>
);

const LegalList = ({ items }: { items: string[] }) => (
  <ul className="ml-1 space-y-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/55 bg-white/65 p-3">
    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

export default Legal;
