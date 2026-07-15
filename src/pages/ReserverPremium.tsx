import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/home/GoogleMap";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const PHONE_NUMBER = "0259660176";
const MAPS_DIRECTIONS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers&travelmode=driving";

const ReserverPremium = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-28 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated sm:p-7">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]">
              <Sparkles className="h-3.5 w-3.5 text-butter" aria-hidden="true" />
              Réservation en ligne
            </div>

            <h1 className="mt-5 font-display text-3xl font-black leading-tight sm:text-4xl">
              Votre table en quelques clics
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Choisissez directement votre date, votre horaire et le nombre de personnes dans notre agenda de réservation.
            </p>

            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <Button className="h-14 w-full rounded-2xl bg-butter text-base font-black text-espresso hover:bg-butter/90">
                Voir les disponibilités
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </a>

            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              La réservation est confirmée uniquement après validation dans Google Agenda.
            </p>
          </div>
        </section>

        <section className="card-warm space-y-4" aria-labelledby="booking-process-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Comment ça marche</p>
            <h2 id="booking-process-title" className="mt-1 font-display text-xl font-black text-espresso">
              Une réservation claire, sans mauvaise surprise
            </h2>
          </div>

          <div className="grid gap-3">
            <ProcessStep
              icon={CalendarCheck}
              number="1"
              title="Ouvrez l’agenda"
              text="Consultez les créneaux réellement proposés par la crêperie."
            />
            <ProcessStep
              icon={Clock3}
              number="2"
              title="Choisissez votre créneau"
              text="Sélectionnez la date, l’heure et le nombre de personnes."
            />
            <ProcessStep
              icon={CheckCircle2}
              number="3"
              title="Recevez la confirmation"
              text="Votre réservation est enregistrée une fois le formulaire Google validé."
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-white via-butter/30 to-caramel/10 p-5 shadow-warm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Demande particulière</p>
              <h2 className="mt-1 font-display text-xl font-black text-espresso">Groupe, poussette ou besoin spécifique ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pour une grande table ou une demande spéciale, appelez-nous directement afin que nous puissions vous répondre immédiatement.
              </p>
            </div>
          </div>

          <a href={`tel:${PHONE_NUMBER}`} className="mt-5 block">
            <Button variant="outline" className="h-13 w-full rounded-2xl font-black">
              <Phone className="mr-2 h-5 w-5" aria-hidden="true" />
              Appeler le 02 59 66 01 76
            </Button>
          </a>
        </section>

        <section className="card-warm">
          <h2 className="font-display text-xl font-black text-espresso">Informations pratiques</h2>
          <div className="mt-4 grid gap-3">
            <InfoRow icon={Clock3} title="Horaires" text="12h00–22h00 en continu · 7 jours sur 7" />
            <InfoRow icon={MapPin} title="Adresse" text="17 Place Carnot – Galerie des Halles, 72600 Mamers" />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/50">
            <GoogleMap />
          </div>

          <a href={MAPS_DIRECTIONS_LINK} target="_blank" rel="noopener noreferrer" className="mt-4 block">
            <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">
              Ouvrir l’itinéraire
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </a>
        </section>

        <div className="sticky bottom-4 z-20 rounded-2xl border border-caramel/20 bg-background/95 p-2 shadow-elevated backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="h-13 w-full rounded-xl text-base font-black">
              Réserver maintenant
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

const ProcessStep = ({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof CalendarCheck;
  number: string;
  title: string;
  text: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/60 p-4">
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-espresso text-[10px] font-black text-white">
        {number}
      </span>
    </div>
    <div>
      <h3 className="font-display font-black text-espresso">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, title, text }: { icon: typeof Clock3; title: string; text: string }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/55 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
    <div>
      <p className="font-display font-black text-espresso">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  </div>
);

export default ReserverPremium;
