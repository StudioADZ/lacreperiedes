import { Calendar, Clock, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reserver = () => {
  const googleCalendarLink = "https://calendar.app.google/tCVyfeC7s1hNXcQ77";

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Calendar className="w-4 h-4 inline mr-1" />
            Réservation
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">
            Réservez votre table
          </h1>
          <p className="text-muted-foreground">
            Assurez votre place pour déguster nos crêpes
          </p>
        </div>

        {/* Booking Options */}
        <div className="space-y-4 mb-8">
          {/* Google Calendar */}
          <a 
            href={googleCalendarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="card-warm hover:shadow-warm transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    Réserver en ligne
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez votre créneau via Google Calendar
                  </p>
                </div>
              </div>
            </div>
          </a>

          {/* Phone */}
          <a href="tel:0259660176" className="block">
            <div className="card-warm hover:shadow-warm transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-herb flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">Par téléphone</h3>
                  <p className="text-primary font-medium">02 59 66 01 76</p>
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Hours */}
        <div className="card-warm mb-8">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Horaires d'ouverture
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="font-medium">Mardi - Samedi</span>
              <span className="text-muted-foreground">11h30 – 14h00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="font-medium">Mardi - Samedi</span>
              <span className="text-muted-foreground">18h30 – 21h00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-muted-foreground">Dimanche - Lundi</span>
              <span className="text-destructive">Fermé</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card-warm">
          <h2 className="font-display text-lg font-semibold mb-4">📍 Nous trouver</h2>
          <p className="text-foreground font-medium">La Crêperie des Saveurs</p>
          <p className="text-muted-foreground mt-1">17 Place Carnot – Galerie des Halles</p>
          <p className="text-muted-foreground">72600 Mamers</p>
          
          <a 
            href="https://maps.google.com/?q=17+Place+Carnot+72600+Mamers"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full mt-4">
              Ouvrir dans Google Maps
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Reserver;
