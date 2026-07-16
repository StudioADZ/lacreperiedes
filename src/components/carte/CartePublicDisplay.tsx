import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Flame,
  GlassWater,
  Salad,
  Snowflake,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

type SectionId = "all" | "formules" | "galettes" | "crepes" | "salades" | "boissons";
type MenuTone = "signature" | "classic" | "sweet" | "fresh" | "drinks";

type MenuItem = {
  name: string;
  description?: string;
  badge?: string;
  price?: string;
  sortPrice: number;
  includedInClassicFormula?: boolean;
};

type MenuSection = {
  id: Exclude<SectionId, "all">;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: MenuTone;
  items: MenuItem[];
};

const sortItemsByPrice = (items: MenuItem[]) =>
  [...items].sort((a, b) => a.sortPrice - b.sortPrice || a.name.localeCompare(b.name, "fr"));

const SECTIONS: MenuSection[] = [
  {
    id: "formules",
    title: "Nos formules",
    subtitle: "Des formules claires et généreuses pour chaque moment de la journée.",
    icon: Sparkles,
    tone: "signature",
    items: sortItemsByPrice([
      {
        name: "Formule Goûter",
        description: "Une crêpe classique ou un dessert accompagné d’une boisson.",
        badge: "pause gourmande",
        price: "6,90 €",
        sortPrice: 6.9,
      },
      {
        name: "Formule Petite Faim",
        description: "Une galette et une boisson pour une pause rapide et gourmande.",
        badge: "rapide",
        price: "7,90 €",
        sortPrice: 7.9,
      },
      {
        name: "Formule Salade",
        description: "La salade de la semaine accompagnée d’un dessert.",
        badge: "fraîcheur",
        price: "12,90 €",
        sortPrice: 12.9,
      },
      {
        name: "Formule Classique",
        description: "Une galette marquée ★, un dessert et une boisson incluse.",
        badge: "la plus choisie",
        price: "14,90 €",
        sortPrice: 14.9,
      },
    ]),
  },
  {
    id: "galettes",
    title: "Galettes classiques",
    subtitle: "Les incontournables maison, préparés minute et servis généreusement.",
    icon: Flame,
    tone: "classic",
    items: sortItemsByPrice([
      { name: "Complète", description: "Œuf, emmental, jambon.", badge: "incontournable", price: "8,50 €", sortPrice: 8.5, includedInClassicFormula: true },
      { name: "Super complète", description: "Œuf, emmental, jambon, champignons, compotée de tomates.", price: "11,90 €", sortPrice: 11.9 },
      { name: "Fromagère", description: "Œuf, emmental, tome, chèvre, compotée de tomates.", badge: "végétarienne", price: "11,90 €", sortPrice: 11.9, includedInClassicFormula: true },
      { name: "Bergère", description: "Tapenade, œuf, chèvre, bacon, compotée de tomates.", price: "12,50 €", sortPrice: 12.5, includedInClassicFormula: true },
      { name: "Végétarienne", description: "Recette de saison, légumes du moment et fromage selon inspiration.", badge: "de saison", price: "12,90 €", sortPrice: 12.9 },
      { name: "Bretonne", description: "Pommes de terre, saucisse, confit d’oignons, sauce moutarde, andouille de Guémené.", price: "13,90 €", sortPrice: 13.9 },
      { name: "Tête du chef", description: "Œuf, emmental, jambon, confit d’oignons, bœuf haché, sauce moutarde.", badge: "chef", price: "15,90 €", sortPrice: 15.9 },
      { name: "Supplément salade", description: "Ajoutez une touche de fraîcheur à votre galette.", price: "+1,50 €", sortPrice: 99 },
    ]),
  },
  {
    id: "crepes",
    title: "Crêpes classiques",
    subtitle: "Les valeurs sûres maison, à savourer seules ou avec une touche gourmande.",
    icon: Snowflake,
    tone: "sweet",
    items: sortItemsByPrice([
      { name: "Sucre", description: "La simplicité qui fonctionne à tous les coups.", price: "2,50 €", sortPrice: 2.5 },
      { name: "Beurre sucre", description: "Fondante, chaude et incontournable.", price: "3,00 €", sortPrice: 3 },
      { name: "Miel du moment", description: "Douce et subtilement sucrée.", price: "3,50 €", sortPrice: 3.5 },
      { name: "Confiture du jour", description: "Selon l’inspiration et les disponibilités du moment.", price: "3,50 €", sortPrice: 3.5 },
      { name: "Caramel beurre salé", description: "Onctueux, maison et généreux.", badge: "maison", price: "4,00 €", sortPrice: 4 },
      { name: "Chocolat maison", description: "Chocolat chaud, fondant et généreux.", badge: "maison", price: "4,00 €", sortPrice: 4 },
      { name: "Chocolat banane", description: "Chocolat chaud et banane fraîche.", price: "4,50 €", sortPrice: 4.5 },
      { name: "Chantilly", description: "Pour compléter votre crêpe ou votre dessert.", price: "+0,80 €", sortPrice: 90 },
      { name: "Boule de glace", description: "Le supplément frais et gourmand.", price: "+2,00 €", sortPrice: 91 },
    ]),
  },
  {
    id: "salades",
    title: "Salades",
    subtitle: "Des assiettes fraîches et complètes pour une pause plus légère.",
    icon: Salad,
    tone: "fresh",
    items: sortItemsByPrice([
      { name: "Salade Fermière", description: "Dés de fromage, dés de jambon, miel, noix.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Gasconne", description: "Gésiers de canard, dés de fromage, pommes de terre, tomates.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Nordique", description: "Saumon fumé, pommes de terre, tomates cerises, dés de fromage.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Campagnarde", description: "Lardons, œuf, pommes de terre, tomates cerises, dés de fromage, oignons rouges.", price: "12,00 €", sortPrice: 12 },
      { name: "Salade du chef", description: "Gésiers de canard, tomates cerises, dés de fromage, œuf, avocat.", badge: "chef", price: "12,00 €", sortPrice: 12 },
    ]),
  },
  {
    id: "boissons",
    title: "Boissons à la carte",
    subtitle: "Boissons fraîches, cidres, bières, vins et boissons chaudes selon vos envies.",
    icon: GlassWater,
    tone: "drinks",
    items: [
      { name: "Boissons chaudes", description: "Café expresso\nCafé double\nChocolat chaud\nThé\nLait au verre", price: "2,00 €\n2,50 €\n3,00 €\n3,50 €\n2,50 €", sortPrice: 1 },
      { name: "Sodas & sans alcool", description: "Sirop à l’eau\nSodas 33 cl selon disponibilité\nJus de fruits 25 cl\nPerrier bouteille", price: "2,00 €\n3,50 €\n3,50 €\n4,00 €", sortPrice: 2 },
      { name: "Cidres", description: "Cidre brut 25 cl\nCidre pichet\nCidre bouteille\nSélection locale selon disponibilité", badge: "local", price: "4,50 €\n9,90 €\n16,90 €", sortPrice: 3 },
      { name: "Bières", description: "Bière du moment\nBière pression", price: "3,50 €\n4,00 €", sortPrice: 4 },
      { name: "Apéritifs", description: "Kir breton\nKir nantais\nKir des Saveurs", price: "5,90 €\n5,90 €\n5,90 €", sortPrice: 5 },
      { name: "Alcools & digestifs", description: "Porto\nJack Daniel’s\nRhum blanc\nGrand Marnier rouge\nCalvados\nFine Sarthe", price: "3,50 €\n5,00 €\n5,00 €\n5,50 €\n5,50 €\n5,50 €", sortPrice: 6 },
      { name: "Vins", description: "Blanc, rouge ou rosé · verre\nBlanc, rouge ou rosé · pichet\nBlanc, rouge ou rosé · bouteille", price: "3,50 €\n9,90 €\n16,90 €", sortPrice: 7 },
    ],
  },
];

const FILTERS: { id: SectionId; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "formules", label: "Formules" },
  { id: "galettes", label: "Galettes" },
  { id: "crepes", label: "Crêpes" },
  { id: "salades", label: "Salades" },
  { id: "boissons", label: "Boissons" },
];

const TONE_STYLES: Record<MenuTone, string> = {
  signature: "border-caramel/30 bg-gradient-to-br from-caramel/12 via-white/80 to-butter/35",
  classic: "border-terracotta/20 bg-gradient-to-br from-white/85 to-terracotta/8",
  sweet: "border-caramel/20 bg-gradient-to-br from-white/85 to-butter/30",
  fresh: "border-herb/20 bg-gradient-to-br from-white/85 to-herb/8",
  drinks: "border-caramel/25 bg-gradient-to-br from-white/90 via-butter/20 to-caramel/10",
};

const getHeaderOffset = () => {
  const appHeader = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
  return Math.ceil(appHeader + 104);
};

const CartePublicDisplay = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("all");
  const menuTopRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<Exclude<SectionId, "all">, HTMLElement | null>>({
    formules: null,
    galettes: null,
    crepes: null,
    salades: null,
    boissons: null,
  });
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      const topPosition = menuTopRef.current?.getBoundingClientRect().top ?? 0;
      if (topPosition > 80) {
        setActiveSection("all");
        return;
      }
      const checkpoint = getHeaderOffset();
      let current: SectionId = "formules";
      for (const section of SECTIONS) {
        const element = sectionRefs.current[section.id];
        if (element && element.getBoundingClientRect().top <= checkpoint) current = section.id;
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToElement = (element: HTMLElement | null) => {
    if (!element) return;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    isProgrammaticScrollRef.current = true;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 650);
  };

  const handleFilterChange = (filter: SectionId) => {
    setActiveSection(filter);
    scrollToElement(filter === "all" ? menuTopRef.current : sectionRefs.current[filter]);
  };

  return (
    <motion.div ref={menuTopRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scroll-mt-28 space-y-6">
      <MenuHero />
      <MenuFilters activeFilter={activeSection} onChange={handleFilterChange} />
      <div className="space-y-5">
        {SECTIONS.map((section, sectionIndex) => (
          <MenuSectionCard
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            setSectionRef={(element) => {
              sectionRefs.current[section.id] = element;
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const MenuHero = () => (
  <div className="rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-butter/55 via-background to-caramel/10 p-5 text-center shadow-warm">
    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-caramel shadow-sm">
      <UtensilsCrossed className="h-7 w-7" aria-hidden="true" />
    </div>
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-caramel">Fait maison</p>
    <h2 className="mt-2 font-display text-2xl font-black text-espresso">Choisissez selon votre envie</h2>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
      Utilisez les catégories pour trouver rapidement votre formule, votre plat ou votre boisson.
    </p>
  </div>
);

const MenuFilters = ({ activeFilter, onChange }: { activeFilter: SectionId; onChange: (filter: SectionId) => void }) => {
  const activeButtonRefs = useRef<Record<SectionId, HTMLButtonElement | null>>({
    all: null,
    formules: null,
    galettes: null,
    crepes: null,
    salades: null,
    boissons: null,
  });
  const activeLabel = FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "Tout";

  useEffect(() => {
    activeButtonRefs.current[activeFilter]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeFilter]);

  return (
    <div className="sticky top-16 z-20 -mx-4 border-y border-border/60 bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Catégorie</span>
        <span className="rounded-full bg-caramel/12 px-3 py-1 text-xs font-black text-caramel" aria-live="polite">{activeLabel}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              ref={(element) => {
                activeButtonRefs.current[filter.id] = element;
              }}
              type="button"
              onClick={() => onChange(filter.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-caramel text-white shadow-md" : "bg-white/85 text-espresso/80 ring-1 ring-border hover:bg-caramel/10"}`}
              aria-pressed={active}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

type MenuSectionCardProps = {
  section: MenuSection;
  sectionIndex: number;
  setSectionRef: (element: HTMLElement | null) => void;
};

const MenuSectionCard = ({ section, sectionIndex, setSectionRef }: MenuSectionCardProps) => {
  const Icon = section.icon;
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      ref={setSectionRef}
      id={section.id}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: reduceMotion ? 0 : sectionIndex * 0.04, duration: 0.3 }}
      className={`scroll-mt-32 rounded-[1.75rem] border p-4 shadow-warm ${TONE_STYLES[section.tone]}`}
      aria-labelledby={`${section.id}-title`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-caramel shadow-sm">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h2 id={`${section.id}-title`} className="font-display text-2xl font-black text-espresso">{section.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>
          {section.id === "galettes" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-caramel/12 px-3 py-1.5 text-xs font-bold text-caramel">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Galette incluse dans la Formule Classique à 14,90 €
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {section.items.map((item) => (
          <article key={`${section.id}-${item.name}`} className="rounded-2xl border border-caramel/18 bg-white/80 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="flex items-center gap-1.5 font-display text-lg font-black leading-tight text-espresso">
                    {item.includedInClassicFormula && <Star className="h-4 w-4 shrink-0 fill-caramel text-caramel" aria-label="Incluse dans la Formule Classique" />}
                    {item.name}
                  </h3>
                  {item.badge && (
                    <span className="rounded-full bg-butter/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-caramel">{item.badge}</span>
                  )}
                </div>
                {item.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/75">{item.description}</p>}
              </div>
              {item.price && (
                <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-caramel/10">
                  <span className="sr-only">Prix : </span>
                  <p className="whitespace-pre-line font-display text-lg font-black leading-tight text-caramel">{item.price}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
};

export default CartePublicDisplay;
