import { Calendar, Clock, Phone, ExternalLink, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/home/GoogleMap";
import GoogleReviewCTA from "@/components/common/GoogleReviewCTA";

// Lien unique de réservation - CORRIGÉ
const BOOKING_LINK = "https://calendar.app.google/nZShjcjWUyTcGLR97";
const WHATSAPP_NUMBER = "33781246918";
const PHONE_DISPLAY = "02 59 66 01 76";
const WHATSAPP_DISPLAY = "07 81 24 69 18";

// WhatsApp icon
const WhatsAppIcon = () => (
  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Social icons
const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Reserver = () => {
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

        {/* Info Box */}
        <div className="bg-gradient-to-r from-butter/50 to-caramel/20 border border-caramel/30 rounded-2xl p-4 mb-6 text-center">
          <p className="text-sm font-medium text-foreground">
            ⏰ Valable uniquement ce week-end.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Réservez par WhatsApp, téléphone ou via le bouton Réserver.
          </p>
        </div>

        {/* Booking Options */}
        <div className="space-y-4 mb-8">
          {/* Google Calendar - Primary CTA */}
          <div>
            <a 
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="card-warm hover:shadow-warm transition-all duration-300 group bg-gradient-to-r from-primary/10 to-caramel/10 border-primary/30">
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

          {/* WhatsApp */}
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour ! Je souhaite réserver une table à La Crêperie des Saveurs.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="card-warm hover:shadow-warm transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                  <WhatsAppIcon />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    WhatsApp
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-[#25D366] font-medium">{WHATSAPP_DISPLAY}</p>
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
                  <p className="text-primary font-medium">{PHONE_DISPLAY}</p>
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
              <span className="font-medium">Samedi & Dimanche</span>
              <span className="text-muted-foreground">12h00 – 14h00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="font-medium">Samedi & Dimanche</span>
              <span className="text-muted-foreground">19h00 – 21h00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-muted-foreground">Lundi - Vendredi</span>
              <span className="text-destructive">Fermé</span>
            </div>
          </div>
        </div>

        {/* Location with Map */}
        <div className="card-warm mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">📍 Nous trouver</h2>
          <p className="text-foreground font-medium">La Crêperie des Saveurs</p>
          <p className="text-muted-foreground mt-1">17 Place Carnot – Galerie des Halles</p>
          <p className="text-muted-foreground">72600 Mamers</p>
          
          {/* Embedded Google Map */}
          <div className="mt-4 rounded-xl overflow-hidden border border-border/50">
            <GoogleMap />
          </div>
          
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

        {/* Google Review CTA */}
        <GoogleReviewCTA variant="card" className="mb-8" />

        {/* Social Icons */}
        <div className="card-warm">
          <h2 className="font-display text-lg font-semibold mb-4 text-center">📱 Suivez-nous</h2>
          <div className="flex justify-center gap-4">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1C9p9uUBDM/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
            >
              <FacebookIcon />
            </a>
            
            {/* Instagram */}
            <a
              href="https://www.instagram.com/lacreperiedessaveurs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
            >
              <InstagramIcon />
            </a>
            
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            
            {/* Google */}
            <a
              href="https://g.page/r/CVTqauGmET0TEAE/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <GoogleIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reserver;
