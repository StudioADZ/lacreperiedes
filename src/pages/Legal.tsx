import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Mail, Phone, Shield, Scale, Gift, Lock, ScrollText } from "lucide-react";
import SocialFooter from "@/components/SocialFooter";

const Legal = () => {
  const location = useLocation();

  // Scroll to section on hash change
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4 inline mr-1" />
            Informations légales
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">
            Mentions légales
          </h1>
        </div>

        {/* Company Info */}
        <section className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Identification
          </h2>
          <div className="space-y-2 text-sm">
            <p><strong>Raison sociale :</strong> La Crêperie des Saveurs</p>
            <p><strong>SIRET :</strong> 930 910 187 000 10</p>
            <p><strong>Adresse :</strong> 17 Place Carnot – Galerie des Halles – 72600 Mamers</p>
            <p><strong>Email :</strong> <a href="mailto:dlacreperie@gmail.com" className="text-primary">dlacreperie@gmail.com</a></p>
            <p><strong>Téléphone :</strong> <a href="tel:0259660176" className="text-primary">02 59 66 01 76</a></p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="card-warm mb-6 scroll-mt-24">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-herb" />
            Politique de Confidentialité
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong>1. Responsable du traitement</strong></p>
            <p>
              La Crêperie des Saveurs, située au 17 Place Carnot – 72600 Mamers, 
              est responsable du traitement de vos données personnelles.
            </p>

            <p><strong>2. Données collectées</strong></p>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Identifiant technique de l'appareil (empreinte anonymisée)</li>
            </ul>

            <p><strong>3. Finalités du traitement</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Participation au quiz hebdomadaire</li>
              <li>Attribution et validation des lots gagnés</li>
              <li>Prévention des fraudes et abus</li>
              <li>Communications promotionnelles (avec consentement explicite)</li>
            </ul>

            <p><strong>4. Base légale</strong></p>
            <p>
              Le traitement est basé sur votre consentement explicite, 
              donné avant toute participation au quiz ou soumission de formulaire.
            </p>

            <p><strong>5. Durée de conservation</strong></p>
            <p>
              Vos données sont conservées pendant 1 an maximum après votre dernière 
              interaction, puis supprimées automatiquement.
            </p>

            <p><strong>6. Vos droits</strong></p>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement ("droit à l'oubli")</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>

            <p><strong>7. Exercer vos droits</strong></p>
            <p>
              Pour exercer vos droits, contactez-nous à{" "}
              <a href="mailto:dlacreperie@gmail.com" className="text-primary">
                dlacreperie@gmail.com
              </a>. Réponse sous 30 jours.
            </p>

            <p><strong>8. Sécurité</strong></p>
            <p>
              Vos données sont stockées de manière sécurisée et chiffrée. 
              Elles ne sont jamais vendues ni partagées avec des tiers.
            </p>
          </div>
        </section>

        {/* Terms of Use */}
        <section id="terms" className="card-warm mb-6 scroll-mt-24">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-caramel" />
            Conditions Générales d'Utilisation
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong>1. Objet</strong></p>
            <p>
              Les présentes CGU régissent l'utilisation du site web de La Crêperie 
              des Saveurs et de ses services, notamment le quiz hebdomadaire.
            </p>

            <p><strong>2. Accès au service</strong></p>
            <p>
              L'accès au site est gratuit. L'utilisateur doit disposer d'un appareil 
              connecté à Internet pour y accéder.
            </p>

            <p><strong>3. Inscription et participation</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>L'utilisateur s'engage à fournir des informations exactes</li>
              <li>Une seule participation gagnante par semaine et par personne</li>
              <li>Toute tentative de fraude entraînera la disqualification</li>
            </ul>

            <p><strong>4. Propriété intellectuelle</strong></p>
            <p>
              Tous les contenus du site (textes, images, logos) sont la propriété 
              exclusive de La Crêperie des Saveurs. Toute reproduction est interdite.
            </p>

            <p><strong>5. Responsabilité</strong></p>
            <p>
              La Crêperie des Saveurs ne saurait être tenue responsable des 
              dysfonctionnements techniques ou des interruptions de service.
            </p>

            <p><strong>6. Modification des CGU</strong></p>
            <p>
              Nous nous réservons le droit de modifier ces CGU à tout moment. 
              Les utilisateurs seront informés de toute modification significative.
            </p>

            <p><strong>7. Droit applicable</strong></p>
            <p>
              Les présentes CGU sont soumises au droit français. 
              En cas de litige, les tribunaux de Le Mans seront compétents.
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
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              nous vous informons que les données personnelles collectées via notre site 
              sont utilisées uniquement pour les finalités décrites dans notre 
              politique de confidentialité ci-dessus.
            </p>
            <div className="p-3 rounded-xl bg-herb/10 border border-herb/20">
              <p className="text-herb text-xs">
                🇪🇺 <strong>Conformité RGPD garantie</strong> : Vos données sont protégées 
                et vous pouvez exercer vos droits à tout moment.
              </p>
            </div>
          </div>
        </section>

        {/* Quiz Rules */}
        <section className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-caramel" />
            Règlement du Quiz
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong>Article 1 – Organisation</strong></p>
            <p>
              La Crêperie des Saveurs organise un jeu-quiz hebdomadaire gratuit, 
              sans obligation d'achat, du dimanche 01h00 au samedi 23h59 (heure de Paris).
            </p>

            <p><strong>Article 2 – Participation</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ouvert à toute personne de 16 ans ou plus</li>
              <li>Une seule participation gagnante par semaine et par personne (téléphone + appareil)</li>
              <li>Les lots sont à retirer sur place au restaurant</li>
            </ul>

            <p><strong>Article 3 – Lots</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>100% de bonnes réponses : 1 Formule Complète (limité à 10/semaine)</li>
              <li>90-99% de bonnes réponses : 1 Galette (limité à 20/semaine)</li>
              <li>80-89% de bonnes réponses : 1 Crêpe (limité à 30/semaine)</li>
              <li>Moins de 80% : pas de lot</li>
            </ul>

            <p><strong>Article 4 – Validité</strong></p>
            <p>
              Les lots sont valables 7 jours après la date de gain et 
              doivent être réclamés en présentant le QR code unique au restaurant.
            </p>

            <p><strong>Article 5 – Responsabilité</strong></p>
            <p>
              La Crêperie des Saveurs se réserve le droit d'annuler ou modifier le 
              jeu sans préavis en cas de force majeure.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="card-warm mb-6 bg-butter/30 border-caramel/20">
          <h2 className="font-display text-lg font-semibold mb-4">Non-affiliation</h2>
          <p className="text-sm text-muted-foreground">
            Ce jeu n'est pas sponsorisé, organisé ou géré par Google, Facebook, 
            Instagram, WhatsApp ou toute autre plateforme tierce. Ces marques 
            sont citées uniquement à titre informatif.
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

        {/* Social Footer */}
        <SocialFooter />
      </div>
    </div>
  );
};

export default Legal;
