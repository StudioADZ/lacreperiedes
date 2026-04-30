import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
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
const PHONE_NUMBER = "0259660176";
const MAPS_DIRECTIONS_LINK =
  "https://www.google.com/maps/dir/?api=1&destination=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers&travelmode=driving";

const OPENING_HOURS = [
  { label: "Midi", days: "Lundi au dimanche", hours: "12h00 – 14h00", slots: "12h00, 12h30, 13h00, 13h30" },
  { label: "Soir", days: "Vendredi & samedi", hours: "19h00 – 22h00", slots: "19h00, 19h30, 20h00, 20h30, 21h00, 21h30" },
];

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const MIDDAY_SLOTS = ["12h00", "12h30", "13h00", "13h30"];
const EVENING_SLOTS = ["19h00", "19h30", "20h00", "20h30", "21h00", "21h30"];
const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const BOOKING_WINDOW_DAYS = 365;

type ServiceSlot = {
  id: string;
  time: string;
  available: boolean;
  period: "Midi" | "Soir";
};

type CalendarMonth = {
  key: string;
  label: string;
  start: Date;
  days: Date[];
};

const WhatsAppIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const formatDateLong = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);

const formatDateShort = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(date);

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameCalendarDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

const slotTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.replace("h", ":").split(":").map(Number);
  return hours * 60 + minutes;
};

const getNowInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const isSlotStillBookable = (date: Date, time: string) => {
  if (!isSameCalendarDay(date, new Date())) return true;
  return slotTimeToMinutes(time) > getNowInMinutes();
};

const getAvailableSlots = (date: Date): ServiceSlot[] => {
  const day = date.getDay();
  const hasEvening = day === 5 || day === 6;

  return [
    ...MIDDAY_SLOTS.map((time) => ({ id: `midi-${time}`, time, available: isSlotStillBookable(date, time), period: "Midi" as const })),
    ...EVENING_SLOTS.map((time) => ({ id: `soir-${time}`, time, available: hasEvening && isSlotStillBookable(date, time), period: "Soir" as const })),
  ];
};

const dateHasAvailableSlot = (date: Date) => getAvailableSlots(date).some((slot) => slot.available);

const buildBookableDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  if (!dateHasAvailableSlot(startDate)) startDate.setDate(startDate.getDate() + 1);

  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

const buildCalendarMonths = (days: Date[]): CalendarMonth[] => {
  const monthMap = new Map<string, CalendarMonth>();

  days.forEach((date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { key, label: formatMonthLabel(start), start, days: [] });
    }

    monthMap.get(key)!.days.push(date);
  });

  return Array.from(monthMap.values());
};

const getMondayFirstDayIndex = (date: Date) => (date.getDay() + 6) % 7;

const buildMonthCells = (month: CalendarMonth) => {
  const blanks = Array.from({ length: getMondayFirstDayIndex(month.start) }, () => null);
  return [...blanks, ...month.days];
};

const buildWhatsAppText = (date: Date, slot: ServiceSlot, people: number) =>
  `Bonjour ! Je souhaite réserver une table à La Crêperie des Saveurs pour ${people === 9 ? "9 personnes ou plus" : `${people} personne${people > 1 ? "s" : ""}`}, le ${formatDateLong(date)} à ${slot.time}.`;

const Reserver = () => {
  const days = useMemo(() => buildBookableDays(), []);
  const months = useMemo(() => buildCalendarMonths(days), [days]);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState("midi-12h00");
  const [people, setPeople] = useState(2);
  const [showGoogleBooking, setShowGoogleBooking] = useState(false);

  const visibleMonth = months[visibleMonthIndex] ?? months[0];
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const slots = useMemo(() => getAvailableSlots(selectedDate), [selectedDate]);
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId && slot.available) ?? slots.find((slot) => slot.available) ?? slots[0];
  const selectedDateISO = toISODate(selectedDate);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppText(selectedDate, selectedSlot, people))}`;
  const shouldPreferPhone = people >= 9;

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const nextSlots = getAvailableSlots(date);
    const stillAvailable = nextSlots.some((slot) => slot.id === selectedSlotId && slot.available);
    if (!stillAvailable) setSelectedSlotId(nextSlots.find((slot) => slot.available)?.id ?? "midi-12h00");
  };

  const handleMonthChange = (nextIndex: number) => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), months.length - 1);
    setVisibleMonthIndex(safeIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <Hero selectedDate={selectedDate} selectedSlot={selectedSlot} people={people} />

        <section className="card-warm space-y-5">
          <SectionTitle eyebrow="1. Choisir le jour" title="Agenda annuel" />
          <div className="rounded-[1.75rem] border border-caramel/15 bg-white/70 p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <button type="button" onClick={() => handleMonthChange(visibleMonthIndex - 1)} disabled={visibleMonthIndex === 0} className="rounded-full border border-border/70 bg-white/80 p-2 text-espresso transition hover:border-caramel/40 disabled:opacity-35" aria-label="Mois précédent">
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="font-display text-lg font-black capitalize text-espresso">{visibleMonth.label}</p>
                <p className="text-[11px] text-muted-foreground">Réservation possible sur 12 mois glissants</p>
              </div>

              <button type="button" onClick={() => handleMonthChange(visibleMonthIndex + 1)} disabled={visibleMonthIndex === months.length - 1} className="rounded-full border border-border/70 bg-white/80 p-2 text-espresso transition hover:border-caramel/40 disabled:opacity-35" aria-label="Mois suivant">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {months.map((month, index) => (
                <button key={month.key} type="button" onClick={() => handleMonthChange(index)} className={`min-w-fit rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition ${visibleMonthIndex === index ? "border-caramel bg-caramel text-white shadow-sm" : "border-border/70 bg-background/70 text-muted-foreground hover:border-caramel/40 hover:text-foreground"}`}>
                  {month.label.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              {WEEK_DAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((date, index) => {
                if (!date) return <div key={`blank-${index}`} className="h-12" aria-hidden="true" />;

                const active = toISODate(date) === selectedDateISO;
                const today = isSameCalendarDay(date, new Date());
                const hasEvening = getAvailableSlots(date).some((slot) => slot.period === "Soir" && slot.available);

                return (
                  <button key={toISODate(date)} type="button" onClick={() => handleDateChange(date)} className={`relative min-h-12 rounded-2xl border px-1 py-2 text-center transition ${active ? "border-caramel bg-caramel text-white shadow-warm" : "border-border/60 bg-background/70 text-espresso hover:border-caramel/40 hover:bg-white"}`}>
                    <span className="block font-display text-base font-black leading-none">{date.getDate()}</span>
                    {today && <span className={`mt-1 block text-[8px] font-bold uppercase ${active ? "text-white/80" : "text-caramel"}`}>auj.</span>}
                    {hasEvening && <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-caramel"}`} />}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">Le point doré indique un service du soir disponible. Les mois avancent sur une année complète.</p>
          </div>
        </section>

        <section className="card-warm space-y-5">
          <SectionTitle eyebrow="2. Choisir l’horaire" title={formatDateLong(selectedDate)} capitalize />
          <TimeSlotGroup title="Midi" slots={slots.filter((slot) => slot.period === "Midi")} selectedSlot={selectedSlot} onSelect={setSelectedSlotId} />
          <TimeSlotGroup title="Soir — vendredi & samedi" slots={slots.filter((slot) => slot.period === "Soir")} selectedSlot={selectedSlot} onSelect={setSelectedSlotId} />
        </section>

        <section className="card-warm space-y-5">
          <SectionTitle eyebrow="3. Nombre de personnes" title="Combien de couverts ?" />
          <div className="grid grid-cols-3 gap-2">
            {PEOPLE_OPTIONS.map((option) => (
              <button key={option} type="button" onClick={() => setPeople(option)} className={`rounded-2xl border px-3 py-3 font-display text-lg font-black transition ${people === option ? "border-caramel bg-caramel text-white shadow-sm" : "border-border/70 bg-white/70 text-espresso hover:border-caramel/40"}`}>
                {option === 9 ? "9+" : option}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Pour 9 personnes ou plus, privilégiez l’appel afin de confirmer la disponibilité.</p>
        </section>

        <ReservationSummary selectedDate={selectedDate} selectedSlot={selectedSlot} people={people} shouldPreferPhone={shouldPreferPhone} whatsappUrl={whatsappUrl} onOpenGoogle={() => setShowGoogleBooking(true)} />
        <OpeningHours />
        <LocationBlock />
        <GoogleReviewCTA variant="card" className="mb-8" />
      </div>

      {showGoogleBooking && (
        <GoogleBookingModal selectedDate={selectedDate} selectedSlot={selectedSlot} people={people} onClose={() => setShowGoogleBooking(false)} />
      )}
    </div>
  );
};

const Hero = ({ selectedDate, selectedSlot, people }: { selectedDate: Date; selectedSlot: ServiceSlot; people: number }) => (
  <section className="overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
      <Sparkles className="h-3.5 w-3.5 text-butter" />
      Réservation
    </div>
    <h1 className="font-display text-3xl font-black leading-tight">Réservez votre table</h1>
    <p className="mt-2 text-sm leading-relaxed text-white/82">Sélectionnez une date sur l’année, un horaire et le nombre de couverts. Google s’ouvre dans l’application quand c’est possible.</p>

    <div className="mt-5 grid grid-cols-3 gap-2 rounded-3xl bg-white/10 p-2 backdrop-blur">
      <HeroStat icon={Calendar} label="Jour" value={formatDateShort(selectedDate)} />
      <HeroStat icon={Clock} label="Horaire" value={selectedSlot.time} />
      <HeroStat icon={Users} label="Couverts" value={people === 9 ? "9+" : String(people)} />
    </div>
  </section>
);

const HeroStat = ({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) => (
  <div className="rounded-2xl bg-white/12 p-3 text-center">
    <Icon className="mx-auto mb-1 h-5 w-5 text-butter" />
    <p className="text-[10px] uppercase tracking-wide text-white/65">{label}</p>
    <p className="text-xs font-bold capitalize">{value}</p>
  </div>
);

const SectionTitle = ({ eyebrow, title, capitalize = false }: { eyebrow: string; title: string; capitalize?: boolean }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">{eyebrow}</p>
    <h2 className={`mt-1 font-display text-xl font-black text-espresso ${capitalize ? "capitalize" : ""}`}>{title}</h2>
  </div>
);

const TimeSlotGroup = ({ title, slots, selectedSlot, onSelect }: { title: string; slots: ServiceSlot[]; selectedSlot: ServiceSlot; onSelect: (slotId: string) => void }) => (
  <div>
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button key={slot.id} type="button" disabled={!slot.available} onClick={() => onSelect(slot.id)} className={`rounded-2xl border px-3 py-3 text-center font-display text-base font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${selectedSlot.id === slot.id ? "border-caramel bg-caramel text-white shadow-sm" : "border-border/70 bg-white/70 text-espresso hover:border-caramel/40"}`}>
          {slot.time}
        </button>
      ))}
    </div>
  </div>
);

const ReservationSummary = ({ selectedDate, selectedSlot, people, shouldPreferPhone, whatsappUrl, onOpenGoogle }: { selectedDate: Date; selectedSlot: ServiceSlot; people: number; shouldPreferPhone: boolean; whatsappUrl: string; onOpenGoogle: () => void }) => (
  <section className="rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-white via-butter/35 to-caramel/10 p-5 shadow-warm">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-caramel text-white">
        <Star className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Votre sélection</p>
        <h2 className="mt-1 font-display text-xl font-black capitalize text-espresso">{formatDateLong(selectedDate)} · {selectedSlot.time}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{people === 9 ? "9 personnes ou plus" : `${people} personne${people > 1 ? "s" : ""}`} · {selectedSlot.period}</p>
      </div>
    </div>

    <div className="mt-5 grid gap-3">
      {shouldPreferPhone ? (
        <a href={`tel:${PHONE_NUMBER}`} className="block">
          <Button className="h-14 w-full rounded-2xl bg-caramel text-base font-black text-white hover:bg-caramel/90">
            Appeler pour réserver
            <Phone className="ml-2 h-5 w-5" />
          </Button>
        </a>
      ) : (
        <Button onClick={onOpenGoogle} className="h-14 w-full rounded-2xl bg-caramel text-base font-black text-white hover:bg-caramel/90">
          Réserver sur Google
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${PHONE_NUMBER}`} className="block">
          <Button variant="outline" className="h-13 w-full rounded-2xl font-bold">
            <Phone className="mr-2 h-4 w-4" />
            Appeler
          </Button>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="h-13 w-full rounded-2xl border-[#25D366]/35 bg-[#25D366]/10 font-bold text-[#128C4A] hover:bg-[#25D366]/15">
            <WhatsAppIcon />
            WhatsApp
          </Button>
        </a>
      </div>
    </div>
  </section>
);

const GoogleBookingModal = ({ selectedDate, selectedSlot, people, onClose }: { selectedDate: Date; selectedSlot: ServiceSlot; people: number; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-espresso/70 p-3 backdrop-blur-sm">
    <div className="mx-auto flex h-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-background shadow-elevated">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Réservation Google</p>
          <h2 className="font-display text-lg font-black capitalize text-espresso">{formatDateLong(selectedDate)} · {selectedSlot.time}</h2>
          <p className="text-xs text-muted-foreground">{people === 9 ? "9 personnes ou plus" : `${people} personne${people > 1 ? "s" : ""}`} · restez dans l’application si Google l’autorise.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-border bg-white p-2 text-muted-foreground" aria-label="Fermer la réservation Google">
          <X className="h-5 w-5" />
        </button>
      </div>

      <iframe title="Réservation Google" src={BOOKING_LINK} className="min-h-0 flex-1 bg-white" loading="lazy" />

      <div className="grid gap-2 border-t border-border/60 p-3">
        <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="h-12 w-full rounded-2xl bg-caramel font-black text-white hover:bg-caramel/90">
            Ouvrir dans Google si besoin
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
        <Button variant="ghost" onClick={onClose} className="h-11 rounded-2xl font-bold">
          Revenir à l’application
        </Button>
      </div>
    </div>
  </div>
);

const OpeningHours = () => (
  <section className="card-warm">
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black text-espresso">
      <Clock className="h-5 w-5 text-caramel" />
      Horaires d’ouverture
    </h2>
    <div className="space-y-3">
      {OPENING_HOURS.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border/50 bg-white/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-black text-espresso">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.days}</p>
              <p className="mt-1 text-xs text-muted-foreground">Créneaux : {item.slots}</p>
            </div>
            <p className="whitespace-nowrap text-sm font-bold text-caramel">{item.hours}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const LocationBlock = () => (
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

    <a href={MAPS_DIRECTIONS_LINK} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="mt-4 h-12 w-full rounded-2xl font-bold">
        Ouvrir l’itinéraire dans Google Maps
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </a>
  </section>
);

export default Reserver;
