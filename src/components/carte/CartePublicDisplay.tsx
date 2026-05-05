import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Salad,
  Snowflake,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

type SectionId = "all" | "formules" | "galettes" | "crepes" | "salades";
type MenuTone = "signature" | "classic" | "sweet" | "fresh";

type MenuItem = {
  name: string;
  description?: string;
  badge?: string;
  price?: string;
  /** Prix utilisé pour classer la carte. */
  sortPrice: number;
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
    subtitle: "Des formules simples, efficaces et gourmandes, avec boissons incluses.",
    icon: Sparkles,
    tone: "signature",
    items: sortItemsByPrice([
      {
        name: "Formule Goûter",
        description: "Idéal pause gourmande · Crêpe gourmande de la semaine + 1 boisson sans alcool.",
        badge: "dès juillet",
        price: "6,90 €",
        sortPrice: 6.9,
      },
      {
        name: "Formule Petite Faim",
        description: "Composez votre galette (2 ingrédients) + boisson sans alcool.",
        badge: "simple, rapide, efficace",
        price: "7,90 €",
        sortPrice: 7.9,
      },
      {
        name: "Formule Salade",
        description: "1 salade + 1 crêpe classique + 1 boisson.",
        badge: "dès juin",
        price: "12,90 €",
        sortPrice: 12.9,
      },
      {
        name: "Formule Classique",
        description: "1 boisson + 1 galette classique + 1 crêpe classique.",
        badge: "Le plus choisi – Le trio parfait",
        price: "14,90 €",
        sortPrice: 14.9,
      },
      {
        name: "Formule Gourmande",
        description: "À découvrir au restaurant · 1 boisson + galette gourmande de la semaine + crêpe gourmande de la semaine + café ou thé.",
        badge: "Menu gourmand de la semaine",
        price: "16,90 €",
        sortPrice: 16.9,
      },
    ]),
  },
  {
    id: "galettes",
    title: "Galettes classiques",
    subtitle: "Les incontournables maison : simples, généreuses et faites minute.",
    icon: Flame,
    tone: "classic",
    items: sortItemsByPrice([
      { name: "Complète", description: "Œuf, emmental, jambon.", price: "8,50 €", sortPrice: 8.5 },
      { name: "Super complète", description: "Œuf, emmental, jambon, champignons, compotée de tomates.", price: "11,90 €", sortPrice: 11.9 },
      { name: "Fromagère", description: "Œuf, emmental, tome, chèvre, compotée de tomates.", price: "11,90 €", sortPrice: 11.9 },
      { name: "Bergère", description: "Tapenade, œuf, chèvre, bacon, compotée de tomates.", price: "12,50 €", sortPrice: 12.5 },
      { name: "Végétarienne", description: "Recette de saison, légumes du moment, fromage selon inspiration.", price: "12,90 €", sortPrice: 12.9 },
      { name: "Bretonne", description: "Pommes de terre, saucisse, confit d’oignons, sauce moutarde, andouille Guémené.", price: "13,90 €", sortPrice: 13.9 },
      {
        name: "Tête du chef",
        description: "Œuf, emmental, jambon, confit d’oignon, bœuf haché, sauce moutarde.",
        badge: "chef",
        price: "15,90 €",
        sortPrice: 15.9,
      },
      {
        name: "Supplément salade",
        description: "À ajouter à votre galette.",
        price: "+1,50 €",
        sortPrice: 99,
      },
    ]),
  },
  {
    id: "crepes",
    title: "Crêpes classiques",
    subtitle: "Une sélection courte, lisible et gourmande : les valeurs sûres maison.",
    icon: Snowflake,
    tone: "sweet",
    items: sortItemsByPrice([
      { name: "Sucre", description: "La simplicité qui fonctionne à tous les coups.", price: "2,50 €", sortPrice: 2.5 },
      { name: "Beurre sucre", description: "Fondante, chaude, incontournable.", price: "3,00 €", sortPrice: 3 },
      { name: "Miel du moment", description: "Douce, naturelle, subtilement sucrée.", price: "3,50 €", sortPrice: 3.5 },
      { name: "Confiture du jour", description: "Selon l’inspiration du moment.", price: "3,50 €", sortPrice: 3.5 },
      { name: "Caramel beurre salé", description: "Onctueux, maison, irrésistible.", price: "4,00 €", sortPrice: 4 },
      { name: "Chocolat maison", description: "Chocolat chaud, fondant et généreux.", price: "4,00 €", sortPrice: 4 },
      { name: "Chocolat banane", description: "Chocolat chaud + banane fraîche.", price: "4,50 €", sortPrice: 4.5 },
      {
        name: "Le plus choisi – Formule Goûter",
        description: "Crêpe gourmande de la semaine + boisson sans alcool.",
        price: "6,90 €",
        sortPrice: 6.9,
      },
      {
        name: "Ajoutez une touche gourmande",
        description: "Chantilly\n1 boule de glace",
        price: "+0,80 €\n+2,00 €",
        sortPrice: 90,
      },
      {
        name: "Formule Classique",
        description: "Le réflexe malin – midi & soir · 1 galette classique + 1 crêpe classique + 1 boisson.",
        price: "14,90 €",
        sortPrice: 14.9,
      },
    ]),
  },
  {
    id: "salades",
    title: "Salades",
    subtitle: "Des assiettes fraîches et complètes pour manger plus léger sans tomber dans la feuille triste.",
    icon: Salad,
    tone: "fresh",
    items: sortItemsByPrice([
      { name: "Salade Fermière", description: "Dés de fromage, dés de jambon, miel, noix.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Gasconne", description: "Gésiers de canard, dés de fromage, pommes de terre, tomates.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Nordique", description: "Saumon fumé, pommes de terre, tomates cerises, dés de fromage.", price: "10,00 €", sortPrice: 10 },
      { name: "Salade Campagnarde", description: "Lardons, œuf, pommes de terre, tomates cerises, dés de fromage, oignons rouges.", price: "12,00 €", sortPrice: 12 },
      {
        name: "Salade du chef",
        description: "Gésiers de canard, tomates cerises, dés de fromage, œuf, avocat.",
        badge: "chef",
        price: "12,00 €",
        sortPrice: 12,
      },
    ]),
  },
];

const FILTERS: { id: SectionId; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "formules", label: "Formules" },
  { id: "galettes", label: "Galettes" },
  { id: "crepes", label: "Crêpes" },
  { id: "salades", label: "Salades" },
];

const TONE_STYLES: Record<MenuTone, string> = {
  signature: "border-caramel/30 bg-gradient-to-br from-caramel/12 via-white/80 to-butter/35",
  classic: "border-terracotta/20 bg-gradient-to-br from-white/85 to-terracotta/8",
  sweet: "border-caramel/20 bg-gradient-to-br from-white/85 to-butter/30",
  fresh: "border-herb/20 bg-gradient-to-br from-white/85 to-herb/8",
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
        if (!element) continue;

        if (element.getBoundingClientRect().top <= checkpoint) {
          current = section.id;
        }
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

    const offset = getHeaderOffset();
    const targetTop = element.getBoundingClientRect().top + window.scrollY - offset;

    isProgrammaticScrollRef.current = true;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 650);
  };

  const handleFilterChange = (filter: SectionId) => {
    setActiveSection(filter);

    if (filter === "all") {
      scrollToElement(menuTopRef.current);
      return;
    }

    scrollToElement(sectionRefs.current[filter]);
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
      <UtensilsCrossed className="h-7 w-7" />
    </div>
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-caramel">Carte maison</p>
    <h2 className="mt-2 font-display text-2xl font-black text-espresso">Formules, galettes, crêpes & salades</h2>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
      Découvrez les recettes maison, avec les formules classées par prix croissant.
    </p>
  </div>
);

const MenuFilters = ({
  activeFilter,
  onChange,
}: {
  activeFilter: SectionId;
  onChange: (filter: SectionId) => void;
}) => {
  const activeButtonRefs = useRef<Record<SectionId, HTMLButtonElement | null>>({
    all: null,
    formules: null,
    galettes: null,
    crepes: null,
    salades: null,
  });
  const activeLabel = FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "Tout";

  useEffect(() => {
    activeButtonRefs.current[activeFilter]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeFilter]);

  return (
    <div className="sticky top-16 z-20 -mx-4 border-y border-border/60 bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Vous consultez</span>
        <span className="rounded-full bg-caramel/12 px-3 py-1 text-xs font-black text-caramel">{activeLabel}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
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
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-caramel text-white shadow-md"
                  : "bg-white/85 text-espresso/80 ring-1 ring-border hover:bg-caramel/10"
              }`}
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

  return (
    <motion.section
      ref={setSectionRef}
      id={section.id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: sectionIndex * 0.05, duration: 0.35 }}
      className={`scroll-mt-32 rounded-[1.75rem] border p-4 shadow-warm ${TONE_STYLES[section.tone]}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-caramel shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-espresso">{section.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {section.items.map((item, itemIndex) => (
          <motion.article
            key={`${section.id}-${item.name}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: itemIndex * 0.035 }}
            className="rounded-2xl border border-caramel/18 bg-white/78 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-black leading-tight text-espresso">{item.name}</h3>
                  {item.badge && (
                    <span className="rounded-full bg-butter/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.11em] text-caramel">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/75">{item.description}</p>}
              </div>
              {item.price && (
                <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-caramel/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Prix</p>
                  <p className="whitespace-pre-line font-display text-xl font-black leading-tight text-caramel">{item.price}</p>
                </div>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
};

export default CartePublicDisplay;
