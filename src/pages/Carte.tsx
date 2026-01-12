import { UtensilsCrossed, Flame, Snowflake, Leaf, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import SocialFooter from "@/components/SocialFooter";

// Set to false when menu is ready
const MENU_UNDER_CONSTRUCTION = false;

const Carte = () => {
  // Show under construction message if not ready
  if (MENU_UNDER_CONSTRUCTION) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-warm text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">
              Menu en cours de mise à jour
            </h1>
            <p className="text-muted-foreground">
              Notre carte sera bientôt disponible.
              <br />
              En attendant, n'hésitez pas à nous appeler !
            </p>
            <a
              href="tel:0259660176"
              className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              📞 02 59 66 01 76
            </a>
          </motion.div>
          <SocialFooter />
        </div>
      </div>
    );
  }

  const galettesSalees = [
    { name: "La Complète", description: "Œuf, jambon, emmental", price: "8,50 €", popular: true },
    { name: "La Forestière", description: "Champignons, lardons, crème fraîche", price: "9,00 €" },
    { name: "La Chèvre Miel", description: "Fromage de chèvre, miel, noix", price: "9,50 €", popular: true },
    { name: "La Savoyarde", description: "Reblochon, pommes de terre, lardons", price: "10,00 €" },
    { name: "La Bretonne", description: "Andouille, oignons confits", price: "9,00 €" },
    { name: "La Saumon", description: "Saumon fumé, crème, aneth", price: "11,00 €" },
  ];

  const crepesSucrees = [
    { name: "La Beurre Sucre", description: "Beurre demi-sel, sucre", price: "4,50 €" },
    { name: "La Nutella", description: "Pâte à tartiner noisettes-cacao", price: "5,50 €", popular: true },
    { name: "La Caramel Beurre Salé", description: "Caramel maison, fleur de sel", price: "6,00 €", popular: true },
    { name: "La Pomme Cannelle", description: "Pommes poêlées, cannelle, sucre", price: "6,50 €" },
    { name: "La Banane Chocolat", description: "Banane fraîche, chocolat chaud", price: "6,50 €" },
    { name: "La Chantilly", description: "Crème fouettée maison, fruits rouges", price: "7,00 €" },
  ];

  const formules = [
    { name: "Formule Midi", description: "1 galette + 1 boisson", price: "11,50 €" },
    { name: "Formule Complète", description: "1 galette + 1 crêpe + 1 boisson", price: "15,00 €", popular: true },
    { name: "Formule Duo", description: "2 galettes ou 2 crêpes au choix", price: "14,00 €" },
  ];

  const MenuSection = ({ title, icon: Icon, items }: { title: string; icon: any; items: any[] }) => (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index}
            className="card-warm flex items-start justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold">{item.name}</h3>
                {item.popular && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    Populaire
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
            <span className="font-display font-bold text-primary whitespace-nowrap">
              {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <UtensilsCrossed className="w-4 h-4 inline mr-1" />
            Notre Carte
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">
            Crêpes & Galettes
          </h1>
          <p className="text-muted-foreground">
            Préparées avec amour et ingrédients de qualité
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="w-4 h-4 text-terracotta" />
            <span>Salé</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Snowflake className="w-4 h-4 text-caramel" />
            <span>Sucré</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Leaf className="w-4 h-4 text-herb" />
            <span>Végétarien disponible</span>
          </div>
        </div>

        {/* Formules */}
        <MenuSection title="Les Formules" icon={UtensilsCrossed} items={formules} />

        {/* Galettes */}
        <MenuSection title="Galettes Salées" icon={Flame} items={galettesSalees} />

        {/* Crêpes */}
        <MenuSection title="Crêpes Sucrées" icon={Snowflake} items={crepesSucrees} />

        {/* Note */}
        <div className="text-center p-6 bg-butter/30 rounded-2xl border border-caramel/10">
          <p className="text-sm text-muted-foreground">
            🌾 Nos galettes sont préparées avec de la farine de sarrasin bio
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            📍 Carte sujette à modifications selon la saison et les arrivages
          </p>
        </div>

        <SocialFooter />
      </div>
    </div>
  );
};

export default Carte;
