import { FileText, Mail, Phone, Shield, Scale, Gift } from "lucide-react";

const Legal = () => {
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

        {/* RGPD */}
        <section className="card-warm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-herb" />
            Protection des données (RGPD)
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              nous vous informons que les données personnelles collectées via notre site 
              (nom, email, téléphone) sont utilisées uniquement pour :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>La participation au quiz hebdomadaire</li>
              <li>L'attribution et la validation des lots</li>
              <li>La communication promotionnelle (si consentement)</li>
            </ul>
            <p>
              Vos données sont conservées pendant 1 an maximum et ne sont jamais 
              vendues ou partagées avec des tiers. Vous disposez d'un droit d'accès, 
              de rectification et de suppression de vos données.
            </p>
            <p>
              Pour exercer vos droits, contactez-nous à{" "}
              <a href="mailto:dlacreperie@gmail.com" className="text-primary">
                dlacreperie@gmail.com
              </a>
            </p>
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
              sans obligation d'achat, du dimanche 00h00 au samedi 23h59 (heure de Paris).
            </p>

            <p><strong>Article 2 – Participation</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ouvert à toute personne de 18 ans ou plus, ou de 13 ans avec autorisation parentale</li>
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
              Les lots sont valables 7 jours après la fin de la semaine de gain et 
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
      </div>
    </div>
  );
};

export default Legal;
