import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import storefront from "@/assets/storefront.jpg";
import logo from "@/assets/logo.jpg";
import crepes from "@/assets/crepes.jpg";

const Index = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={storefront}
            alt="La Crêperie des Saveurs - Devanture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 overlay-hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          {/* Logo */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-elevated mb-6 animate-scale-in border-4 border-ivory/30">
            <img
              src={logo}
              alt="La Crêperie des Saveurs"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-slide-up">
            La Crêperie
            <span className="block text-caramel-light">des Saveurs</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 font-serif mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Crêpes & Galettes artisanales à Mamers
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <Link to="/quiz">
              <Button className="btn-hero group">
                <span>Jouez au Quiz</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/carte">
              <button className="btn-secondary-hero">
                Découvrir la carte
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="px-4 -mt-16 relative z-10">
        <div className="max-w-lg mx-auto grid gap-4">
          {/* Location Card */}
          <div className="card-glow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Nous trouver</h3>
              <p className="text-muted-foreground text-sm mt-1">
                17 Place Carnot – Galerie des Halles
              </p>
              <p className="text-muted-foreground text-sm">72600 Mamers</p>
            </div>
          </div>

          {/* Hours Card */}
          <div className="card-glow flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Horaires</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Samedi & Dimanche uniquement
              </p>
              <p className="text-muted-foreground text-sm">
                12h00 – 14h00 • 19h00 – 21h00
              </p>
            </div>
          </div>

          {/* Contact Card */}
          <a href="tel:0259660176" className="card-glow flex items-start gap-4 hover:shadow-warm transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Appelez-nous</h3>
              <p className="text-primary font-medium text-lg mt-1">
                02 59 66 01 76
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Quiz Promo Section - HERO CARD */}
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto">
          <div className="card-quiz-hero relative overflow-hidden rounded-3xl">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={crepes}
                alt="Crêpes artisanales"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-butter/90 via-butter/80 to-caramel-light/70" />
            </div>
            
            {/* Content */}
            <div className="relative p-6 md:p-8">
              <span className="inline-block px-3 py-1 bg-primary/20 backdrop-blur-sm rounded-full text-xs font-medium mb-4 text-espresso border border-caramel/30">
                🎁 Chaque semaine
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-espresso">
                Gagnez des crêpes gratuites !
              </h2>
              <p className="text-espresso/80 text-sm mb-6 max-w-xs">
                Participez à notre quiz hebdomadaire et tentez de remporter une formule complète, une galette ou une crêpe.
              </p>
              <Link to="/quiz">
                <Button className="btn-hero group w-full sm:w-auto">
                  <span>Jouer maintenant</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Notre Histoire</h2>
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 shadow-warm">
            <img src={logo} alt="Amatekoe" className="w-full h-full object-cover" />
          </div>
          <p className="text-muted-foreground font-serif leading-relaxed">
            Né à Lomé au Togo, arrivé en France en 1997, Amatekoe apporte plus de 12 ans d'expérience 
            dans la restauration. Chaque crêpe est préparée avec passion et savoir-faire artisanal, 
            pour vous offrir une expérience authentique au cœur de Mamers.
          </p>
        </div>
      </section>

      {/* Social Links */}
      <section className="px-4 mt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-xl font-semibold text-center mb-6">Suivez-nous</h2>
          <div className="flex justify-center gap-4">
            <a
              href="https://www.instagram.com/lacreperiedessaveurs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-soft hover:shadow-warm transition-shadow"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/share/1C9p9uUBDM/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-soft hover:shadow-warm transition-shadow"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@creperiedessaveurs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shadow-soft hover:shadow-warm transition-shadow"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@LACRÊPERIEDESSAVEURS"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center text-white shadow-soft hover:shadow-warm transition-shadow"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
