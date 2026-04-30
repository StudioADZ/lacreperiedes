import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Baby,
  Beer,
  Coffee,
  CupSoda,
  Flame,
  IceCreamBowl,
  Info,
  Leaf,
  Salad,
  Snowflake,
  Sparkles,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

type MenuHighlight = "signature" | "classic" | "fresh" | "sweet" | "drink" | "kids";

type MenuItem = {
  name: string;
  description?: string;
  price: string;
  badge?: string;
};

type MenuSection = {
  id: string;
  title: string;
  subtitle?: string;
  icon: typeof UtensilsCrossed;
  highlight: MenuHighlight;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    id: "formules",
    title: "Formules",
    subtitle: "Les compositions faciles à choisir, parfaites pour découvrir la maison.",
    icon: Sparkles,
    highlight: "signature",
    items: [
      {
        name: "La formule P’tite Faim",
        description: "Base pancake, œufs brouillés et poitrine grillée, gelée de cidre ou miel, boisson chaude café.",
        price: "7€",
        badge: "petit appétit",
      },
      {
        name: "Formule classique",
        description: "Votre choix dans les galettes et crêpes classiques + 1 verre de cidre 20cl ou boisson.",
        price: "13,90€",
      },
      {
        name: "Formule gourmande",
        description: "Votre choix dans les galettes et crêpes gourmandes + 1 verre de cidre 20cl ou boisson + café ou thé.",
        price: "16,90€",
        badge: "gourmand",
      },
    ],
  },
  {
    id: "galettes-classiques",
    title: "Galettes classiques",
    subtitle: "Les incontournables, simples, lisibles et efficaces. La base solide, comme une bonne billig bien chaude.",
    icon: Flame,
    highlight: "classic",
    items: [
      { name: "Complète", description: "Œuf, emmental, jambon.", price: "7,00€" },
      { name: "Super complète", description: "Œuf, emmental, jambon, champignons, compotée de tomates.", price: "10,50€" },
      { name: "Fromagère", description: "Œuf, emmental, tome, chèvre, compotée de tomates.", price: "10,50€" },
      { name: "Bergère", description: "Tapenade, œuf, chèvre, bacon, compotée de tomates.", price: "10,50€" },
      { name: "Bretonne", description: "Pommes de terre, saucisse, confit d’oignons, sauce moutarde, andouille Guémené.", price: "12,50€" },
      { name: "Tête du chef", description: "Œuf, emmental, jambon, confit d’oignon, bœuf haché, sauce moutarde.", price: "14,00€", badge: "chef" },
    ],
  },
  {
    id: "galettes-gourmandes",
    title: "Galettes gourmandes",
    subtitle: "Des recettes généreuses, plus travaillées, avec de vrais marqueurs de caractère.",
    icon: UtensilsCrossed,
    highlight: "signature",
    items: [
      { name: "Saucisse", description: "Pommes de terre, saucisse, confit d’oignon, tome, sauce moutarde, salade.", price: "14,00€" },
      { name: "Bella Ouest", description: "Œuf, confit d’oignons, chèvre, salade, magret de canard, noix, miel.", price: "14,50€" },
      { name: "Terre & Mer", description: "Champignons, noix de St Jacques au vinaigre balsamique, andouille, salade.", price: "14,50€" },
      { name: "Auvergnate", description: "Œuf, confit d’oignons, pommes de terre, St Nectaire, sauce moutarde, poitrine de porc, salade.", price: "16,50€" },
      { name: "Pays-Basque", description: "Œuf, chorizo, piperade de poivrons, fromage basque, poitrine de porc, compotée de tomate, salade.", price: "16,50€" },
      { name: "Atlantique", description: "Fondue de poireaux, saumon fumé, crème fraîche, moules, amandes grillées, œuf de lampe, compotée de tomate, salade.", price: "16,50€" },
      { name: "Super italiano", description: "Œuf, champignons, bœuf haché, chèvre, compotée de tomate, salade.", price: "16,50€" },
      { name: "St Jacques", description: "Fondue de poireaux, moules, saumon fumé, compotée de tomate, œuf de lampe, crème fraîche, salade.", price: "16,50€", badge: "mer" },
    ],
  },
  {
    id: "crepes-classiques",
    title: "Crêpes classiques",
    subtitle: "Les crêpes simples et efficaces, avec l’option sur-mesure à 5€.",
    icon: Snowflake,
    highlight: "sweet",
    items: [
      { name: "Beurre", price: "2,00€" },
      { name: "Sucre", price: "2,00€" },
      { name: "Beurre sucre", price: "2,50€" },
      { name: "Jus citron", price: "2,50€" },
      { name: "Miel", price: "3,00€" },
      { name: "Amande grillée", price: "3,00€" },
      { name: "Confiture du jour", price: "3,00€" },
      { name: "Amande jus citron", price: "3,50€" },
      { name: "Caramel beurre salé", price: "3,50€" },
      { name: "Chocolat maison", price: "3,50€" },
      { name: "Chocolat maison amande", price: "4,00€" },
      { name: "Caramel beurre salé amande", price: "4,00€" },
      { name: "Chocaramel", price: "4,00€" },
      {
        name: "Crêpe 3 ingrédients au choix",
        description: "Beurre, sucre, amandes grillées, jus citron, miel, chocolat, gelée de cidre + 1 boule de glace + chantilly.",
        price: "5€",
        badge: "sur-mesure",
      },
    ],
  },
  {
    id: "crepes-gourmandes",
    title: "Crêpes gourmandes",
    subtitle: "Le coin dessert qui assume. Ici, personne ne fait semblant d’avoir juste pris “un petit truc”.",
    icon: IceCreamBowl,
    highlight: "sweet",
    items: [
      { name: "Délice tropical", description: "Banane, amandes grillées, chocolat maison, chantilly.", price: "7,50€" },
      { name: "Douce poire", description: "Poires cuites, caramel beurre salé, amandes grillées, chantilly.", price: "7,50€" },
      { name: "La Normande", description: "Compote de pommes, caramel beurre salé, chantilly, crème fraîche, amandes, glace vanille.", price: "8,50€" },
      { name: "La Dame", description: "Compote de banane, glace fraise, amandes grillées, chantilly, chocolat maison.", price: "8,50€" },
      { name: "Tartintin", description: "Pommes cuites, glace vanille, caramel beurre salé, chantilly, amandes grillées.", price: "8,50€" },
      { name: "Poireuse", description: "Poires cuites, glace caramel, chocaramel, chantilly, amandes grillées.", price: "8,50€" },
      { name: "Ananas", description: "Ananas au rhum, gelée de cidre, glace coco, chantilly, amandes grillées.", price: "8,50€" },
      { name: "Crêpe du jour", description: "Gelée de cidre, fruit du jour, chocaramel, glace caramel, chantilly, amandes grillées.", price: "8,50€", badge: "du moment" },
    ],
  },
  {
    id: "salades",
    title: "Salades",
    subtitle: "Des assiettes fraîches, complètes et lisibles pour ceux qui veulent léger… mais pas triste.",
    icon: Salad,
    highlight: "fresh",
    items: [
      { name: "Salade Fermière", description: "Dés de fromage, dés de jambon, miel, noix.", price: "10,00€" },
      { name: "Salade Gasconne", description: "Gésiers de canard, dés de fromage, pommes de terre, tomates.", price: "10,00€" },
      { name: "Salade Nordique", description: "Saumon fumé, pommes de terre, tomates cerises, dés de fromage.", price: "10,00€" },
      { name: "Salade Campagnarde", description: "Lardons, œuf, pommes de terre, tomates cerises, dés de fromage, oignons rouges.", price: "12,00€" },
      { name: "Salade du chef", description: "Gésiers de canard, tomates cerises, dés de fromage, œuf, avocat.", price: "12,00€", badge: "chef" },
    ],
  },
  {
    id: "entrees",
    title: "Entrées",
    subtitle: "Pour commencer sans tourner autour de la poêle.",
    icon: Leaf,
    highlight: "fresh",
    items: [
      { name: "Omelette nature", description: "3 œufs.", price: "5,00€" },
      { name: "Tartare de saumon fumé", description: "Tomates séchées, fromage, pesto, avocats.", price: "5,00€" },
      { name: "Planche de tapas", description: "Jambon Serrano, saucisson sec, saucisson à l’ail.", price: "5,00€" },
      { name: "Omelette du chef", description: "3 œufs, oignon rouge, ail, cumin.", price: "5,00€" },
    ],
  },
  {
    id: "enfants",
    title: "Menu enfant",
    subtitle: "Des portions adaptées, avec les classiques qui mettent tout le monde d’accord.",
    icon: Baby,
    highlight: "kids",
    items: [
      { name: "Small Kids (-5 ans)", description: "Jambon, fromage.", price: "5,00€" },
      { name: "Kids (-7 ans)", description: "Jambon fromage ou œuf fromage + crêpe au sucre.", price: "7,00€" },
      { name: "Childrens (-9 ans)", description: "Complète + crêpe beurre-sucre + une boule de glace au choix + chantilly + boisson.", price: "12,00€" },
      { name: "BG (-12 ans)", description: "Super complète + crêpe chocolat ou caramel + une boule de glace au choix + chantilly + boisson.", price: "13,00€" },
    ],
  },
  {
    id: "glaces",
    title: "Glaces",
    subtitle: "Parfums : caramel, vanille, coco, fraise.",
    icon: IceCreamBowl,
    highlight: "sweet",
    items: [
      { name: "1 boule", price: "2,00€" },
      { name: "2 boules", price: "3,00€" },
      { name: "3 boules", price: "4,00€" },
    ],
  },
  {
    id: "boissons",
    title: "Boissons",
    subtitle: "Softs, cafés et boissons fraîches.",
    icon: CupSoda,
    highlight: "drink",
    items: [
      { name: "Sirop à l’eau", price: "1,50€" },
      { name: "Thé orange, citron, menthe", price: "2,50€" },
      { name: "Café / café noisette", price: "1,50€" },
      { name: "Café double", price: "2,00€" },
      { name: "Lait au verre", price: "2,00€" },
      { name: "Chocolat", price: "2,50€" },
      { name: "Jus orange, abricot, pomme, ananas", price: "3,00€" },
      { name: "Breizh Cola, Agrume, Tonic, Thé glacé", price: "3,00€" },
    ],
  },
  {
    id: "cidres-cocktails",
    title: "Cidres & cocktails",
    subtitle: "Cidrerie et ruchers sarthois, Val de Rance et kirs maison.",
    icon: Wine,
    highlight: "drink",
    items: [
      { name: "Cidre brut ou demi-sec — verre 20cl", description: "Cidrerie et ruchers sarthois, local.", price: "3,00€" },
      { name: "Cidre brut ou demi-sec — pichet 50cl", description: "Cidrerie et ruchers sarthois, local.", price: "9,00€" },
      { name: "Cidre brut ou demi-sec — bouteille", description: "Cidrerie et ruchers sarthois, local.", price: "15,50€" },
      { name: "BIO rosé — verre 20cl", description: "Val de Rance.", price: "4,00€" },
      { name: "BIO rosé — pichet 50cl", description: "Val de Rance.", price: "9,00€" },
      { name: "BIO rosé — bouteille", description: "Val de Rance.", price: "15,00€" },
      { name: "Kir Breton 20cl", description: "Pommes, cidre, rhum.", price: "5€" },
      { name: "Kir Nantais 20cl", description: "Muscadet.", price: "5€" },
      { name: "Kir cidre des Saveurs 20cl", description: "Fine de Sarthe et pommes.", price: "5€" },
    ],
  },
  {
    id: "bieres-aperitifs",
    title: "Bières & apéritifs",
    subtitle: "En bouteille, pression et classiques d’apéritif.",
    icon: Beer,
    highlight: "drink",
    items: [
      { name: "Affligem blonde", description: "Bière en bouteille.", price: "3,00€" },
      { name: "Bière du moment", description: "En bouteille.", price: "3,00€" },
      { name: "Bière du moment", description: "En pression.", price: "3,50€" },
      { name: "Porto", price: "3,00€" },
      { name: "Jack Daniel’s", price: "4,50€" },
      { name: "Rhum blanc", price: "4,50€" },
      { name: "Grand Marnier rouge", price: "5,00€" },
      { name: "Calvados", price: "5,00€" },
      { name: "Fine de Sarthe", price: "5,00€" },
    ],
  },
];

const highlightStyles: Record<MenuHighlight, string> = {
  signature: "border-caramel/30 bg-gradient-to-br from-caramel/12 via-white/80 to-butter/35",
  classic: "border-terracotta/20 bg-gradient-to-br from-white/85 to-terracotta/8",
  fresh: "border-herb/20 bg-gradient-to-br from-white/85 to-herb/8",
  sweet: "border-caramel/20 bg-gradient-to-br from-white/85 to-butter/30",
  drink: "border-primary/15 bg-gradient-to-br from-white/85 to-primary/5",
  kids: "border-butter/60 bg-gradient-to-br from-white/85 to-butter/40",
};

const tabLabels = [
  { id: "top", label: "Top" },
  { id: "galettes-classiques", label: "Galettes" },
  { id: "crepes-classiques", label: "Crêpes" },
  { id: "salades", label: "Salades" },
  { id: "boissons", label: "Boissons" },
];

const CartePublicDisplay = () => {
  const [activeFilter, setActiveFilter] = useState("top");

  const visibleSections = useMemo(() => {
    if (activeFilter === "top") {
      return menuSections;
    }
    if (activeFilter === "galettes-classiques") {
      return menuSections.filter((section) => section.id.startsWith("galettes"));
    }
    if (activeFilter === "crepes-classiques") {
      return menuSections.filter((section) => section.id.startsWith("crepes") || section.id === "glaces");
    }
    if (activeFilter === "salades") {
      return menuSections.filter((section) => section.id === "salades" || section.id === "entrees");
    }
    if (activeFilter === "boissons") {
      return menuSections.filter((section) => ["boissons", "cidres-cocktails", "bieres-aperitifs"].includes(section.id));
    }
    return menuSections;
  }, [activeFilter]);

  const renderMenuItem = (item: MenuItem, index: number) => (
    <motion.article
      key={`${item.name}-${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.22) }}
      className="rounded-2xl border border-border/55 bg-background/65 p-4 shadow-sm transition hover:border-caramel/35 hover:bg-background/85"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-base font-bold leading-tight text-espresso">{item.name}</h4>
            {item.badge && (
              <span className="rounded-full bg-caramel/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-caramel">
                {item.badge}
              </span>
            )}
          </div>
          {item.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
        </div>
        <span className="shrink-0 rounded-xl border border-caramel/25 bg-white px-3 py-1.5 font-display text-sm font-black text-caramel shadow-sm">
          {item.price}
        </span>
      </div>
    </motion.article>
  );

  const renderSection = (section: MenuSection, sectionIndex: number) => {
    const Icon = section.icon;
    return (
      <motion.section
        key={section.id}
        id={section.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sectionIndex * 0.05 }}
        className={`scroll-mt-28 rounded-[2rem] border p-4 shadow-warm ${highlightStyles[section.highlight]}`}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-caramel shadow-sm">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-black leading-tight text-espresso">{section.title}</h3>
            {section.subtitle && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>}
          </div>
        </div>
        <div className="space-y-3">{section.items.map(renderMenuItem)}</div>
      </motion.section>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-butter/55 via-background to-caramel/10 p-5 text-center shadow-warm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-caramel shadow-sm">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-caramel">Carte maison</p>
        <h2 className="mt-2 font-display text-2xl font-black text-espresso">Galettes, crêpes, salades & boissons</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          La carte complète avec les prix, rangée pour mobile : classique quand il faut, gourmande quand il faut aussi.
        </p>
      </div>

      <div className="sticky top-16 z-20 -mx-4 border-y border-border/60 bg-background/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {tabLabels.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`min-w-fit rounded-full border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "border-caramel bg-caramel text-white shadow-sm"
                    : "border-border/70 bg-white/70 text-muted-foreground hover:border-caramel/40 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">{visibleSections.map(renderSection)}</div>

      <div className="rounded-[1.75rem] border border-border/60 bg-white/75 p-4 text-sm text-muted-foreground shadow-sm">
        <div className="mb-2 flex items-center gap-2 font-semibold text-espresso">
          <Info className="h-4 w-4 text-caramel" />
          Informations allergènes
        </div>
        <p className="leading-relaxed">
          Allergènes possibles selon les recettes : œufs, produits laitiers, gluten, poisson/fruits de mer, fruits à coque,
          moutarde, miel, soja, sésame, céleri et sulfites. Demandez confirmation sur place pour toute allergie ou intolérance.
        </p>
        <p className="mt-3 text-xs italic">L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>
      </div>
    </motion.div>
  );
};

export default CartePublicDisplay;
