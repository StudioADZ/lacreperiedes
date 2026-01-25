import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import storefront from "@/assets/storefront.jpg";
import logo from "@/assets/logo.png";
import SocialFooter from "@/components/SocialFooter";
import GoogleMap from "@/components/home/GoogleMap";
import BookingCTA from "@/components/home/BookingCTA";
import SocialWall from "@/components/home/SocialWall";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[hsl(35_45%_92%)] via-[hsl(40_40%_94%)] to-[hsl(42_50%_96%)]">
      <style>{`
        /* ===== Glow border animé (palette logo) ===== */
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

        /* ===== CTA dégradé animé (pour les 2 CTA colorés) ===== */
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

        /* ===== Cards glow (utilisé sous le hero + CTA "Découvrir la carte") ===== */
        .glow-card {
          position: relative;
          border-radius: 1rem; /* matches rounded-2xl */
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
          opacity: 0.85;
          z-index: -2;
        }
        .glow-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          z-index: -1;
        }
        .glow-card-shadow {
          box-shadow:
            0 12px 30px rgba(0,0,0,0.12),
            0 0 0 1px rgba(255,255,255,0.25),
            0 18px 55px rgba(212,160,83,0.20);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .glow-card:hover.glow-card-shadow {
          transform: translateY(-2px);
          box-shadow:
            0 18px 46px rgba(0,0,0,0.14),
            0 0 0 1px rgba(255,255,255,0.32),
            0 26px 80px rgba(212,160,83,0.28);
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
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.16));
        }
      `}</style>

      {/* HERO — VERSION ORIGINALE (on ne touche pas) */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={storefront}
            alt="La Crêperie des Saveurs"
            className="w-full h-full object-cover scale-110 blur-[1.5px]"
          />
          <div className="absolute inset-0 bg-espresso/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-caramel/25 via-transparent to-ivory/10" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>

        <div className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
          {/* Logo */}
          <div className="relative mb-6">
            <div
              className="absolute -inset-6 rounded-full blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle, hsl(38 70% 55% / 0.55) 0%, transparent 70%)",
              }}
            />
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[5px] border-ivory/40 shadow-elevated">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-white leading-[0.95] drop-shadow-[0_12px_35px_rgba(0,0,0,0.55)]">
            <span className="block text-4xl md:text-5xl lg:text-6xl">
              La Crêperie
            </span>
            <span className="block text-5xl md:text-6xl lg:text-7xl mt-2 bg-gradient-to-r from-[hsl(43_85%_65%)] via-[hsl(38_70%_55%)] to-[hsl(20_75%_55%)] bg-clip-text text-transparent">
              des Saveurs
            </span>
          </h1>

          <p className="mt-5 text-lg md:text-xl text-white/95 font-serif max-w-md">
            Crêpes & Galettes artisanales à Mamers
          </p>

          {/* CTA (garde la même structure, mais on remet l'animation) */}
          <div className="mt-8 w-full max-w-xl flex flex-col gap-4">
            <Link to="/quiz">
              <Button
                className="w-full h-14 md:h-16 text-lg md:text-xl rounded-2xl font-semibold text-white cta-anim cta-glow"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, hsl(43 85% 65%), hsl(38 70% 55%), hsl(20 75% 55%), hsl(43 85% 65%))",
                }}
              >
                Jouez au Quiz <ArrowRight className="ml-2" />
              </Button>
            </Link>

            <a
              href="https://calendar.app.google/hjhLsTjEpA5dyrEy9"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                className="w-full h-14 md:h-16 text-lg md:text-xl rounded-2xl font-semibold text-white cta-anim cta-glow"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, hsl(35 60% 45%), hsl(28 55% 40%), hsl(20 65% 52%), hsl(35 60% 45%))",
                }}
              >
                Réserver <ExternalLink className="ml-2" />
              </Button>
            </a>

            {/* ✅ CTA 3 = même animation/bordure/opacité/padding que les 3 cartes */}
            <Link
              to="/carte"
              className="glow-card glow-card-shadow rounded-2xl p-5 flex items-center justify-center transition text-center"
            >
              <h3 className="font-display font-semibold text-lg glow-title">
                Découvrir la carte
              </h3>
            </Link>
          </div>
        </div>
      </section>

      {/* INFO CARDS — glow */}
      <section className="px-4 -mt-10 relative z-20">
        <div className="max-w-lg mx-auto grid gap-4">
          {[
            {
              icon: <MapPin className="w-6 h-6 text-primary" />,
              title: "Nous trouver",
              text: ["17 Place Carnot – Galerie des Halles", "72600 Mamers"],
              href: "https://maps.app.goo.gl/6KdHfHSUs1MbzakLA",
            },
            {
              icon: <Clock className="w-6 h-6 text-accent" />,
              title: "Horaires",
              text: ["Samedi & Dimanche uniquement", "12h00 – 14h00 • 19h00 – 21h00"],
              href: "https://calendar.app.google/nZShjcjWUyTcGLR97",
            },
            {
              icon: <Phone className="w-6 h-6 text-terracotta" />,
              title: "Appelez-nous",
              text: ["02 59 66 01 76"],
              href: "tel:0259660176",
            },
          ].map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="glow-card glow-card-shadow rounded-2xl p-5 flex gap-4 items-start transition"
            >
              <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg glow-title">
                  {item.title}
                </h3>
                {item.text.map((t, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {t}
                  </p>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      <BookingCTA />
      <GoogleMap />
      <SocialWall />

      {/* NOTRE HISTOIRE */}
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Notre Histoire</h2>
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 shadow-warm">
            <img src={logo} alt="Amatekoe" className="w-full h-full object-cover" />
          </div>
          <p className="text-muted-foreground font-serif leading-relaxed">
            Né à Lomé au Togo, arrivé en France en 1997, Amatekoe apporte plus de 12 ans d'expérience
            dans la restauration. Chaque crêpe est préparée avec passion et savoir-faire artisanal,
            pour vous offrir une expérience authentique au cœur de Mamers.
          </p>
        </div>
      </section>

      <SocialFooter />
    </div>
  );
};

export default Index;

/* rebuild */
