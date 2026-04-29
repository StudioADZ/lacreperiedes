import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  Gift,
  Lock,
  MapPin,
  Phone,
  ShoppingBag,
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
const PHONE_LINK = "tel:+33259660176";

const FORMULES = [
  {
    name: "Formule Classique",
    price: "14,90 €",
    desc: "1 galette classique + 1 crêpe classique",
    badge: null as string | null,
  },
  {
    name: "Formule Gourmande",
    price: "17,90 €",
    desc: "Galette & crêpe gourmandes de la semaine",
    badge: "Menu secret",
  },
  {
    name: "Formule Mineur",
    price: "8 €",
    desc: "1 galette d'inspiration hebdo + 1 crêpe sucre",
    badge: null,
  },
  {
    name: "Formule Mineur+",
    price: "9 €",
    desc: "Galette hebdo + crêpe sucre/Nutella + boisson",
    badge: null,
  },
];

const INFO_CARDS = [
  {
    icon: MapPin,
    title: "Nous trouver",
    text: ["17 Place Carnot – Galerie des Halles", "72600 Mamers"],
    href: MAPS_LINK,
    external: true,
  },
  {
    icon: Clock,
    title: "Horaires",
    text: ["Samedi & dimanche", "12h00 – 14h00 • 19h00 – 21h00"],
    href: "/reserver",
    external: false,
  },
  {
    icon: Phone,
    title: "Appelez-nous",
    text: ["02 59 66 01 76"],
    href: PHONE_LINK,
    external: false,
  },
];

const HIGHLIGHTS = [
  {
    icon: Trophy,
    title: "Quiz hebdomadaire",
    text: "10 questions, 30 secondes par question, et des récompenses selon votre score.",
  },
  {
    icon: Gift,
    title: "Avantages client",
    text: "Compte client, fidélité, historique des gains et accès au menu secret.",
  },
  {
    icon: UtensilsCrossed,
    title: "Cuisine artisanale",
    text: "Crêpes et galettes préparées avec soin, dans l’esprit d’une crêperie locale.",
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
          box-shadow:
            0 18px 45px rgba(218,165,32,0.22),
            0 0 0 1px rgba(255,255,255,0.18);
          transition: box-shadow .25s ease, transform .25s ease, filter .25s ease;
        }
        .cta-glow:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow:
            0 24px 70px rgba(218,165,32,0.30),
            0 0 0 1px rgba(255,255,255,0.22);
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
          background: linear-gradient(90deg,
            hsl(43 85% 65%),
            hsl(38 70% 55%),
            hsl(20 75% 55%),
            hsl(43 85% 65%)
          );
          background-size: 260% 260%;
          animation: borderFlow 6.5s ease-in-out infinite;
          opacity: 0.78;
          z-index: -2;
        }
        .glow-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: rgba(255,255,255,0.66);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          z-index: -1;
        }
        .glow-card-shadow {
          box-shadow:
            0 12px 30px rgba(0,0,0,0.12),
            0 0 0 1px rgba(255,255,255,0.25),
            0 18px 55px rgba(212,160,83,0.18);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .glow-card:hover.glow-card-shadow {
          transform: translateY(-2px);
          box-shadow:
            0 18px 46px rgba(0,0,0,0.14),
            0 0 0 1px rgba(255,255,255,0.32),
            0 26px 80px rgba(212,160,83,0.25);
        }
        .glow-title {
          background: linear-gradient(90deg,
            hsl(43 85% 65%),
            hsl(38 70% 55%),
            hsl(20 75% 55%),
            hsl(43 85% 65%)
          );
          background-size: 260% 260%;
          animation: textFlow 7.5s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.14));
        }
      `}</style>

      <section className="relative min-h-[88svh] overflow-hidden" aria-label="Accueil">
        <div className="absolute inset-0">
          <img
            src={storefront}
            alt="Devanture de La Crêperie des Saveurs à Mamers"
            className="h-full w-full scale-110 object-cover blur-[1.5px]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-espresso/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-caramel/25 via-transparent to-ivory/15" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.58) 100%)",
            }}
          />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center justify-center px-5 pb-16 pt-24 text-center sm:px-6">
          <div className="relative mb-6">
            <div
              className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(38 70% 55% / 0.55) 0%, transparent 70%)",
              }}
            />
            <div className="relative h-36 w-36 overflow-hidden rounded-full border-[5px] border-ivory/40 shadow-elevated md:h-44 md:w-44">
              <img
                src={logo}
                alt="Logo La Crêperie des Saveurs"
                className="h-full w-full object-cover"
                width={176}
                height={176}
              />
            </div>
          </div>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
            <Star className="h-3.5 w-3.5 text-[hsl(43_85%_65%)]" />
            Crêperie artisanale à Mamers
          </p>

          <h1 className="font-display font-bold leading-[0.95] text-white drop-shadow-[0_12px_35px_rgba(0,0,0,0.55)]">
            <span className="block text-4xl md:text-5xl lg:text-6xl">La Crêperie</span>
            <span className="mt-2 block bg-gradient-to-r from-[hsl(43_85%_65%)] via-[hsl(38_70%_55%)] to-[hsl(20_75%_55%)] bg-clip-text text-5xl text-transparent md:text-6xl lg:text-7xl">
              des Saveurs
            </span>
          </h1>

          <p className="mt-5 max-w-xl font-serif text-lg text-white/95 md:text-xl">
            Crêpes, galettes, quiz gourmand et récompenses client dans une adresse locale au cœur de Mamers.
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-4">
            <Link to="/quiz" className="block">
              <Button
                className="cta-anim cta-glow h-14 w-full rounded-2xl text-base font-semibold text-white md:h-16 md:text-xl"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, hsl(43 85% 65%), hsl(38 70% 55%), hsl(20 75% 55%), hsl(43 85% 65%))",
                }}
              >
                Jouer au quiz & débloquer des avantages
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link to="/reserver" className="block">
                <Button
                  className="cta-anim cta-glow h-14 w-full rounded-2xl text-base font-semibold text-white"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, hsl(35 60% 45%), hsl(28 55% 40%), hsl(20 65% 52%), hsl(35 60% 45%))",
                  }}
                >
                  Réserver
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link
                to="/carte"
                className="glow-card glow-card-shadow flex min-h-14 items-center justify-center rounded-2xl px-5 text-center"
              >
                <span className="font-display text-lg font-semibold glow-title">Voir la carte</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-10 px-4" aria-label="Informations pratiques">
        <div className="mx-auto grid max-w-lg gap-4">
          {INFO_CARDS.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold glow-title">{item.title}</h2>
                  {item.text.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </>
            );

            return item.external ? (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="glow-card glow-card-shadow flex items-start gap-4 rounded-2xl p-5"
              >
                {content}
              </a>
            ) : (
              <a
                key={item.title}
                href={item.href}
                className="glow-card glow-card-shadow flex items-start gap-4 rounded-2xl p-5"
              >
                {content}
              </a>
            );
          })}
        </div>
      </section>

      <section className="px-4 pt-12" aria-label="Pourquoi venir">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">Expérience client</p>
            <h2 className="mt-1 inline-block font-display text-2xl font-bold glow-title">
              Plus qu’une crêperie
            </h2>
          </div>

          <div className="grid gap-3">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-caramel/15 bg-white/55 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caramel/10 text-caramel">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pt-12" aria-label="Formules">
        <div className="mx-auto max-w-lg">
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">À table</p>
            <h2 className="inline-block font-display text-2xl font-bold glow-title">Nos Formules</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pensées pour tous, du gourmet au plus jeune
            </p>
          </div>

          <div className="grid gap-3">
            {FORMULES.map((formule) => (
              <div
                key={formule.name}
                className="glow-card glow-card-shadow flex items-center gap-4 rounded-2xl p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold">{formule.name}</h3>
                    {formule.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        <Lock className="h-3 w-3" />
                        {formule.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formule.desc}</p>
                </div>
                <div className="whitespace-nowrap font-display text-lg font-bold text-primary">
                  {formule.price}
                </div>
              </div>
            ))}
          </div>

          <Link to="/carte" className="glow-card glow-card-shadow mt-5 block rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold glow-title">Commander à emporter</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choisissez votre formule, on prépare pour vous
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
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
