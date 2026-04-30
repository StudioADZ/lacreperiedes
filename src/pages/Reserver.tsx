import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/home/GoogleMap";
import GoogleReviewCTA from "@/components/common/GoogleReviewCTA";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const WHATSAPP_NUMBER = "33781246918";
const PHONE_DISPLAY = "02 59 66 01 76";
const WHATSAPP_DISPLAY = "07 81 24 69 18";
const MAPS_LINK = "https://maps.app.goo.gl/ShXSrr3XBsQTEYZ87?g_st=ac";

const OPENING_HOURS = [
  { label: "Midi", days: "Lundi au dimanche", hours: "12h00 – 14h00" },
  { label: "Soir", days: "Vendredi & samedi", hours: "19h00 – 22h00" },
];

const PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

const WhatsAppIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const formatDateLong = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

const formatDateShort = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildUpcomingDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
};

const getAvailablePeriods = (date: Date) => {
  const day = date.getDay();
  const isFriday = day === 5;
  const isSaturday = day === 6;

  return [
    { id: "midi", label: "Midi", time: "12h00 – 14h00", available: true },
    { id: "soir", label: "Soir", time: "19h00 – 22h00", available: isFriday || isSaturday },
  ];
};

const buildWhatsAppText = (date: Date, periodLabel: string, people: number) =>
  `Bonjour ! Je souhaite réserver une table à La Crêperie des Saveurs pour ${people} personne${people > 1 ? "s" : ""}, le ${formatDateLong(date)} (${periodLabel}).`;

const Reserver = () => {
  const days = useMemo(() => buildUpcomingDays(), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedPeriod, setSelectedPeriod] = useState("midi");
  const [people, setPeople] = useState(2);
  const [showGoogleBooking, setShowGoogleBooking] = useState(false);

  const periods = useMemo(() => getAvailablePeriods(selectedDate), [selectedDate]);
  const selectedPeriodData = periods.find((period) => period.id === selectedPeriod && period.available) ?? periods[0];
  const selectedDateISO = toISODate(selectedDate);
  const googleBookingUrl = `${BOOKING_LINK}?date=${selectedDateISO}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppText(selectedDate, selectedPeriodData.label, people),
  )}`;

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const nextPeriods = getAvailablePeriods(date);
    const stillAvailable = nextPeriods.some((period) => period.id === selectedPeriod && period.available);
    if (!stillAvailable) setSelectedPeriod("midi");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-butter" />
            Réservation premium
          </div>
          <h1 className="font-display text-3xl font-black leading-tight">Réservez votre table</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/82">
            Choisissez votre jour, votre service et le nombre de personnes. Le bouton Google garde votre choix en mémoire pour vous guider plus vite.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-2 backdrop-blur">
            <div className="rounded-2xl bg-white/12 p-3 text-center">
              <Calendar className="mx-auto mb-1 h-5 w-5 text-butter" />
              <p className="text-[10px] uppercase tracking-wide text-white/65">Jour</p>
              <p className="text-xs font-bold capitalize">{formatDateShort(selectedDate)}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 text-center">
              <Clock className="mx-auto mb-1 h-5 w-5 text-butter" />
              <p className="text-[10px] uppercase tracking-wide text-white/65">Service</p>
              <p className="text-xs font-bold">{selectedPeriodData.label}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-butter" />
              <p className="text-[10px] uppercase tracking-wide text-white/65">Couverts</p>
              <p className="text-xs font-bold">{people}</p>
            </div>
          </div>
        </section>

        <section className="card-warm space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">1. Choisir le jour</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Calendrier</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
            {days.slice(0, 14).map((date) => {
              const active = toISODate(date) === selectedDateISO;
              const hasEvening = getAvailablePeriods(date).some((period) => period.id === "soir" && period.available);

              return (
                <button
                  key={toISODate(date)}
                  type="button"
                  onClick={() => handleDateChange(date)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-caramel bg-caramel text-white shadow-warm"
                      : "border-border/70 bg-white/65 hover:border-caramel/40 hover:bg-white"
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wide opacity-75">
                    {new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date)}
                  </span>
                  <span className="block font-display text-xl font-black">{date.getDate()}</span>
                  <span className="block text-[10px] capitalize opacity-75">
                    {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date)}
                  </span>
                  {hasEvening && (
                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${active ? "bg-white/18" : "bg-caramel/10 text-caramel"}`}>
                      soir
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">2. Choisir le service</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso capitalize">{formatDateLong(selectedDate)}</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {periods.map((period) => {
              const active = selectedPeriodData.id === period.id;

              return (
                <button
                  key={period.id}
                  type="button"
                  disabled={!period.available}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`rounded-3xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    active
                      ? "border-caramel bg-gradient-to-br from-caramel/18 to-butter/30 shadow-warm"
                      : "border-border/70 bg-white/70 hover:border-caramel/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-black text-espresso">{period.label}</p>
                      <p className="text-sm text-muted-foreground">{period.time}</p>
                    </div>
                    {active && <CheckCircle2 className="h-5 w-5 text-caramel" />}
                  </div>
                  {!period.available && <p className="mt-2 text-xs font-semibold text-muted-foreground">Disponible uniquement vendredi & samedi.</p>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">3. Nombre de personnes</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Combien de couverts ?</h2>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PEOPLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeople(option)}
                className={`rounded-2xl border px-3 py-3 font-display text-lg font-black transition ${
                  people === option
                    ? "border-caramel bg-caramel text-white shadow-sm"
                    : "border-border/70 bg-white/70 text-espresso hover:border-caramel/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Pour une grande tablée ou une demande spéciale, WhatsApp reste le plus rapide.
          </p>
        </section>

        <section className="rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-white via-butter/35 to-caramel/10 p-5 shadow-warm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Votre demande</p>
              <h2 className="mt-1 font-display text-xl font-black text-espresso capitalize">
                {formatDateLong(selectedDate)} · {selectedPeriodData.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {people} personne{people > 1 ? "s" : ""} · {selectedPeriodData.time}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Button
              onClick={() => setShowGoogleBooking(true)}
              className="h-14 rounded-2xl bg-caramel text-base font-black text-white hover:bg-caramel/90"
            >
              Réserver sur Google
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="h-13 w-full rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 font-bold text-[#128C4A] hover:bg-[#25D366]/15">
                  <WhatsAppIcon />
                  WhatsApp
                </Button>
              </a>
              <a href="tel:0259660176" className="block">
                <Button variant="outline" className="h-13 w-full rounded-2xl font-bold">
                  <Phone className="mr-2 h-5 w-5" />
                  Appeler
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="card-warm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-espresso">
            <Clock className="h-5 w-5 text-caramel" />
            Horaires d’ouverture
          </h2>
          <div className="space-y-3">
            {OPENING_HOURS.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/50 bg-white/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-black text-espresso">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.days}</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-bold text-caramel">{item.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-warm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-espresso">
            <MapPin className="h-5 w-5 text-caramel" />
            Nous trouver
          </h2>
          <p className="font-bold text-foreground">La Crêperie des Saveurs</p>
          <p className="mt-1 text-sm text-muted-foreground">17 Place Carnot – Galerie des Halles</p>
          <p className="text-sm text-muted-foreground">72600 Mamers</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/50">
            <GoogleMap />
          </div>

          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="mt-4 h-12 w-full rounded-2xl font-bold">
              Ouvrir l’itinéraire
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </section>

        <GoogleReviewCTA variant="card" className="mb-8" />
      </div>

      {showGoogleBooking && (
        <div className="fixed inset-0 z-50 bg-espresso/70 p-3 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-background shadow-elevated">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Google réservation</p>
                <h2 className="font-display text-lg font-black text-espresso capitalize">
                  {formatDateLong(selectedDate)} · {selectedPeriodData.label}
                </h2>
                <p className="text-xs text-muted-foreground">Si Google bloque l’affichage intégré, ouvrez le lien externe.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleBooking(false)}
                className="rounded-full border border-border bg-white p-2 text-muted-foreground"
                aria-label="Fermer la réservation Google"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <iframe
              title="Réservation Google"
              src={googleBookingUrl}
              className="min-h-0 flex-1 bg-white"
              loading="lazy"
            />

            <div className="grid gap-2 border-t border-border/60 p-3">
              <a href={googleBookingUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="h-12 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">
                  Ouvrir dans Google
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button variant="ghost" onClick={() => setShowGoogleBooking(false)} className="h-11 rounded-2xl font-bold">
                Revenir à l’application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reserver;
