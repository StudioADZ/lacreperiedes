import { Calendar, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lien de réservation CORRIGÉ
const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";

const BookingCTA = () => {
  return (
    <section className="px-4 mt-12">
      <div className="max-w-lg mx-auto">
        <a
          href={BOOKING_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="card-glow relative overflow-hidden group cursor-pointer">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-caramel/10 blur-xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-caramel-dark flex items-center justify-center flex-shrink-0 shadow-warm">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold">📅 Réserver une table</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Samedi & Dimanche – Places limitées !
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </a>
        {/* Fallback link */}
        <div className="mt-2 text-center">
          <a 
            href={BOOKING_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <AlertCircle className="w-3 h-3" />
            Si le calendrier ne s'ouvre pas, cliquez ici
          </a>
        </div>
      </div>
    </section>
  );
};

export default BookingCTA;
