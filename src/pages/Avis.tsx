import {
  CheckCircle2,
  ExternalLink,
  HeartHandshake,
  MessageSquareHeart,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialFooter from "@/components/SocialFooter";
import { GOOGLE_REVIEW_LINK } from "@/components/common/GoogleReviewCTA";

const REVIEW_TIPS = [
  "L’accueil et le service",
  "La galette ou la crêpe dégustée",
  "L’ambiance de la crêperie",
  "Votre expérience globale",
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Avis vérifiés sur Google",
    text: "Le bouton ouvre directement la fiche Google officielle de La Crêperie des Saveurs.",
  },
  {
    icon: HeartHandshake,
    title: "Un vrai coup de pouce local",
    text: "Chaque avis aide une adresse indépendante à être mieux visible à Mamers.",
  },
  {
    icon: MessageSquareHeart,
    title: "Simple et rapide",
    text: "Une note, quelques mots, et votre retour aide les prochains clients à choisir.",
  },
];

const SAMPLE_PROMPTS = [
  "Très bon accueil, galettes généreuses et service agréable.",
  "Crêperie chaleureuse à Mamers, parfait pour un repas simple et gourmand.",
  "Bonne adresse locale, crêpes et galettes préparées avec soin.",
];

const Avis = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-24 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              Avis Google
            </div>

            <h1 className="font-display text-3xl font-black leading-tight">Votre avis nous aide vraiment</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Une note et quelques mots sur Google donnent de la visibilité à la crêperie et rassurent les futurs clients.
            </p>

            <div className="mt-5 rounded-3xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-7 w-7 fill-butter text-butter" />
                ))}
              </div>
              <p className="text-center font-display text-2xl font-black">Merci pour votre soutien</p>
              <p className="mt-1 text-center text-xs text-white/70">Un avis Google, c’est petit à écrire, grand pour une crêperie locale.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-caramel/25 bg-gradient-to-br from-white via-butter/35 to-caramel/10 p-5 text-center shadow-warm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-caramel text-white shadow-sm">
            <Star className="h-8 w-8 fill-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Action rapide</p>
          <h2 className="mt-1 font-display text-2xl font-black text-espresso">Laisser un avis Google</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Le lien ouvre Google directement. Vous pouvez laisser une note, écrire un mot, puis revenir dans l’application.
          </p>

          <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="mt-5 block">
            <Button className="h-14 w-full rounded-2xl bg-caramel text-base font-black text-white hover:bg-caramel/90">
              Donner mon avis sur Google
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </section>

        <section className="card-warm space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">En 30 secondes</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Que mettre dans votre avis ?</h2>
          </div>

          <div className="grid gap-2">
            {REVIEW_TIPS.map((tip) => (
              <div key={tip} className="flex items-center gap-3 rounded-2xl border border-border/55 bg-white/65 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-caramel" />
                <p className="text-sm font-semibold text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-warm space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Besoin d’inspiration ?</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Exemples de formulation</h2>
            <p className="mt-1 text-sm text-muted-foreground">À adapter avec vos vrais mots, évidemment. Le copier-coller sans âme, c’est comme une crêpe sans beurre : possible, mais triste.</p>
          </div>

          <div className="space-y-3">
            {SAMPLE_PROMPTS.map((text) => (
              <div key={text} className="rounded-2xl border border-border/55 bg-white/70 p-4">
                <Quote className="mb-2 h-5 w-5 text-caramel" />
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          {TRUST_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-caramel/15 bg-white/65 p-4 shadow-sm backdrop-blur">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-black text-espresso">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <SocialFooter />
      </div>
    </div>
  );
};

export default Avis;
