import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Salad, Snowflake, Sparkles, UtensilsCrossed } from "lucide-react";

type MenuHighlight = "signature" | "classic" | "fresh" | "sweet";

type MenuItem = {
  name: string;
  description?: string;
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
    title: "Nos formules",
    subtitle: "Les mêmes formules que sur la page d’accueil, présentées ici sans prix pour garder une carte lisible et cohérente.",
    icon: Sparkles,
    highlight: "signature",
    items: [
      {
        name: "Formule Goûter",
        description: "Crêpe gourmande de la semaine + 1 boisson sans alcool.",
        badge: "dès juillet",
      },
      {
        name: "Formule Petite Faim",
        description: "1 galette avec 2 ingrédients au choix + 1 boisson sans alcool.",
      },
      {
        name: "Formule Salade",
        description: "1 salade + 1 crêpe classique + 1 boisson.",
        badge: "dès juin",
      },
      {
        name: "Formule Classique",
        description: "1 boisson + 1 galette classique + 1 crêpe classique.",
      },
      {
        name: "Formule Gourmande",
        description: "1 boisson + galette gourmande de la semaine + crêpe gourmande de la semaine + café ou thé.",
        badge: "menu secret",
      },
    ],
  },
  {
    id: "galettes-classiques",
    title: "Galettes classiques",
    subtitle: "Les incontournables de la maison : lisibles, généreuses, efficaces. La base solide, comme une bonne billig bien chaude.",
    icon: Flame,
    highlight: "classic",
    items: [
      { name: "Complète", description: "Œuf, emmental, jambon." },
      { name: "Super complète", description: "Œuf, emmental, jambon, champignons, compotée de tomates." },
      { name: "Fromagère", description: "Œuf, emmental, tome, chèvre, compotée de tomates." },
      { name: "Bergère", description: "Tapenade, œuf, chèvre, bacon, compotée de tomates." },
      { name: "Bretonne", description: "Pommes de terre, saucisse, confit d’oignons, sauce moutarde, andouille Guémené." },
      { name: "Tête du chef", description: "Œuf, emmental, jambon, confit d’oignon, bœuf haché, sauce moutarde.", badge: "chef" },
    ],
  },
  {
    id: "crepes-classiques",
    title: "Crêpes classiques",
    subtitle: "Les douceurs simples, celles qui n’ont pas besoin de faire les intéressantes pour être bonnes.",
    icon: Snowflake,
    highlight: "sweet",
    items: [
      { name: "Beurre" },
      { name: "Sucre" },
      { name: "Beurre sucre" },
      { name: "Jus citron" },
      { name: "Miel" },
      { name: "Amande grillée" },
      { name: "Confiture du jour" },
      { name: "Amande jus citron" },
      { name: "Caramel beurre salé" },
      { name: "Chocolat maison" },
      { name: "Chocolat maison amande" },
      { name: "Caramel beurre salé amande" },
      { name: "Chocaramel" },
      {
        name: "Crêpe 3 ingrédients au choix",
        description: "Beurre, sucre, amandes grillées, jus citron, miel, chocolat, gelée de cidre + 1 boule de glace + chantilly.",
        badge: "sur-mesure",
      },
    ],
  },
  {
    id: "salades",
    title: "Salades",
    subtitle: "Des assiettes fraîches et complètes pour ceux qui veulent léger… mais pas triste.",
    icon: Salad,
    highlight: "fresh",
    items: [
      { name: "Salade Fermière", description: "Dés de fromage, dés de jambon, miel, noix." },
      { name: "Salade Gasconne", description: "Gésiers de canard, dés de fromage, pommes de terre, tomates." },
      { name: "Salade Nordique", description: "Saumon fumé, pommes de terre, tomates cerises, dés de fromage." },
      { name: "Salade Campagnarde", description: "Lardons, œuf, pommes de terre, tomates cerises, dés de fromage, oignons rouges." },
      { name: "Salade du chef", description: "Gésiers de canard, tomates cerises, dés de fromage, œuf, avocat.", badge: "chef" },
    ],
  },
];

const highlightStyles: Record<MenuHighlight, string> = {
  signature: "border-caramel/30 bg-gradient-to-br from-caramel/12 via-white/80 to-butter/35",
  classic: "border-terracotta/20 bg-gradient-to-br from-white/85 to-terracotta/8",
  fresh: "border-herb/20 bg-gradient-to-br from-white/85 to-herb/8",
  sweet: "border-caramel/20 bg-gradient-to-br from-white/85 to-butter/30",
};

const tabLabels = [
  { id: "top", label: "Tout" },
  { id: "formules", label: "Formules" },
  { id: "galettes-classiques", label: "Galettes" },
  { id: "crepes-classiques", label: "Crêpes" },
  { id: "salades", label: "Salades" },
];

const CartePublicDisplay = () => {
  const [activeFilter, setActiveFilter] = useState("top");

  const visibleSections = useMemo(() => {
    if (activeFilter === "top") return menuSections;
    return menuSections.filter((section) => section.id === activeFilter);
  }, [activeFilter]);

  const renderMenuItem = (item: MenuItem, index: number) => (
    <motion.article
      key={`${item.name}-${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.22) }}
      className="rounded-2xl border border-border/55 bg-background/65 p-4 shadow-sm transition hover:border-caramel/35 hover:bg-background/85"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-base font-bold leading-tight text-espresso">{item.name}</h4>
        {item.badge && (
          <span className="rounded-full bg-caramel/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-caramel">
            {item.badge}
          </span>
        )}
      </div>
      {item.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
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
        <h2 className="mt-2 font-display text-2xl font-black text-espresso">Formules, galettes, crêpes & salades</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Une présentation premium et volontairement sans prix : on garde les prix sur la page d’accueil pour les formules, et ici la carte reste claire.
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
    </motion.div>
  );
};

export default CartePublicDisplay;
