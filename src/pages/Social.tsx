import { Instagram, Facebook, Youtube, ExternalLink } from "lucide-react";

const Social = () => {
  const socials = [
    {
      name: "Instagram",
      handle: "@lacreperiedessaveurs",
      url: "https://www.instagram.com/lacreperiedessaveurs",
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      description: "Photos et stories de nos créations"
    },
    {
      name: "Facebook",
      handle: "La Crêperie des Saveurs",
      url: "https://www.facebook.com/share/1C9p9uUBDM/",
      icon: Facebook,
      color: "bg-[#1877F2]",
      description: "Actualités et événements"
    },
    {
      name: "TikTok",
      handle: "@creperiedessaveurs",
      url: "https://www.tiktok.com/@creperiedessaveurs",
      icon: () => (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      color: "bg-black",
      description: "Vidéos fun et coulisses"
    },
    {
      name: "YouTube",
      handle: "LA CRÊPERIE DES SAVEURS",
      url: "https://www.youtube.com/@LACRÊPERIEDESSAVEURS",
      icon: Youtube,
      color: "bg-[#FF0000]",
      description: "Recettes et reportages"
    }
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            📱 Réseaux Sociaux
          </span>
          <h1 className="font-display text-3xl font-bold mb-3">
            Suivez-nous !
          </h1>
          <p className="text-muted-foreground">
            Restez connectés avec La Crêperie des Saveurs
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          {socials.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="card-warm hover:shadow-warm transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${social.color} flex items-center justify-center flex-shrink-0 text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                        {social.name}
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-primary truncate">{social.handle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{social.description}</p>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* WhatsApp Community */}
        <div className="mt-8">
          <a
            href="https://wa.me/message/QVZO5N4ZDR64M1"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-6 text-white">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold">Rejoignez notre communauté</h3>
                  <p className="text-white/80 text-sm mt-1">
                    Promos exclusives et infos en avant-première
                  </p>
                </div>
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Social;
