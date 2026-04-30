import {
  ExternalLink,
  Facebook,
  Instagram,
  MessageCircle,
  Sparkles,
  Youtube,
  type LucideIcon,
} from "lucide-react";

type SocialLink = {
  name: string;
  handle: string;
  url: string;
  icon: LucideIcon | (() => JSX.Element);
  color: string;
  description: string;
  badge: string;
};

const SOCIALS: SocialLink[] = [
  {
    name: "Instagram",
    handle: "@lacreperiedessaveurs",
    url: "https://www.instagram.com/lacreperiedessaveurs?utm_source=qr&igsh=MXhzZGl5OG96NjZrZA==",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    description: "Photos, stories, nouveautés et coulisses gourmandes.",
    badge: "Photos & stories",
  },
  {
    name: "Facebook",
    handle: "La Crêperie des Saveurs",
    url: "https://www.facebook.com/share/1C9p9uUBDM/",
    icon: Facebook,
    color: "bg-[#1877F2]",
    description: "Actualités, événements et informations pratiques.",
    badge: "Actualités",
  },
  {
    name: "TikTok",
    handle: "@creperiedessaveurs",
    url: "https://www.tiktok.com/@creperiedessaveurs",
    icon: () => (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
      </svg>
    ),
    color: "bg-black",
    description: "Vidéos courtes, moments fun et coulisses spontanées.",
    badge: "Vidéos courtes",
  },
  {
    name: "YouTube",
    handle: "@LACRÊPERIEDESSAVEURS",
    url: "https://www.youtube.com/@LACRÊPERIEDESSAVEURS",
    icon: Youtube,
    color: "bg-[#FF0000]",
    description: "Vidéos longues, recettes et contenus de fond.",
    badge: "Vidéos longues",
  },
  {
    name: "WhatsApp",
    handle: "Communauté privée",
    url: "https://wa.me/message/QVZO5N4ZDR64M1",
    icon: MessageCircle,
    color: "bg-[#25D366]",
    description: "Promos exclusives et informations en avant-première.",
    badge: "Communauté",
  },
];

const Social = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              Réseaux sociaux
            </div>

            <h1 className="font-display text-3xl font-black leading-tight">Tous nos réseaux officiels</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Choisissez votre canal préféré pour suivre La Crêperie des Saveurs : photos, vidéos, actualités, offres et communauté WhatsApp.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          {SOCIALS.map((social) => {
            const Icon = social.icon;
            return (
              <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="rounded-3xl border border-border/55 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-caramel/30 hover:bg-white hover:shadow-warm">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${social.color}`}>
                      <Icon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-black text-espresso">{social.name}</h2>
                        <span className="rounded-full bg-caramel/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-caramel">
                          {social.badge}
                        </span>
                      </div>
                      <p className="truncate text-sm font-bold text-caramel">{social.handle}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{social.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </a>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default Social;
