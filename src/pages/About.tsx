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

const MAPS_LINK = "https://maps.app.goo.gl/ShXSrr3XBsQTEYZ87?g_st=ac";
const PHONE_LINK = "tel:0259660176";

const VALUES = [
  {
    icon: Utensils,
    title: "Une carte centrée sur les galettes et les crêpes",
    text: "Une offre pensée autour des spécialités de la crêperie, avec des recettes salées et sucrées servies sur place.",
  },
  {
    icon: Heart,
    title: "Un accueil direct et humain",
    text: "Une adresse indépendante où la relation avec les habitués, les familles et les visiteurs compte autant que le repas.",
  },
  {
    icon: Users,
    title: "Une crêperie locale à Mamers",
    text: "Un lieu installé au cœur de la ville, dans la Galerie des Halles, pour déjeuner, dîner ou faire une pause gourmande.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />

          <div className="relative text-center">
            <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 border-white/25 bg-white shadow-warm">
              <img src={logo} alt="Logo La Crêperie des Saveurs" className="h-full w-full object-cover" />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              À propos
            </div>

            <h1 className="font-display text-3xl font-black leading-tight">La Crêperie des Saveurs</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Une crêperie indépendante à Mamers, ouverte à celles et ceux qui veulent partager un repas simple, gourmand et convivial.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-2 backdrop-blur">
              <HeroStat icon={Utensils} label="Spécialités" value="Galettes & crêpes" />
              <HeroStat icon={MapPin} label="Ville" value="Mamers" />
              <HeroStat icon={Clock} label="Ouverture" value="12h–22h" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-caramel/15 bg-white/70 shadow-warm backdrop-blur">
          <img src={storefront} alt="Devanture de La Crêperie des Saveurs à Mamers" className="h-48 w-full object-cover" />
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Notre histoire</p>
            <h2 className="mt-1 font-display text-2xl font-black text-espresso">Un projet construit autour de la restauration et de l’accueil</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Amatekoe, fondateur de La Crêperie des Saveurs, arrive en France en 1997 avec l’envie de construire un projet professionnel autour de la cuisine, du partage et du service.
              </p>
              <p>
                Après plus de douze années d’expérience dans la restauration, il ouvre cette crêperie à Mamers pour proposer une adresse accessible, conviviale et ancrée dans la vie locale.
              </p>
              <p>
                La carte s’adresse autant aux habitués qu’aux familles, aux visiteurs de passage et à toutes les personnes qui souhaitent profiter d’une galette, d’une crêpe ou d’un moment tranquille en centre-ville.
              </p>
            </div>
          </div>
        </section>

        <section className="card-warm space-y-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Notre identité</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Ce que vous trouverez ici</h2>
          </div>

          <div className="space-y-3">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="rounded-3xl border border-border/55 bg-white/70 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-black text-espresso">{value.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Informations pratiques</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Nous trouver et venir au bon moment</h2>
          </div>

          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="block rounded-3xl border border-border/55 bg-white/70 p-4 transition hover:border-caramel/30 hover:bg-white">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-espresso">17 Place Carnot – Galerie des Halles</h3>
                <p className="mt-1 text-sm text-muted-foreground">72600 Mamers</p>
              </div>
            </div>
          </a>

          <div className="rounded-3xl border border-border/55 bg-white/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                  <Clock className="h-5 w-5" />
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
            <Star className="mx-auto h-7 w-7 fill-caramel text-caramel" />
            <h2 className="mt-3 font-display text-xl font-black text-espresso">Le plaisir des galettes, des crêpes et des moments partagés.</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Consultez la carte ou réservez votre table directement depuis l’application.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/carte" className="block">
              <Button variant="outline" className="h-13 w-full rounded-2xl font-black">
                Voir la carte
                <Utensils className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/reserver" className="block">
              <Button className="h-13 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">
                Réserver
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <a href={PHONE_LINK} className="mt-3 block">
            <Button variant="ghost" className="h-12 w-full rounded-2xl font-black text-espresso">
              <Phone className="mr-2 h-4 w-4" />
              Appeler le 02 59 66 01 76
            </Button>
          </a>
        </section>
      </div>
    </div>
  );
};

const HeroStat = ({ icon: Icon, label, value }: { icon: typeof Utensils; label: string; value: string }) => (
  <div className="min-w-0 rounded-2xl bg-white/12 p-3 text-center">
    <Icon className="mx-auto mb-1 h-5 w-5 text-butter" />
    <p className="text-[9px] uppercase tracking-wide text-white/65">{label}</p>
    <p className="truncate text-xs font-bold">{value}</p>
  </div>
);

export default About;
