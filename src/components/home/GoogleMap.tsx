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
          href="https://maps.app.goo.gl/6KdHfHSUs1MbzakLA"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border/50 hover:shadow-warm transition-shadow duration-300">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2665.4!2d0.3656!3d48.3506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e2c1f3f3f3f3f3%3A0x47e2c1f3f3f3f3f3!2s17%20Place%20Carnot%2C%2072600%20Mamers!5e0!3m2!1sfr!2sfr!4v1699999999999!5m2!1sfr!2sfr"
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
