import { Heart, MapPin, Clock, Award, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.jpg";
import storefront from "@/assets/storefront.jpg";

const About = () => {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4 inline mr-1" />
            Notre histoire
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">À propos de nous</h1>
          <p className="text-muted-foreground font-serif">
            Une passion née du voyage et de la résilience
          </p>

          {/* ✅ Micro-texte SAFE (ajout discret) */}
          <p className="text-xs text-muted-foreground mt-2">
            Derrière chaque crêpe, une histoire humaine.
          </p>
        </motion.div>

        {/* Founder Section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="card-warm text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 shadow-warm border-4 border-butter">
              <img
                src={logo}
                alt="Amatekoe - Fondateur"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">Amatekoe</h2>
            <p className="text-sm text-caramel font-medium mb-4">Fondateur & Chef</p>

            {/* ✅ On conserve le texte, on garde les paragraphes (déjà OK) */}
            <div className="text-muted-foreground font-serif leading-relaxed space-y-4 text-left">
              <p>
                Né à <strong className="text-foreground">Lomé, au Togo</strong>, Amatekoe
                arrive en France en 1997 avec un rêve : partager sa passion pour la cuisine
                et créer un lieu chaleureux où chaque client se sent comme chez lui.
              </p>
              <p>
                Après plus de{" "}
                <strong className="text-foreground">12 années d'expérience</strong> dans la
                restauration, il fonde La Crêperie des Saveurs à Mamers. Chaque crêpe et
                galette est préparée avec un savoir-faire artisanal, mêlant traditions
                bretonnes et touches personnelles.
              </p>
              <p>
                Son parcours est une histoire de{" "}
                <strong className="text-foreground">résilience et de passion</strong> – un
                témoignage que les rêves peuvent se réaliser avec du travail et de la
                détermination.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Restaurant Image */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="rounded-2xl overflow-hidden shadow-warm">
            <img
              src={storefront}
              alt="La Crêperie des Saveurs - Devanture"
              className="w-full h-48 object-cover"
            />
          </div>

          {/* ✅ Micro-texte SAFE sous image */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Un lieu pensé pour se sentir comme à la maison.
          </p>
        </motion.section>

        {/* Values */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="font-display text-xl font-semibold mb-2 text-center">
            Nos valeurs
          </h2>

          {/* ✅ Phrase d’intro SAFE (sans toucher aux cartes) */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            Ce qui guide notre cuisine et notre accueil au quotidien.
          </p>

          <div className="grid gap-4">
            <div className="card-warm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Artisanat</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque crêpe est faite maison avec des ingrédients frais et de qualité.
                </p>
              </div>
            </div>

            <div className="card-warm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-herb/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-herb" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Accueil chaleureux</h3>
                <p className="text-sm text-muted-foreground">
                  Un service convivial où chaque client est traité comme un ami.
                </p>
              </div>
            </div>

            <div className="card-warm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-caramel/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-caramel" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Authenticité</h3>
                <p className="text-sm text-muted-foreground">
                  Des recettes traditionnelles préparées avec passion et savoir-faire.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Location & Hours */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="card-warm bg-butter/30">
            {/* ✅ Micro-texte SAFE au-dessus */}
            <p className="text-xs text-muted-foreground mb-4">
              Nous trouver facilement.
            </p>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Adresse</h3>
                <p className="text-sm text-muted-foreground">
                  17 Place Carnot – Galerie des Halles
                  <br />
                  72600 Mamers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Horaires</h3>
                <p className="text-sm text-muted-foreground">
                  Samedi & Dimanche
                  <br />
                  12h00 – 14h00 • 19h00 – 21h00
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <a
            href="tel:0259660176"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-warm hover:shadow-elevated transition-shadow"
          >
            Appelez-nous : 02 59 66 01 76
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
