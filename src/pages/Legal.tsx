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
const PHONE_LINK = "tel:+33259660176";
const MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers";
const LAST_UPDATED = "15 juillet 2026";

const quickLinks = [
  { href: "#identification", label: "Identification", icon: Scale },
  { href: "#privacy", label: "Confidentialité", icon: Lock },
  { href: "#terms", label: "CGU", icon: FileText },
  { href: "#quiz", label: "Règlement du quiz", icon: Gift },
];

const Legal = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const element = document.getElementById(location.hash.slice(1));
    if (element) setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-sm" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" aria-hidden="true" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" aria-hidden="true" />
              Informations légales
            </div>
            <h1 className="font-display text-3xl font-black leading-tight">Mentions légales, CGU et règlement du quiz</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Règles d’utilisation du site, protection des données, espace client et conditions complètes du jeu gratuit.
            </p>
            <p className="mt-4 text-xs text-white/60">Dernière mise à jour : {LAST_UPDATED}</p>
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-3" aria-label="Sommaire juridique">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a key={link.href} href={link.href} className="rounded-3xl border border-caramel/15 bg-white/70 p-4 shadow-sm transition-colors hover:border-caramel/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Icon className="mb-3 h-5 w-5 text-caramel" aria-hidden="true" />
                <span className="font-display text-sm font-black text-espresso">{link.label}</span>
              </a>
            );
          })}
        </nav>

        <LegalSection id="identification" icon={Scale} eyebrow="Éditeur" title="Identification de l’établissement">
          <InfoLine label="Nom commercial" value="La Crêperie des Saveurs" />
          <InfoLine label="SIRET" value="930 910 187 000 10" />
          <InfoLine label="Adresse" value="17 Place Carnot – Galerie des Halles, 72600 Mamers" />
          <InfoLine label="Responsable de publication" value="Responsable de l’établissement La Crêperie des Saveurs" />
          <InfoLine label="Email" value={<a href={`mailto:${EMAIL}`} className="text-caramel underline-offset-4 hover:underline">{EMAIL}</a>} />
          <InfoLine label="Téléphone" value={<a href={PHONE_LINK} className="text-caramel underline-offset-4 hover:underline">{PHONE}</a>} />
          <Article title="Hébergement et services techniques">
            L’application utilise notamment Supabase pour l’authentification et les données. Certains liens ouvrent des services tiers, notamment Google. Les prestataires restent responsables de leurs propres services et politiques.
          </Article>
          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 block">
            <Button variant="outline" className="h-12 w-full rounded-2xl font-black">Voir l’adresse sur Google Maps<MapPin className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
          </a>
        </LegalSection>

        <LegalSection id="privacy" icon={Lock} eyebrow="Données personnelles" title="Politique de confidentialité">
          <Article title="1. Responsable du traitement">
            La Crêperie des Saveurs traite les données collectées dans le cadre du site, du compte client et du quiz. Toute demande peut être adressée à {EMAIL}.
          </Article>
          <Article title="2. Données susceptibles d’être collectées">
            <LegalList items={[
              "identité et coordonnées : prénom, nom, email, téléphone et ville ;",
              "données du compte : identifiant utilisateur, état de vérification de l’email et préférences ;",
              "données du quiz : réponses, score, date, lot, code, consentements et statut d’utilisation ;",
              "données techniques nécessaires à la sécurité : session, appareil, navigateur, journal d’erreurs et identifiant antifraude ;",
              "messages, demandes de contact et informations communiquées volontairement.",
            ]} />
          </Article>
          <Article title="3. Finalités et bases légales">
            <LegalList items={[
              "créer, authentifier et sécuriser le compte client ;",
              "fournir les fonctions demandées et conserver les gains ;",
              "organiser le quiz, contrôler l’éligibilité, attribuer les lots et lutter contre la fraude ;",
              "répondre aux demandes et gérer les réservations ;",
              "respecter les obligations légales et défendre les droits de l’établissement ;",
              "envoyer une communication commerciale uniquement lorsqu’un consentement distinct a été recueilli.",
            ]} />
          </Article>
          <Article title="4. Caractère obligatoire des données">
            Les champs signalés comme obligatoires sont nécessaires à la création du compte, à la sécurisation du quiz ou à la remise d’un gain. Sans ces informations, la fonction concernée ne peut pas être fournie.
          </Article>
          <Article title="5. Destinataires et sous-traitants">
            Les données ne sont pas vendues. Elles sont accessibles aux personnes habilitées de l’établissement et aux prestataires strictement nécessaires, notamment Supabase. Les services externes ouverts volontairement par l’utilisateur appliquent leurs propres règles.
          </Article>
          <Article title="6. Conservation">
            <LegalList items={[
              "compte client : pendant la durée d’activité du compte, puis suppression ou anonymisation dans un délai raisonnable après la demande ;",
              "participations, gains et éléments antifraude : jusqu’à 12 mois après la semaine concernée, sauf litige, fraude ou obligation légale ;",
              "demandes de contact : le temps nécessaire au traitement puis à la preuve des échanges ;",
              "stockage local : jusqu’à suppression par l’utilisateur ou expiration technique.",
            ]} />
          </Article>
          <Article title="7. Sécurité">
            Des mesures raisonnables sont mises en œuvre pour limiter l’accès non autorisé, la perte, l’altération ou la fraude. Aucun système informatique ne pouvant être garanti sans risque, l’utilisateur doit protéger ses identifiants et signaler rapidement toute anomalie.
          </Article>
          <Article title="8. Vos droits">
            Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, la portabilité lorsqu’elle s’applique, l’opposition et le retrait d’un consentement. Une preuve d’identité raisonnable peut être demandée. Vous pouvez également saisir la CNIL.
          </Article>
          <Article title="9. Suppression du compte">
            La suppression peut être demandée à {EMAIL}. Elle peut entraîner la perte définitive des gains, codes, historiques et accès associés, sous réserve des données devant être conservées pour la fraude, un litige ou une obligation légale.
          </Article>
          <Article title="10. Stockage local et cookies">
            Le site utilise des éléments techniques nécessaires à la session, à la sécurité, à la mémorisation de préférences et au fonctionnement du quiz. Aucun traceur publicitaire n’est déclaré dans l’application à la date de mise à jour.
          </Article>
        </LegalSection>

        <LegalSection id="terms" icon={FileText} eyebrow="Utilisation" title="Conditions générales d’utilisation">
          <Article title="1. Acceptation">
            L’utilisation du site vaut acceptation des présentes CGU. La participation au quiz exige une acceptation explicite du règlement et de la politique de confidentialité.
          </Article>
          <Article title="2. Accès et compte personnel">
            L’accès général est gratuit. Le compte est strictement personnel. L’utilisateur doit fournir des informations exactes, conserver ses identifiants confidentiels et ne pas céder son compte, ses codes ou ses avantages.
          </Article>
          <Article title="3. Utilisations interdites">
            <LegalList items={[
              "usurpation d’identité, faux renseignements ou comptes multiples ;",
              "automatisation, robot, script, manipulation du navigateur ou contournement des contrôles ;",
              "tentative d’accès aux données d’un tiers ou aux fonctions d’administration ;",
              "copie, extraction massive, altération ou réutilisation commerciale des contenus ;",
              "publication de contenus illicites, injurieux, trompeurs ou portant atteinte aux droits d’autrui.",
            ]} />
          </Article>
          <Article title="4. Suspension et suppression">
            L’établissement peut suspendre une fonction, un compte ou un avantage en cas de fraude présumée, incident de sécurité, violation des CGU ou nécessité technique. Une vérification peut être demandée avant réactivation ou remise d’un lot.
          </Article>
          <Article title="5. Réservation">
            Une réservation n’est confirmée que par le service de réservation externe ou par l’établissement. Une indisponibilité, erreur d’affichage ou ouverture d’un lien ne constitue pas une confirmation.
          </Article>
          <Article title="6. Carte, prix, allergènes et disponibilité">
            Les contenus sont informatifs et peuvent évoluer. La disponibilité réelle, le prix applicable et la composition servis au restaurant prévalent. En cas d’allergie ou d’intolérance, le client doit impérativement interroger l’établissement avant commande.
          </Article>
          <Article title="7. Responsabilité et disponibilité">
            Le service peut être interrompu pour maintenance, sécurité, panne, force majeure ou dépendance à un prestataire. L’établissement ne répond pas des interruptions externes, d’une mauvaise utilisation, d’un appareil compromis ou de la perte d’un accès imputable à l’utilisateur.
          </Article>
          <Article title="8. Propriété intellectuelle">
            Les marques, textes, photographies, logos, interfaces et contenus restent protégés. Toute reproduction, adaptation, extraction ou exploitation non autorisée est interdite.
          </Article>
          <Article title="9. Modification des règles">
            Les CGU peuvent être adaptées pour des raisons légales, techniques ou de sécurité. La version publiée avec sa date de mise à jour est applicable à compter de sa mise en ligne, sans remettre en cause un gain déjà valablement attribué sauf fraude.
          </Article>
          <Article title="10. Réclamations et droit applicable">
            Le droit français s’applique. Toute réclamation doit d’abord être adressée à {EMAIL}. Une solution amiable sera recherchée avant toute procédure devant la juridiction compétente. Le consommateur conserve ses droits légaux et peut recourir à la médiation de la consommation applicable à l’établissement.
          </Article>
        </LegalSection>

        <LegalSection id="quiz" icon={Gift} eyebrow="Jeu gratuit" title="Règlement complet du quiz">
          <Article title="1. Organisateur et nature du jeu">
            La Crêperie des Saveurs organise un quiz gratuit, sans obligation d’achat et sans mise financière. Il s’agit d’un concours de connaissances dont le résultat dépend du score et du stock disponible, et non d’un jeu d’argent.
          </Article>
          <Article title="2. Âge et éligibilité">
            La participation avec possibilité de gain est réservée aux personnes physiques âgées de 18 ans révolus, disposant d’un compte personnel avec email vérifié et pouvant retirer le lot à Mamers. Le participant certifie sa majorité lors de la validation du résultat.
          </Article>
          <Article title="3. Période hebdomadaire">
            Chaque semaine de jeu court du lundi à 00h00 au dimanche à 22h00, heure de Paris. Les compteurs, stocks et droits à gain peuvent être renouvelés pour la semaine suivante.
          </Article>
          <Article title="4. Participation et limitation">
            <LegalList items={[
              "plusieurs tentatives peuvent être autorisées, mais un seul gain maximum par personne, compte, appareil et semaine ;",
              "un seul compte est autorisé par personne ;",
              "les coordonnées doivent être exactes et permettre le contrôle du bénéficiaire ;",
              "la participation est personnelle et ne peut être exécutée par un tiers ou un système automatisé.",
            ]} />
          </Article>
          <Article title="5. Questions, chronomètre et score">
            Le quiz comprend 10 questions sélectionnées dans la banque active. Chaque question dispose du temps affiché. Une absence de réponse avant expiration est comptée comme incorrecte. Le score enregistré par le serveur fait foi, sauf erreur technique démontrée.
          </Article>
          <Article title="6. Lots et stock">
            Les seuils et quantités disponibles sont ceux affichés avant la participation. Un score éligible ne garantit pas un lot si le stock correspondant est épuisé. Les lots peuvent être remplacés par un avantage de valeur comparable en cas d’indisponibilité indépendante de l’établissement.
          </Article>
          <Article title="7. Attribution du gain">
            Le gain n’est valable qu’après validation du serveur et émission d’un code unique rattaché au compte. Une capture d’écran, un message local ou un affichage obtenu par manipulation ne constitue pas une preuve suffisante.
          </Article>
          <Article title="8. Date limite impérative">
            Tout gain obtenu au cours d’une semaine doit être utilisé au restaurant au plus tard le dimanche de cette même semaine avant la fermeture, fixée à 22h00. Après ce délai, le gain et son code expirent automatiquement, sans report, remboursement, compensation ni prolongation.
          </Article>
          <Article title="9. Utilisation au restaurant">
            Le bénéficiaire doit présenter le code original depuis son compte ou son appareil. Une pièce d’identité peut être demandée. Le lot est personnel, non cessible, non échangeable, non remboursable et sans contrepartie en espèces. Un seul code peut être utilisé par visite, sauf indication contraire.
          </Article>
          <Article title="10. Fraude et annulation">
            Tout compte multiple, partage ou revente de code, falsification, automatisation, manipulation de score, contournement de limite ou fausse identité entraîne la disqualification, l’annulation des gains et, si nécessaire, le blocage des comptes ou appareils concernés.
          </Article>
          <Article title="11. Incident, interruption et force majeure">
            L’organisateur peut suspendre, modifier ou annuler le quiz en cas de panne, faille, fraude massive, erreur de stock, obligation légale, fermeture exceptionnelle ou force majeure. Il fera ses meilleurs efforts pour préserver les gains déjà valablement attribués et non expirés.
          </Article>
          <Article title="12. Données et preuve">
            Les journaux serveur, enregistrements de session, horodatages, comptes, scores et statuts des codes constituent les éléments techniques de référence pour vérifier une participation, sous réserve du droit de l’utilisateur de contester une erreur.
          </Article>
          <Article title="13. Responsabilité">
            L’organisateur n’est pas responsable d’une mauvaise connexion, d’un téléphone incompatible, d’une perte d’identifiants, d’un email non reçu, d’un retard du participant ou d’une indisponibilité d’un service tiers. Cette clause ne limite pas les responsabilités qui ne peuvent légalement être exclues.
          </Article>
          <Article title="14. Non-affiliation">
            Le quiz n’est ni sponsorisé, ni administré, ni organisé par Google, Meta, Instagram, Facebook, WhatsApp, TikTok, YouTube, Supabase ou toute autre plateforme tierce citée.
          </Article>
          <Article title="15. Réclamation">
            Toute contestation doit être envoyée à {EMAIL} avec l’email du compte, la date approximative, le code concerné et une description précise. Les demandes manifestement frauduleuses ou reçues après expiration ne créent aucun droit automatique à compensation.
          </Article>
        </LegalSection>

        <section className="rounded-[2rem] border border-herb/20 bg-herb/10 p-5">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-herb"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <h2 className="font-display text-lg font-black text-espresso">Point essentiel sur les récompenses</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Un code gagné expire le dimanche de la semaine du gain à 22h00. Pensez à le présenter avant la fermeture.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/20 bg-white/70 p-5 text-center shadow-warm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Contact juridique et données</p>
          <h2 className="mt-1 font-display text-xl font-black text-espresso">Une question ou une demande ?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={`mailto:${EMAIL}`} className="block"><Button variant="outline" className="h-12 w-full rounded-2xl font-bold"><Mail className="mr-2 h-4 w-4" aria-hidden="true" />{EMAIL}</Button></a>
            <a href={PHONE_LINK} className="block"><Button className="h-12 w-full rounded-2xl bg-caramel font-bold text-white hover:bg-caramel/90"><Phone className="mr-2 h-4 w-4" aria-hidden="true" />{PHONE}</Button></a>
          </div>
        </section>
      </div>
    </div>
  );
};

const LegalSection = ({ id, icon: Icon, eyebrow, title, children }: { id: string; icon: typeof Scale; eyebrow: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20 rounded-[2rem] border border-caramel/15 bg-white/72 p-5 shadow-sm backdrop-blur">
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel"><Icon className="h-5 w-5" aria-hidden="true" /></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">{eyebrow}</p><h2 className="mt-1 font-display text-xl font-black text-espresso">{title}</h2></div>
    </div>
    <div className="space-y-5">{children}</div>
  </section>
);

const Article = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <article><h3 className="flex items-start gap-2 font-display text-base font-black text-espresso"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-caramel" aria-hidden="true" />{title}</h3><div className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{children}</div></article>
);

const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid gap-1 border-b border-border/50 pb-3 last:border-0 sm:grid-cols-[11rem_1fr]"><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span><span className="text-sm font-semibold text-espresso">{value}</span></div>
);

const LegalList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" aria-hidden="true" /><span>{item}</span></li>)}</ul>
);

export default Legal;
