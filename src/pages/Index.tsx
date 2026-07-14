import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Gift,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import storefront from "@/assets/storefront.jpg";
import logo from "@/assets/logo.png";
import SocialFooter from "@/components/SocialFooter";
import GoogleMap from "@/components/home/GoogleMap";
import BookingCTA from "@/components/home/BookingCTA";
import SocialWall from "@/components/home/SocialWall";

const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=La%20cr%C3%AAperie%20des%20saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers";
const HOURS_LINK = "https://share.google/cW8qE77w5olblnodu";
const PHONE_LINK = "tel:+33259660176";

const FORMULES = [
  {
    name: "Formule Goûter",
    price: "6,90 €",
    desc: "Une crêpe classique ou un dessert, accompagné d’une boisson.",
    note: "La pause douce de l’après-midi",
  },
  {
    name: "Formule Petite Faim",
    price: "7,90 €",
    desc: "Une galette et une boisson pour une pause rapide et gourmande.",
    note: "Simple, rapide, efficace",
  },
  {
    name: "Formule Salade",
    price: "12,90 €",
    desc: "La salade de la semaine accompagnée d’un dessert.",
    note: "Fraîcheur de la semaine",
  },
  {
    name: "Formule Classique",
    price: "14,90 €",
    desc: "Une galette, un dessert et une boisson incluse.",
    note: "La formule complète et généreuse",
  },
];

const INFO_CARDS = [
  {
    icon: MapPin,
    title: "Nous trouver",
    text: ["17 Place Carnot – Galerie des Halles", "72600 Mamers"],
    href: MAPS_LINK,
    external: true,
    action: "Ouvrir l’itinéraire",
  },
  {
    icon: Clock,
    title: "Horaires",
    text: ["Tous les jours", "12h00 – 22h00", "Service continu"],
    href: HOURS_LINK,
    external: true,
    action: "Voir sur Google",
  },
  {
    icon: Phone,
    title: "Appelez-nous",
    text: ["02 59 66 01 76"],
    href: PHONE_LINK,
    external: false,
    action: "Appeler maintenant",
  },
];

const HIGHLIGHTS = [
  {
    icon: UtensilsCrossed,
    title: "Cuisine artisanale",
    text: "Des galettes et crêpes préparées avec soin dans une adresse locale au cœur de Mamers.",
  },
  {
    icon: Trophy,
    title: "Quiz hebdomadaire",
    text: "Jouez, gagnez des récompenses et découvrez de nouveaux avantages à chaque visite.",
  },
  {
    icon: Gift,
    title: "Avantages client",
    text: "Retrouvez vos gains, vos accès privilégiés et les nouveautés de la crêperie.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[hsl(35_45%_92%)] via-[hsl(40_40%_94%)] to-[hsl(42_50%_96%)] pb-24">
      <style>{`
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes textFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaFlow {
          0% { background-position: 0% 50%; transform: translateY(0); }
          50% { background-position: 100% 50%; transform: translateY(-1px); }
          100% { background-position: 0% 50%; transform: translateY(0); }
        }
        .cta-anim {
          background-size: 240% 240%;
          animation: ctaFlow 4.8s ease-in-out infinite;
          will-change: background-position, transform;
        }
        .cta-glow {
          box-shadow: 0 18px 45px rgba(218,165,32,0.22), 0 0 0 1px rgba(255,255,255,0.18);
          transition: box-shadow .25s ease, transform .25s ease, filter .25s ease;
        }
        .cta-glow:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 24px 70px rgba(218,165,32,0.30), 0 0 0 1px rgba(255,255,255,0.22);
        }
        .glow-card {
          position: relative;
          border-radius: 1rem;
          isolation: isolate;
        }
        .glow-card::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(90deg, hsl(43 85% 65%), hsl(38 70% 55%), hsl(20 75% 55%), hsl(43 85% 65%));
          background-size: 260% 260%;
          animation: borderFlow 6.5s ease-in-out infinite;
          opacity: 0.72;
          z-index: -2;
        }
        .glow-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          z-index: -1;
        }
        .glow-card-shadow {
          box-shadow: 0 12px 30px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.25), 0 18px 55px rgba(212,160,83,0.16);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .glow-card:hover.glow-card-shadow {
          transform: translateY(-2px);
          box-shadow: 0 18px 46px rgba(0,0,0,0.13), 0 0 0 1px rgba(255,255,255,0.32), 0 26px 80px rgba(212,160,83,0.22);
        }
        .glow-title {
          background: linear-gradient(90deg, hsl(43 85% 65%), hsl(38 70% 55%), hsl(20 75% 55%), hsl(43 85% 65%));
          background-size: 260% 260%;
          animation: textFlow 7.5s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.12));
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-anim, .glow-card::before, .glow-title { animation: none !important; }
          .cta-glow:hover, .glow-card:hover.glow-card-shadow { transform: none; }
        }
      `}</style>

      <section className="relative min-h-[88svh] overflow-hidden" aria-labelledby="home-title">
        <div className="absolute inset-0">
          <img
            src={storefront}
            alt="Devanture de La Crêperie des Saveurs à Mamers"
            className="h-full w-full scale-105 object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-espresso/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-caramel/20 via-transparent to-black/25" />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.62) 100%)" }}
          />
        </div>

        <div className="relative mx-auto flex min-h-[88svh] max-w-3xl flex-col items-center justify-center px-5 pb-16 pt-24 text-center sm:px-6">
          <div className="relative mb-5">
            <div
              className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(38 70% 55% / 0.55) 0%, transparent 70%)" }}
            />
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-[5px] border-ivory/40 shadow-elevated md:h-40 md:w-40">
              <img
                src={logo}
                alt="Logo La Crêperie des Saveurs"
                className="h-full w-full object-cover"
                width={160}
                height={160}
              />
            </div>
          </div>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur-md">
            <Star className="h-3.5 w-3.5 text-[hsl(43_85%_65%)]" aria-hidden="true" />
            Ouvert tous les jours · 12h–22h
          </p>

          <h1 id="home-title" className="font-display font-bold leading-[0.95] text-white drop-shadow-[0_12px_35px_rgba(0,0,0,0.55)]">
            <span className="block text-4xl md:text-5xl lg:text-6xl">La Crêperie</span>
            <span className="mt-2 block bg-gradient-to-r from-[hsl(43_85%_65%)] via-[hsl(38_70%_55%)] to-[hsl(20_75%_55%)] bg-clip-text text-5xl text-transparent md:text-6xl lg:text-7xl">
              des Saveurs
            </span>
          </h1>

          <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-white/95 md:text-xl">
            Le plaisir des galettes, des crêpes et des moments partagés, au cœur de Mamers.
          </p>

          <div className="mt-8 grid w-full max-w-md gap-3 sm:max-w-lg">
            <Link to="/reserver" className="mx-auto block w-full max-w-md">
              <Button
                className="cta-anim cta-glow h-14 w-full rounded-2xl px-5 text-base font-semibold text-white md:text-lg"
                style={{ backgroundImage: "linear-gradient(90deg, hsl(43 85% 55%), hsl(35 68% 48%), hsl(20 72% 48%), hsl(43 85% 55%))" }}
              >
                Réserver une table
                <Calendar className="ml-2 h-5 w-5 shrink-0" aria-hidden="true" />
              </Button>
            </Link>

            <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
              <Link to="/carte" className="glow-card glow-card-shadow flex min-h-14 items-center justify-center rounded-2xl px-4 text-center">
                <span className="font-display text-base font-semibold glow-title md:text-lg">Voir la carte</span>
              </Link>

              <Link to="/quiz" className="block min-w-0">
                <Button variant="outline" className="h-14 w-full rounded-2xl border-white/30 bg-white/90 px-3 text-sm font-semibold text-espresso shadow-lg hover:bg-white md:text-base">
                  Jouer au quiz
                  <Sparkles className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            <p className="text-xs font-medium text-white/80">Réservation en quelques instants · confirmation immédiate selon disponibilité</p>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-10 px-4" aria-label="Informations pratiques">
        <div className="mx-auto grid max-w-lg gap-4">
          {INFO_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                className="glow-card glow-card-shadow flex items-start gap-4 rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`${item.title} — ${item.action}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/75">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold glow-title">{item.title}</h2>
                  {item.text.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                  <p className="mt-2 text-xs font-semibold text-primary">{item.action}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              </a>
            );
          })}
        </div>
      </section>

      <section className="px-4 pt-12" aria-labelledby="experience-title">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">Expérience client</p>
            <h2 id="experience-title" className="mt-1 inline-block font-display text-2xl font-bold glow-title">Plus qu’une crêperie</h2>
          </div>

          <div className="grid gap-3">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-caramel/15 bg-white/60 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pt-12" aria-labelledby="formules-title">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">À table</p>
            <h2 id="formules-title" className="inline-block font-display text-2xl font-bold glow-title">Nos formules</h2>
            <p className="mt-1 text-sm text-muted-foreground">Des formules simples, lisibles et pensées pour chaque moment de la journée.</p>
          </div>

          <div className="mb-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-r from-primary/15 via-[hsl(43_85%_65%/0.22)] to-primary/10 px-4 py-4 text-center shadow-[0_16px_45px_rgba(218,165,32,0.18)]">
            <p className="font-display text-xl font-black leading-tight text-espresso">Service continu de 12h à 22h</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Disponibilités et composition détaillée à vérifier sur la carte.</p>
          </div>

          <div className="grid gap-3">
            {FORMULES.map((formule) => (
              <div key={formule.name} className="glow-card glow-card-shadow rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-semibold text-foreground">{formule.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-caramel/80">{formule.note}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{formule.desc}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-caramel/20 bg-white/75 px-3 py-2 text-right shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Prix</p>
                    <p className="whitespace-nowrap font-display text-lg font-bold text-primary">{formule.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/carte" className="glow-card glow-card-shadow mt-5 block rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/75">
                <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold glow-title">Voir la carte complète</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Galettes, crêpes, boissons, desserts et nouveautés</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      <BookingCTA />
      <GoogleMap />
      <SocialWall />
      <SocialFooter />
    </div>
  );
};

export default Index;
