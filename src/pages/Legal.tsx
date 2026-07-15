import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
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
const LAST_UPDATED = "15 juillet 2026";

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
            <h1 className="font-display text-3xl font-black leading-tight">Mentions légales et confidentialité</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Identification de l’établissement, règles d’utilisation, protection des données et fonctionnement du quiz.
            </p>
            <p className="mt-4 text-xs text-white/60">Dernière mise à jour : {LAST_UPDATED}</p>
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
            La Crêperie des Saveurs est responsable des données collectées directement dans l’application. Pour toute demande liée à vos données, vous pouvez écrire à {EMAIL}.
          </Article>

          <Article title="2. Données collectées">
            <LegalList items={[
              "prénom, adresse email et numéro de téléphone lorsque vous créez un compte ou participez au quiz ;",
              "données techniques de session, d’appareil ou de navigateur nécessaires à la sécurité et à la prévention de la fraude ;",
              "historique des participations, gains, codes et avantages liés au compte client ;",
              "informations transmises volontairement lors d’un contact ou d’une réservation.",
            ]} />
          </Article>

          <Article title="3. Finalités et bases légales">
            <LegalList items={[
              "créer et sécuriser votre compte, sur la base de l’exécution du service demandé ;",
              "gérer le quiz, attribuer les lots et limiter les abus, sur la base de l’exécution du règlement et de l’intérêt légitime de sécurité ;",
              "répondre à vos demandes et gérer les réservations ;",
              "envoyer des communications commerciales uniquement lorsque votre consentement a été recueilli.",
            ]} />
          </Article>

          <Article title="4. Services techniques utilisés">
            L’authentification et la base de données peuvent être opérées par Supabase. La réservation, l’itinéraire, les avis ou certains contenus peuvent ouvrir des services Google. Lorsque vous utilisez ces services tiers, leurs propres politiques de confidentialité s’appliquent également.
          </Article>

          <Article title="5. Stockage local et traceurs techniques">
            L’application peut utiliser le stockage local du navigateur et des éléments techniques strictement nécessaires pour conserver une session, mémoriser l’affichage de l’écran d’accueil, sécuriser le compte et assurer le fonctionnement du quiz. Aucun usage publicitaire n’est déclaré dans cette application.
          </Article>

          <Article title="6. Durée de conservation">
            Les données de compte sont conservées tant que le compte reste actif ou jusqu’à une demande de suppression, sous réserve des obligations légales. Les données liées au quiz, aux gains et à la prévention de la fraude peuvent être conservées jusqu’à un an après la dernière interaction, sauf nécessité légitime ou obligation plus longue.
          </Article>

          <Article title="7. Destinataires et transferts">
            Les données ne sont pas vendues. Elles sont accessibles uniquement aux personnes autorisées de La Crêperie des Saveurs et aux prestataires techniques indispensables au fonctionnement du service. Certains prestataires peuvent traiter des données hors de l’Union européenne selon leurs garanties contractuelles et réglementaires.
          </Article>

          <Article title="8. Vos droits">
            Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, la portabilité lorsque celle-ci s’applique, l’opposition ou le retrait de votre consentement. Contactez {EMAIL}. Vous pouvez également introduire une réclamation auprès de la CNIL si vous estimez que vos droits ne sont pas respectés.
          </Article>
        </LegalSection>

        <LegalSection id="terms" icon={FileText} eyebrow="Utilisation" title="Conditions générales d’utilisation">
          <Article title="1. Objet">
            Ces conditions encadrent l’utilisation du site et de l’application La Crêperie des Saveurs : carte, réservation, quiz, espace client, avis, réseaux sociaux et informations pratiques.
          </Article>

          <Article title="2. Accès et compte">
            L’accès général est gratuit. Certaines fonctions, notamment le quiz et la conservation des gains, nécessitent un compte et une adresse email vérifiée. L’utilisateur est responsable de la confidentialité de ses identifiants.
          </Article>

          <Article title="3. Informations fournies">
            L’utilisateur s’engage à fournir des informations exactes. Toute fraude, usurpation, création de comptes multiples ou tentative de contournement peut entraîner l’annulation d’un gain ou la suspension de l’accès.
          </Article>

          <Article title="4. Réservations et services tiers">
            La réservation peut être finalisée via Google ou un autre service externe. La sélection réalisée dans l’application ne constitue pas une confirmation tant que le service de réservation ou l’établissement ne l’a pas validée.
          </Article>

          <Article title="5. Disponibilité et responsabilité">
            La Crêperie des Saveurs fait ses meilleurs efforts pour maintenir des informations exactes et un service disponible, sans garantir l’absence totale d’erreur, d’interruption ou d’indisponibilité temporaire.
          </Article>

          <Article title="6. Propriété intellectuelle">
            Les textes, images, logos, éléments graphiques et contenus de l’application sont protégés. Toute reproduction ou réutilisation non autorisée est interdite.
          </Article>

          <Article title="7. Droit applicable">
            Ces conditions sont soumises au droit français. En cas de différend, une solution amiable sera recherchée avant toute action devant la juridiction compétente.
          </Article>
        </LegalSection>

        <LegalSection id="quiz" icon={Gift} eyebrow="Jeu gratuit" title="Règlement du quiz">
          <Article title="1. Organisation">
            La Crêperie des Saveurs organise un quiz gratuit, sans obligation d’achat. Le quiz peut être modifié, suspendu ou arrêté en cas de nécessité technique, de fraude, d’indisponibilité des lots ou de force majeure.
          </Article>

          <Article title="2. Conditions de participation">
            <LegalList items={[
              "un compte personnel avec une adresse email vérifiée est nécessaire ;",
              "les informations communiquées doivent être exactes ;",
              "une seule participation gagnante est autorisée par semaine et par personne, sous réserve des contrôles techniques ;",
              "les lots sont personnels, non cessibles et non échangeables contre de l’argent ;",
              "toute tentative de fraude peut entraîner une disqualification.",
            ]} />
          </Article>

          <Article title="3. Questions, score et stock">
            Les questions sont sélectionnées aléatoirement dans la banque active. Le résultat dépend du score, des règles affichées au moment de la participation et du stock de lots disponible. Les récompenses peuvent évoluer ; seules les informations affichées dans le quiz au moment du jeu font foi.
          </Article>

          <Article title="4. Attribution et conservation du gain">
            Un gain valide est rattaché au compte client et peut être identifié par un code unique. L’utilisateur doit conserver l’accès à son compte et présenter le code selon les instructions affichées.
          </Article>

          <Article title="5. Validation en restaurant">
            Le personnel peut refuser un code expiré, déjà utilisé, falsifié, obtenu en violation du règlement ou ne correspondant pas au compte du bénéficiaire. Les conditions de retrait et la date de validité affichées avec le gain doivent être respectées.
          </Article>

          <Article title="6. Non-affiliation">
            Le quiz n’est ni sponsorisé, ni géré, ni organisé par Google, Meta, Instagram, Facebook, WhatsApp, TikTok, YouTube, Supabase ou toute autre plateforme tierce mentionnée dans l’application.
          </Article>
        </LegalSection>

        <section className="rounded-[2rem] border border-herb/20 bg-herb/10 p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-herb">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-espresso">Vos données restent sous votre contrôle</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Pour toute demande d’accès, de correction ou de suppression, contactez l’établissement par email. Une vérification d’identité raisonnable peut être demandée avant de traiter la demande.
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
                {EMAIL}
              </Button>
            </a>
            <a href={PHONE_LINK} className="block">
              <Button className="h-12 w-full rounded-2xl bg-caramel font-bold text-white hover:bg-caramel/90">
                <Phone className="mr-2 h-4 w-4" />
                {PHONE}
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
