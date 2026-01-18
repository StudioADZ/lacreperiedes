import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FileText,
  Mail,
  Phone,
  Shield,
  Scale,
  Gift,
  Lock,
  ScrollText,
} from "lucide-react";
import SocialFooter from "@/components/SocialFooter";

const Legal = () => {
  const location = useLocation();

  // Scroll to section on hash change
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4 inline mr-1" />
            Informations légales
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">Mentions légales</h1>
          <p className="text-sm text-muted-foreground">
            Pour une expérience claire et transparente.
          </p>
        </div>

        {/* Quick nav (UX only) */}
        <nav className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">
            Accès rapide
          </h2>
          <div className="grid gap-2">
            <a
              href="#privacy"
              className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-herb" />
                Politique de confidentialité (RGPD)
              </span>
              <span className="text-xs text-muted-foreground">#privacy</span>
            </a>
            <a
              href="#terms"
              className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm">
                <ScrollText className="w-4 h-4 text-caramel" />
                Conditions d’utilisation (CGU)
              </span>
              <span className="text-xs text-muted-foreground">#terms</span>
            </a>
            <a
              href="#quiz"
              className="flex items-center justify-between rounded-xl bg-secondary/30 px-4 py-3 hover:bg-secondary/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4 text-caramel" />
                Règlement du quiz
              </span>
              <span className="text-xs text-muted-foreground">#quiz</span>
            </a>
          </div>
        </nav>

        {/* Company Info */}
        <section className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Identification
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Raison sociale :</strong> La Crêperie des Saveurs
            </p>
            <p>
              <strong>SIRET :</strong> 930 910 187 000 10
            </p>
            <p>
              <strong>Adresse :</strong> 17 Place Carnot – Galerie des Halles – 72600 Mamers
            </p>
            <p>
              <strong>Email :</strong>{" "}
              <a href="mailto:dlacreperie@gmail.com" className="text-primary">
                dlacreperie@gmail.com
              </a>
            </p>
            <p>
              <strong>Téléphone :</strong>{" "}
              <a href="tel:0259660176" className="text-primary">
                02 59 66 01 76
              </a>
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="card-warm mb-6 scroll-mt-24">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-herb" />
            Politique de Confidentialité
          </h2>

          {/* Short summary (UX only) */}
          <div className="p-3 rounded-xl bg-herb/10 border border-herb/20 mb-4">
            <p className="text-herb text-xs">
              ✅ En clair : on utilise vos infos uniquement pour gérer le quiz, éviter les abus
              et valider les lots. Aucune revente.
            </p>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>1. Responsable du traitement</strong>
            </p>
            <p>
              La Crêperie des Saveurs, située au 17 Place Carnot – 72600 Mamers,
              est responsable du traitement de vos données personnelles.
            </p>

            <p>
              <strong>2. Données collectées</strong>
            </p>
            <p>Nous collectons les données suivantes (selon votre usage) :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Prénom</li>
              <li>Adresse email (si demandée/utile selon parcours)</li>
              <li>Numéro de téléphone</li>
              <li>Identifiant technique pseudonymisé de l’appareil (anti-abus)</li>
            </ul>

            <p>
              <strong>3. Finalités du traitement</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Participation au quiz hebdomadaire</li>
              <li>Attribution et validation des lots gagnés</li>
              <li>Prévention des fraudes et abus (ex : gains multiples)</li>
              <li>Communications promotionnelles (uniquement avec consentement explicite)</li>
            </ul>

            <p>
              <strong>4. Base légale</strong>
            </p>
            <p>
              Le traitement est basé sur votre consentement (quiz / formulaires),
              et sur l’intérêt légitime lié à la prévention des abus.
            </p>

            <p>
              <strong>5. Durée de conservation</strong>
            </p>
            <p>
              Les données sont conservées pendant une durée proportionnée à la finalité,
              puis supprimées ou anonymisées. Vous pouvez demander la suppression à tout moment.
            </p>

            <p>
              <strong>6. Vos droits</strong>
            </p>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Droit d’accès</li>
              <li>Droit de rectification</li>
              <li>Droit à l’effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d’opposition</li>
              <li>Droit de retirer votre consentement</li>
            </ul>

            <p>
              <strong>7. Exercer vos droits</strong>
            </p>
            <p>
              Pour exercer vos droits, contactez-nous à{" "}
              <a href="mailto:dlacreperie@gmail.com" className="text-primary">
                dlacreperie@gmail.com
              </a>
              . Réponse sous 30 jours.
            </p>

            <p>
              <strong>8. Sécurité</strong>
            </p>
            <p>
              Nous appliquons des mesures techniques et organisationnelles adaptées
              (accès restreint, bonnes pratiques de sécurité) pour protéger vos données.
              Aucune revente ni partage non autorisé.
            </p>
          </div>
        </section>

        {/* Terms of Use */}
        <section id="terms" className="card-warm mb-6 scroll-mt-24">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-caramel" />
            Conditions Générales d’Utilisation
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>1. Objet</strong>
            </p>
            <p>
              Les présentes CGU régissent l’utilisation de l’application et de ses services,
              notamment le quiz hebdomadaire.
            </p>

            <p>
              <strong>2. Accès au service</strong>
            </p>
            <p>
              L’accès à l’application est gratuit. L’utilisateur doit disposer d’un appareil connecté
              à Internet.
            </p>

            <p>
              <strong>3. Participation</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>L’utilisateur s’engage à fournir des informations exactes</li>
              <li>Une seule participation gagnante par semaine et par personne</li>
              <li>Toute tentative de fraude peut entraîner la disqualification</li>
            </ul>

            <p>
              <strong>4. Propriété intellectuelle</strong>
            </p>
            <p>
              Les contenus (textes, images, logos) sont la propriété de La Crêperie des Saveurs.
              Toute reproduction non autorisée est interdite.
            </p>

            <p>
              <strong>5. Responsabilité</strong>
            </p>
            <p>
              La Crêperie des Saveurs ne saurait être tenue responsable des interruptions
              de service liées à des contraintes techniques.
            </p>

            <p>
              <strong>6. Modification</strong>
            </p>
            <p>
              Nous pouvons modifier ces CGU à tout moment. En cas de changement important,
              une information pourra être affichée.
            </p>

            <p>
              <strong>7. Droit applicable</strong>
            </p>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige,
              la compétence est déterminée selon les règles de procédure applicables.
            </p>
          </div>
        </section>

        {/* RGPD Summary */}
        <section className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-herb" />
            Protection des données (RGPD)
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Les données collectées via l’application sont utilisées uniquement pour les finalités
              décrites ci-dessus. Vous pouvez exercer vos droits à tout moment.
            </p>
            <div className="p-3 rounded-xl bg-herb/10 border border-herb/20">
              <p className="text-herb text-xs">
                🇪🇺 Vous gardez le contrôle : accès, correction, suppression sur demande.
              </p>
            </div>
          </div>
        </section>

        {/* Quiz Rules */}
        <section id="quiz" className="card-warm mb-6 scroll-mt-24">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-caramel" />
            Règlement du Quiz
          </h2>

          <div className="p-3 rounded-xl bg-caramel/10 border border-caramel/20 mb-4">
            <p className="text-xs text-muted-foreground">
              📅 <strong>Période de jeu :</strong> du <strong>lundi 00h01</strong> au{" "}
              <strong>dimanche 23h59</strong> (heure de Paris).{" "}
              <strong>Les gains expirent le dimanche à 23h59</strong>.
            </p>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>Article 1 – Organisation</strong>
            </p>
            <p>
              La Crêperie des Saveurs organise un jeu-quiz hebdomadaire gratuit, sans obligation d’achat,
              selon la période de jeu indiquée ci-dessus.
            </p>

            <p>
              <strong>Article 2 – Participation</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ouvert à toute personne de 16 ans ou plus</li>
              <li>Une seule participation gagnante par semaine et par personne (téléphone + appareil)</li>
              <li>Les lots sont à retirer sur place au restaurant</li>
            </ul>

            <p>
              <strong>Article 3 – Lots</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>100% : 1 Formule Complète (quantité limitée / semaine)</li>
              <li>90–99% : 1 Galette (quantité limitée / semaine)</li>
              <li>80–89% : 1 Crêpe (quantité limitée / semaine)</li>
              <li>Moins de 80% : pas de lot</li>
            </ul>

            <p>
              <strong>Article 4 – Validité</strong>
            </p>
            <p>
              Les gains et lots sont valables uniquement pendant la semaine en cours et{" "}
              <strong>expirent le dimanche à 23h59</strong>. Présentation du QR code/coupon en caisse.
            </p>

            <p>
              <strong>Article 5 – Réserve</strong>
            </p>
            <p>
              La Crêperie des Saveurs se réserve le droit d’annuler ou modifier le jeu en cas de force majeure
              ou d’abus avéré.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="card-warm mb-6 bg-butter/30 border-caramel/20">
          <h2 className="font-display text-lg font-semibold mb-4">Non-affiliation</h2>
          <p className="text-sm text-muted-foreground">
            Ce jeu n’est pas sponsorisé, organisé ou géré par Google, Facebook, Instagram, WhatsApp
            ou toute autre plateforme tierce. Ces marques sont citées uniquement à titre informatif.
          </p>
        </section>

        {/* Contact */}
        <section className="text-center p-6 bg-secondary/30 rounded-2xl">
          <h2 className="font-display text-lg font-semibold mb-4">Une question ?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:dlacreperie@gmail.com"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              dlacreperie@gmail.com
            </a>
            <a
              href="tel:0259660176"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="w-4 h-4" />
              02 59 66 01 76
            </a>
          </div>
        </section>

        <SocialFooter />
      </div>
    </div>
  );
};

export default Legal;
