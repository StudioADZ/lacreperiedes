import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import storefront from "@/assets/storefront.jpg";
import logo from "@/assets/logo.png";
import crepes from "@/assets/crepes.jpg";
import SocialFooter from "@/components/SocialFooter";
import GoogleMap from "@/components/home/GoogleMap";
import BookingCTA from "@/components/home/BookingCTA";
import SocialWall from "@/components/home/SocialWall";

const Index = () => {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-[hsl(35_45%_92%)] via-[hsl(40_40%_94%)] to-[hsl(42_50%_96%)]">
      {/* HERO */}
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

          {/* CTA */}
          <div className="mt-8 w-full max-w-xl flex flex-col gap-4">
            <Link to="/quiz">
              <Button className="w-full h-14 md:h-16 text-lg md:text-xl rounded-2xl font-semibold bg-gradient-to-r from-[hsl(38_70%_55%)] to-[hsl(20_70%_52%)] text-white shadow-[0_18px_45px_rgba(218,165,32,0.25)]">
                Jouez au Quiz <ArrowRight className="ml-2" />
              </Button>
            </Link>

            <a
              href="https://calendar.app.google/hjhLsTjEpA5dyrEy9"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full h-14 md:h-16 text-lg md:text-xl rounded-2xl font-semibold bg-gradient-to-r from-[hsl(35_60%_45%)] to-[hsl(28_55%_40%)] text-white shadow-lg">
                Réserver <ExternalLink className="ml-2" />
              </Button>
            </a>

            <Link to="/carte">
              <Button className="w-full h-14 md:h-16 text-lg md:text-xl rounded-2xl font-semibold bg-white/90 backdrop-blur text-espresso shadow-lg">
                Découvrir la carte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* INFO CARDS — REMONTÉES + TRANSPARENCE */}
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
              className="
                backdrop-blur-xl bg-white/65
                border border-white/40
                rounded-2xl p-5
                shadow-[0_12px_30px_rgba(0,0,0,0.12)]
                flex gap-4 items-start
                hover:bg-white/75 transition
              "
            >
              <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{item.title}</h3>
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
      <SocialFooter />
    </div>
  );
};

export default Index;
