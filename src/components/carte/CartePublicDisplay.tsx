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
  /** Prix utilisé pour classer la carte. Seules les formules affichent leur prix. */
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
    subtitle: "Des formules pensées pour choisir vite, bien manger et profiter d’un vrai moment crêperie.",
    icon: Sparkles,
    tone: "signature",
    items: sortItemsByPrice([
      {
        name: "Formule Goûter",
        description: "Crêpe gourmande de la semaine + 1 boisson sans alcool.",
        badge: "dès juillet",
        price: "6,90 €",
        sortPrice: 6.9,
      },
      {
        name: "Formule Petite Faim",
        description: "1 galette complète ou fromagère + 1 boisson sans alcool.",
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
        price: "14,90 €",
        sortPrice: 14.9,
      },
      {
        name: "Formule Gourmande",
        description: "1 boisson + galette gourmande de la semaine + crêpe gourmande de la semaine + café ou thé.",
        badge: "menu secret",
        price: "17,90 €",
        sortPrice: 17.9,
      },
    ]),
  },
  {
    id: "galettes",
    title: "Galettes classiques",
    subtitle: "Les incontournables maison : simples, généreuses et prêtes à rassurer les grands appétits.",
    icon: Flame,
    tone: "classic",
    items: sortItemsByPrice([
      { name: "Complète", description: "Œuf, emmental, jambon.", sortPrice: 7 },
      { name: "Bergère", description: "Tapenade, œuf, chèvre, bacon, compotée de tomates.", sortPrice: 10.5 },
      { name: "Fromagère", description: "Œuf, emmental, tome, chèvre, compotée de tomates.", sortPrice: 10.5 },
      { name: "Super complète", description: "Œuf, emmental, jambon, champignons, compotée de tomates.", sortPrice: 10.5 },
      { name: "Bretonne", description: "Pommes de terre, saucisse, confit d’oignons, sauce moutarde, andouille Guémené.", sortPrice: 12.5 },
      {
        name: "Tête du chef",
        description: "Œuf, emmental, jambon, confit d’oignon, bœuf haché, sauce moutarde.",
        badge: "chef",
        sortPrice: 14,
      },
    ]),
  },
  {
    id: "crepes",
    title: "Crêpes classiques",
    subtitle: "Les douceurs simples et efficaces : le genre de crêpe qui ne négocie pas avec la gourmandise.",
    icon: Snowflake,
    tone: "sweet",
    items: sortItemsByPrice([
      { name: "Beurre", sortPrice: 2 },
      { name: "Sucre", sortPrice: 2 },
      { name: "Beurre sucre", sortPrice: 2.5 },
      { name: "Jus citron", sortPrice: 2.5 },
      { name: "Amande grillée", sortPrice: 3 },
      { name: "Confiture du jour", sortPrice: 3 },
      { name: "Miel", sortPrice: 3 },
      { name: "Amande jus citron", sortPrice: 3.5 },
      { name: "Caramel beurre salé", sortPrice: 3.5 },
      { name: "Chocolat maison", sortPrice: 3.5 },
      { name: "Caramel beurre salé amande", sortPrice: 4 },
      { name: "Chocaramel", sortPrice: 4 },
      { name: "Chocolat maison amande", sortPrice: 4 },
      {
        name: "Crêpe 3 ingrédients au choix",
        description: "Beurre, sucre, amandes grillées, jus citron, miel, chocolat, gelée de cidre + 1 boule de glace + chantilly.",
        badge: "sur-mesure",
        sortPrice: 5,
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
      { name: "Salade Fermière", description: "Dés de fromage, dés de jambon, miel, noix.", sortPrice: 10 },
      { name: "Salade Gasconne", description: "Gésiers de canard, dés de fromage, pommes de terre, tomates.", sortPrice: 10 },
      { name: "Salade Nordique", description: "Saumon fumé, pommes de terre, tomates cerises, dés de fromage.", sortPrice: 10 },
      { name: "Salade Campagnarde", description: "Lardons, œuf, pommes de terre, tomates cerises, dés de fromage, oignons rouges.", sortPrice: 12 },
      {
        name: "Salade du chef",
        description: "Gésiers de canard, tomates cerises, dés de fromage, œuf, avocat.",
        badge: "chef",
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
              aria-current={active ? "true" : undefined}
              className={`min-w-fit rounded-full border px-4 py-2 text-sm font-bold transition ${
                active
                  ? "border-caramel bg-caramel text-white shadow-sm"
                  : "border-border/70 bg-white/70 text-muted-foreground hover:border-caramel/40 hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MenuSectionCard = ({
  section,
  sectionIndex,
  setSectionRef,
}: {
  section: MenuSection;
  sectionIndex: number;
  setSectionRef: (element: HTMLElement | null) => void;
}) => {
  const Icon = section.icon;

  return (
    <motion.section
      ref={setSectionRef}
      id={section.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.05 }}
      className={`scroll-mt-44 rounded-[2rem] border p-4 shadow-warm ${TONE_STYLES[section.tone]}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-caramel shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-black leading-tight text-espresso">{section.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {section.items.map((item, itemIndex) => (
          <MenuItemCard key={`${section.id}-${item.name}`} item={item} itemIndex={itemIndex} />
        ))}
      </div>
    </motion.section>
  );
};

const MenuItemCard = ({ item, itemIndex }: { item: MenuItem; itemIndex: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(itemIndex * 0.035, 0.22) }}
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

      {item.price && (
        <div className="shrink-0 rounded-2xl border border-caramel/20 bg-white/80 px-3 py-2 text-right shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Prix</p>
          <p className="whitespace-nowrap font-display text-lg font-black text-caramel">{item.price}</p>
        </div>
      )}
    </div>
  </motion.article>
);

export default CartePublicDisplay;
