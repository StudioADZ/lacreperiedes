import { ArrowRight, Calendar, Clock3, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const BookingCTA = () => {
  return (
    <section className="mt-12 px-4" aria-labelledby="home-booking-title">
      <div className="mx-auto max-w-lg">
        <Link
          to="/reserver"
          className="group block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="card-glow relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-colors group-hover:bg-primary/20" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-caramel/10 blur-xl" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-caramel-dark shadow-warm">
                <Calendar className="h-7 w-7 text-white" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Réservation rapide
                </p>
                <h2 id="home-booking-title" className="font-display text-xl font-bold text-foreground">
                  Réserver une table
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Choisissez votre créneau en quelques instants, tous les jours de 12h à 22h.
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-caramel">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Service continu selon disponibilité
                </p>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default BookingCTA;
