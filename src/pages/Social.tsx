import {
  ExternalLink,
  Facebook,
  Instagram,
  MessageCircle,
  Sparkles,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TikTokIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
  </svg>
);

type SocialLink = {
  name: string;
  handle: string;
  url: string;
  icon: LucideIcon | (() => JSX.Element);
  color: string;
  description: string;
  badge: string;
};

const PRIMARY_SOCIALS: SocialLink[] = [
  {
    name: "Instagram",
    handle: "@lacreperiedessaveurs",
    url: "https://www.instagram.com/lacreperiedessaveurs?utm_source=qr&igsh=MXhzZGl5OG96NjZrZA==",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    description: "Photos de nos galettes, crêpes, nouveautés et moments de vie à la crêperie.",
    badge: "À suivre en priorité",
  },
  {
    name: "Facebook",
    handle: "La Crêperie des Saveurs",
    url: "https://www.facebook.com/share/1C9p9uUBDM/",
    icon: Facebook,
    color: "bg-[#1877F2]",
    description: "Actualités, informations pratiques et nouvelles de la crêperie à Mamers.",
    badge: "Actualités locales",
  },
];

const OTHER_SOCIALS: SocialLink[] = [
  {
    name: "TikTok",
    handle: "@creperiedessaveurs",
    url: "https://www.tiktok.com/@creperiedessaveurs",
    icon: TikTokIcon,
    color: "bg-black",
    description: "Quelques vidéos courtes et coulisses publiées au fil de l’activité.",
    badge: "Vidéos",
  },
  {
    name: "YouTube",
    handle: "@LACRÊPERIEDESSAVEURS",
    url: "https://www.youtube.com/@LACRÊPERIEDESSAVEURS",
    icon: Youtube,
    color: "bg-[#FF0000]",
    description: "Notre chaîne vidéo officielle, alimentée selon les contenus disponibles.",
    badge: "Chaîne officielle",
  },
  {
    name: "WhatsApp",
    handle: "Contact direct",
    url: "https://wa.me/message/QVZO5N4ZDR64M1",
    icon: MessageCircle,
    color: "bg-[#25D366]",
    description: "Pour nous écrire directement depuis WhatsApp.",
    badge: "Contact",
  },
];

const SocialCard = ({ social, featured = false }: { social: SocialLink; featured?: boolean }) => {
  const Icon = social.icon;

  return (
    <a href={social.url} target="_blank" rel="noopener noreferrer" className="block">
      <article
        className={`rounded-3xl border p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-warm ${
          featured
            ? "border-caramel/25 bg-white/90"
            : "border-border/55 bg-white/70 hover:border-caramel/30 hover:bg-white"
        }`}
      >
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
      </article>
    </a>
  );
};

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
              Réseaux officiels
            </div>

            <h1 className="font-display text-3xl font-black leading-tight">Suivez la vie de la crêperie</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Retrouvez nos actualités, nos plats et les coulisses de La Crêperie des Saveurs sur nos comptes officiels.
            </p>

            <a href={PRIMARY_SOCIALS[0].url} target="_blank" rel="noopener noreferrer" className="mt-5 block">
              <Button className="h-14 w-full rounded-2xl bg-white text-base font-black text-espresso hover:bg-white/90">
                <Instagram className="mr-2 h-5 w-5" />
                Suivre la crêperie sur Instagram
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Nos réseaux principaux</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">L’essentiel est ici</h2>
          </div>

          {PRIMARY_SOCIALS.map((social) => (
            <SocialCard key={social.name} social={social} featured />
          ))}
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Autres canaux officiels</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Vidéo et contact direct</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Ces comptes complètent Instagram et Facebook. Leur fréquence de publication peut varier.
            </p>
          </div>

          {OTHER_SOCIALS.map((social) => (
            <SocialCard key={social.name} social={social} />
          ))}
        </section>

        <section className="rounded-3xl border border-caramel/15 bg-white/65 p-5 text-center shadow-sm backdrop-blur">
          <h2 className="font-display text-lg font-black text-espresso">Vous voyez un faux compte ?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Utilisez uniquement les liens présents sur cette page : ils renvoient vers les comptes officiels de La Crêperie des Saveurs.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Social;
