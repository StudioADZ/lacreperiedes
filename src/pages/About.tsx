import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Utensils,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import storefront from "@/assets/storefront.jpg";

const MAPS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers&travelmode=driving";
const PHONE_LINK = "tel:+33259660176";

const VALUES = [
  {
    icon: Utensils,
    title: "Des galettes et des crêpes au cœur de la carte",
    text: "Une offre salée et sucrée pensée pour les repas, les pauses gourmandes et les envies simples à partager.",
  },
  {
    icon: Heart,
    title: "Un accueil humain",
    text: "Une crêperie indépendante où chaque visite compte, qu’il s’agisse d’un habitué, d’une famille ou d’un client de passage.",
  },
  {
    icon: Users,
    title: "Une adresse locale à Mamers",
    text: "Un lieu installé dans la Galerie des Halles, au cœur de la ville, pour déjeuner, dîner ou faire une pause.",
  },
];

const About = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section
          className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated"
          aria-labelledby="about-title"
        >
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10" aria-hidden="true" />

          <div className="relative text-center">
            <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 border-white/25 bg-white shadow-warm">
              <img
                src={logo}
                alt="Logo de La Crêperie des Saveurs"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              <Sparkles className="h-3.5 w-3.5 text-butter" aria-hidden="true" />
              Notre histoire
            </p>

            <h1 id="about-title" className="font-display text-3xl font-black leading-tight">
              Une crêperie indépendante au cœur de Mamers
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/82">
              La Crêperie des Saveurs est un lieu simple et convivial, consacré aux galettes, aux crêpes et aux moments partagés.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-2">
              <HeroStat icon={Utensils} label="Spécialités" value="Galettes & crêpes" />
              <HeroStat icon={MapPin} label="Ville" value="Mamers" />
              <HeroStat icon={Clock} label="Horaires" value="12h–22h" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-caramel/15 bg-white/75 shadow-warm">
          <img
            src={storefront}
            alt="Devanture de La Crêperie des Saveurs dans la Galerie des Halles à Mamers"
            width={640}
            height={320}
            loading="lazy"
            decoding="async"
            className="h-52 w-full object-cover"
          />
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Le projet</p>
            <h2 className="mt-1 font-display text-2xl font-black text-espresso">
              Une adresse pensée pour bien manger et se retrouver
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                La Crêperie des Saveurs est née de l’envie de créer à Mamers une adresse accessible, chaleureuse et ancrée dans la vie locale.
              </p>
              <p>
                La carte met en avant les spécialités de la crêperie, avec des recettes salées et sucrées adaptées au déjeuner, au dîner ou à une pause gourmande.
              </p>
              <p>
                Ici, l’objectif est simple : accueillir chaque client avec attention et offrir un moment agréable, que l’on vienne seul, en famille ou entre amis.
              </p>
            </div>
          </div>
        </section>

        <section className="card-warm space-y-4" aria-labelledby="identity-title">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Notre identité</p>
            <h2 id="identity-title" className="mt-1 font-display text-xl font-black text-espresso">
              Ce que vous trouverez ici
            </h2>
          </div>

          <div className="space-y-3">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className="rounded-3xl border border-border/55 bg-white/70 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-black text-espresso">{value.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-4" aria-labelledby="practical-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Informations pratiques</p>
            <h2 id="practical-title" className="mt-1 font-display text-xl font-black text-espresso">
              Nous trouver facilement
            </h2>
          </div>

          <a
            href={MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ouvrir l’itinéraire vers La Crêperie des Saveurs dans Google Maps"
            className="block rounded-3xl border border-border/55 bg-white/70 p-4 transition-colors hover:border-caramel/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-espresso">17 Place Carnot – Galerie des Halles</h3>
                <p className="mt-1 text-sm text-muted-foreground">72600 Mamers</p>
              </div>
            </div>
          </a>

          <div className="rounded-3xl border border-border/55 bg-white/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-espresso">Ouvert tous les jours</h3>
                  <p className="text-sm text-muted-foreground">Service continu · 7 jours sur 7</p>
                </div>
              </div>
              <p className="whitespace-nowrap text-sm font-black text-caramel">12h00–22h00</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-white via-butter/30 to-caramel/10 p-5 shadow-warm">
          <div className="text-center">
            <Star className="mx-auto h-7 w-7 fill-caramel text-caramel" aria-hidden="true" />
            <h2 className="mt-3 font-display text-xl font-black text-espresso">
              Le plaisir des galettes, des crêpes et des moments partagés.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Découvrez la carte ou préparez votre prochaine visite.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="h-13 rounded-2xl font-black">
              <Link to="/carte">
                Voir la carte
                <Utensils className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="h-13 rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">
              <Link to="/reserver">
                Réserver une table
                <Calendar className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <Button asChild variant="ghost" className="mt-3 h-12 w-full rounded-2xl font-black text-espresso">
            <a href={PHONE_LINK}>
              <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
              Appeler le 02 59 66 01 76
            </a>
          </Button>
        </section>
      </div>
    </main>
  );
};

const HeroStat = ({ icon: Icon, label, value }: { icon: typeof Utensils; label: string; value: string }) => (
  <div className="min-w-0 rounded-2xl bg-white/12 p-3 text-center">
    <Icon className="mx-auto mb-1 h-5 w-5 text-butter" aria-hidden="true" />
    <p className="text-[9px] uppercase tracking-wide text-white/65">{label}</p>
    <p className="truncate text-xs font-bold">{value}</p>
  </div>
);

export default About;
