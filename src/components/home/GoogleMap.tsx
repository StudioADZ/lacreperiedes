const GoogleMap = () => {
  return (
    <section className="px-4 mt-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold">📍 Nous trouver</h2>
          <p className="text-muted-foreground text-sm mt-1">
            17 Place Carnot, Galerie des Halles – 72600 Mamers
          </p>
        </div>
        <a
          href="https://www.google.com/maps/search/?api=1&query=La%20Cr%C3%AAperie%20des%20Saveurs%2C%2017%20Place%20Carnot%2C%2072600%20Mamers"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border/50 hover:shadow-warm transition-shadow duration-300">
            <iframe
              src="https://www.google.com/maps?q=17%20Place%20Carnot%2C%2072600%20Mamers&output=embed"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[30%] hover:grayscale-0 transition-all duration-500"
              title="La Crêperie des Saveurs - Localisation"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
          </div>
        </a>
      </div>
    </section>
  );
};

export default GoogleMap;
