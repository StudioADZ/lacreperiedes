import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/home/GoogleMap";

const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const PHONE_NUMBER = "0259660176";
const MAPS_DIRECTIONS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers&travelmode=driving";

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const TIME_SLOTS = [
  "12h00",
  "12h30",
  "13h00",
  "13h30",
  "14h00",
  "14h30",
  "15h00",
  "15h30",
  "16h00",
  "16h30",
  "17h00",
  "17h30",
  "18h00",
  "18h30",
  "19h00",
  "19h30",
  "20h00",
  "20h30",
  "21h00",
  "21h30",
];

const normalizeDate = (date: Date) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

const slotToMinutes = (slot: string) => {
  const [hours, minutes] = slot.replace("h", ":").split(":").map(Number);
  return hours * 60 + minutes;
};

const isSlotAvailable = (date: Date, slot: string) => {
  const today = new Date();
  if (toISODate(date) !== toISODate(today)) return true;
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  return slotToMinutes(slot) > nowMinutes + 30;
};

const buildDays = () => {
  const today = normalizeDate(new Date());
  return Array.from({ length: 21 }, (_, index) => {
    const day = normalizeDate(today);
    day.setDate(today.getDate() + index);
    return day;
  });
};

const ReserverPremium = () => {
  const days = useMemo(buildDays, []);
  const firstAvailableSlot = TIME_SLOTS.find((slot) => isSlotAvailable(days[0], slot)) ?? TIME_SLOTS[0];
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [selectedTime, setSelectedTime] = useState(firstAvailableSlot);
  const [people, setPeople] = useState(2);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (!isSlotAvailable(date, selectedTime)) {
      setSelectedTime(TIME_SLOTS.find((slot) => isSlotAvailable(date, slot)) ?? TIME_SLOTS[0]);
    }
  };

  const largeGroup = people >= 9;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-28 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              Réservation
            </div>
            <h1 className="mt-5 font-display text-3xl font-black leading-tight">Réservez votre table simplement</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              La Crêperie des Saveurs vous accueille tous les jours de 12h à 22h en continu.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-2 backdrop-blur">
              <SummaryItem icon={Calendar} label="Jour" value={formatDate(selectedDate)} />
              <SummaryItem icon={Clock3} label="Heure" value={selectedTime} />
              <SummaryItem icon={Users} label="Couverts" value={people === 9 ? "9+" : String(people)} />
            </div>
          </div>
        </section>

        <section className="card-warm space-y-4">
          <SectionTitle step="1" title="Choisissez le jour" />
          <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
            {days.map((day) => {
              const active = toISODate(day) === toISODate(selectedDate);
              return (
                <button
                  key={toISODate(day)}
                  type="button"
                  onClick={() => handleDateChange(day)}
                  className={`min-w-[82px] rounded-2xl border p-3 text-center transition ${
                    active
                      ? "border-caramel bg-caramel text-white shadow-warm"
                      : "border-border/60 bg-white/70 text-espresso hover:border-caramel/40"
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wide opacity-75">
                    {new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(day)}
                  </span>
                  <strong className="mt-1 block font-display text-2xl font-black">{day.getDate()}</strong>
                  <span className="block text-[10px] capitalize opacity-75">
                    {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(day)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-4">
          <SectionTitle step="2" title="Choisissez l’horaire" />
          <p className="text-sm text-muted-foreground">Service continu de 12h00 à 22h00, tous les jours.</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const available = isSlotAvailable(selectedDate, slot);
              const active = selectedTime === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-2xl border px-2 py-3 font-display text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    active
                      ? "border-caramel bg-caramel text-white shadow-sm"
                      : "border-border/60 bg-white/70 text-espresso hover:border-caramel/40"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-warm space-y-4">
          <SectionTitle step="3" title="Nombre de personnes" />
          <div className="grid grid-cols-3 gap-2">
            {PEOPLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeople(option)}
                className={`rounded-2xl border p-3 font-display text-lg font-black transition ${
                  people === option
                    ? "border-caramel bg-caramel text-white shadow-sm"
                    : "border-border/60 bg-white/70 text-espresso hover:border-caramel/40"
                }`}
              >
                {option === 9 ? "9+" : option}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-white via-butter/30 to-caramel/10 p-5 shadow-warm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Votre sélection</p>
              <h2 className="mt-1 font-display text-xl font-black capitalize text-espresso">
                {formatDate(selectedDate)} · {selectedTime}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {people === 9 ? "9 personnes ou plus" : `${people} personne${people > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {largeGroup ? (
              <a href={`tel:${PHONE_NUMBER}`} className="block">
                <Button className="h-14 w-full rounded-2xl text-base font-black">
                  Appeler pour confirmer le groupe
                  <Phone className="ml-2 h-5 w-5" />
                </Button>
              </a>
            ) : (
              <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="h-14 w-full rounded-2xl text-base font-black">
                  Continuer la réservation sur Google
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              La disponibilité finale est confirmée dans Google. Pour une demande particulière, appelez directement la crêperie.
            </p>

            <a href={`tel:${PHONE_NUMBER}`} className="block">
              <Button variant="outline" className="h-12 w-full rounded-2xl font-bold">
                <Phone className="mr-2 h-4 w-4" />
                Appeler le 02 59 66 01 76
              </Button>
            </a>
          </div>
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
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </section>
      </div>
    </div>
  );
};

const SummaryItem = ({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) => (
  <div className="min-w-0 rounded-2xl bg-white/10 p-3 text-center">
    <Icon className="mx-auto mb-1 h-5 w-5 text-butter" />
    <p className="text-[9px] uppercase tracking-wide text-white/60">{label}</p>
    <p className="truncate text-xs font-bold capitalize">{value}</p>
  </div>
);

const SectionTitle = ({ step, title }: { step: string; title: string }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Étape {step}</p>
    <h2 className="mt-1 font-display text-xl font-black text-espresso">{title}</h2>
  </div>
);

const InfoRow = ({ icon: Icon, title, text }: { icon: typeof Clock3; title: string; text: string }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/55 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="font-display font-black text-espresso">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  </div>
);

export default ReserverPremium;
