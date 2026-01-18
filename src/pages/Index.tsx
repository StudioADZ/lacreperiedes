import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import storefront from "@/assets/storefront.jpg";
import logo from "@/assets/logo.jpg";
import crepes from "@/assets/crepes.jpg";
import SocialFooter from "@/components/SocialFooter";
import GoogleMap from "@/components/home/GoogleMap";
import BookingCTA from "@/components/home/BookingCTA";
import SocialWall from "@/components/home/SocialWall";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <motion.div
      className="min-h-screen pb-20 bg-gradient-to-b from-[hsl(35_45%_92%)] via-[hsl(40_40%_94%)] to-[hsl(42_50%_96%)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Hero Section - Premium quality */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Background Image with blur and darkening */}
        <div className="absolute inset-0">
          <img
            src={storefront}
            alt="La Crêperie des Saveurs - Devanture"
            className="w-full h-full object-cover scale-105 blur-[1px]"
          />
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-espresso/50" />
          {/* Caramel/ivory warm overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-caramel/20 via-transparent to-ivory/10" />
          {/* Vignette effect */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
            }}
          />
          {/* Bottom fade to background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          {/* Logo with glow */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden mb-6"
          >
            {/* Glow effect behind logo */}
            <div
              className="absolute -inset-4 rounded-full opacity-60 blur-xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(35 60% 60% / 0.6) 0%, transparent 70%)",
              }}
            />
            <div className="relative w-full h-full rounded-full overflow-hidden shadow-elevated border-4 border-ivory/40">
              <img
                src={logo}
                alt="La Crêperie des Saveurs"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Typography - Quiz focus */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg"
          >
            Gagnez des crêpes chaque semaine
            <span className="block text-caramel-light drop-shadow-[0_2px_10px_rgba(218,165,32,0.5)] text-xl md:text-2xl lg:text-3xl mt-2 font-normal">
              Participez au quiz et tentez de remporter une crêpe, une galette ou une
              formule.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.12 }}
            className="text-lg md:text-xl text-white/95 font-serif mb-8 drop-shadow-md tracking-wide"
          >
            La Crêperie des Saveurs • Mamers
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.18 }}
            className="flex flex-col sm:flex-row gap-3 flex-wrap justify-center"
          >
            {/* CTA Principal - Quiz */}
            <Link to="/quiz">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button className="btn-hero group text-base px-8 py-4">
                  🎁 Jouer au quiz
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>

            {/* Secondaire - Carte */}
            <Link to="/carte">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="secondary"
                  className="text-base px-6 py-4 bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
                >
                  Voir le menu classique
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Texte discret */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.26 }}
            className="text-sm text-white/70 mt-6"
          >
            Le menu secret se débloque après participation au quiz.
          </motion.p>
        </div>

        {/* (OPTION) Scroll indicator supprimé : pas d’animation en boucle */}
      </section>

      {/* Info Cards - Clickable */}
      <section className="px-4 -mt-16 relative z-10">
        <div className="max-w-lg mx-auto grid gap-4">
          {/* Location Card - Opens Google Maps */}
          <a
            href="https://maps.app.goo.gl/6KdHfHSUs1MbzakLA"
            target="_blank"
            rel="noopener noreferrer"
            className="card-glow flex items-start gap-4 group cursor-pointer hover:border-primary/40 transition-all relative overflow-hidden"
          >
            {/* Blurred map background */}
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
              style={{
                backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=48.3506,0.3656&zoom=15&size=400x200&maptype=roadmap&style=feature:all|saturation:-100')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(2px)",
              }}
            />
            <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="relative flex-1">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                Nous trouver
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                17 Place Carnot – Galerie des Halles
              </p>
              <p className="text-muted-foreground text-sm">72600 Mamers</p>
            </div>
          </a>

          {/* Hours Card - Opens booking calendar */}
          <a
            href="https://calendar.app.google/nZShjcjWUyTcGLR97"
            target="_blank"
            rel="noopener noreferrer"
            className="card-glow flex items-start gap-4 group cursor-pointer hover:border-accent/40 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                Horaires
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Samedi & Dimanche uniquement
              </p>
              <p className="text-muted-foreground text-sm">
                12h00 – 14h00 • 19h00 – 21h00
              </p>
            </div>
          </a>

          {/* Contact Card - Phone call */}
          <a
            href="tel:0259660176"
            className="card-glow flex items-start gap-4 group cursor-pointer hover:border-terracotta/40 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0 group-hover:bg-terracotta/20 transition-colors">
              <Phone className="w-6 h-6 text-terracotta" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Appelez-nous</h3>
              <p className="text-primary font-medium text-lg mt-1">02 59 66 01 76</p>
            </div>
          </a>
        </div>
      </section>

      {/* Booking CTA */}
      <BookingCTA />

      {/* Quiz Promo Section */}
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto">
          <div className="card-quiz-hero relative overflow-hidden rounded-3xl">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={crepes} alt="Crêpes artisanales" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-butter/90 via-butter/80 to-caramel-light/70" />
            </div>

            {/* Content */}
            <div className="relative p-6 md:p-8">
              <span className="inline-block px-3 py-1 bg-primary/20 backdrop-blur-sm rounded-full text-xs font-medium mb-4 text-espresso border border-caramel/30">
                🎁 Chaque semaine
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-espresso">
                Quiz & Récompenses
              </h2>
              <p className="text-espresso/80 text-sm mb-4 max-w-xs">
                Participez à notre quiz hebdomadaire et tentez de remporter une formule
                complète, une galette ou une crêpe.
              </p>
              <p className="text-espresso/60 text-xs mb-6 max-w-xs">
                Un code obtenu via le quiz est nécessaire pour débloquer la carte secrète.
              </p>

              <Link to="/quiz">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="inline-block w-full sm:w-auto"
                >
                  <Button className="btn-hero group w-full sm:w-auto">
                    <span>Jouer au quiz</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Google Map */}
      <GoogleMap />

      {/* Social Wall - Actus Live */}
      <SocialWall />

      {/* Story Section */}
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Notre Histoire</h2>
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 shadow-warm">
            <img src={logo} alt="Amatekoe" className="w-full h-full object-cover" />
          </div>
          <p className="text-muted-foreground font-serif leading-relaxed">
            Né à Lomé au Togo, arrivé en France en 1997, Amatekoe apporte plus de 12 ans
            d'expérience dans la restauration. Chaque crêpe est préparée avec passion et
            savoir-faire artisanal, pour vous offrir une expérience authentique au cœur de
            Mamers.
          </p>
        </div>
      </section>

      {/* Social Footer */}
      <SocialFooter />
    </motion.div>
  );
};

export default Index;
