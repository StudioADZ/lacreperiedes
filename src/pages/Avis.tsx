import {
  CheckCircle2,
  ExternalLink,
  HeartHandshake,
  MessageSquareHeart,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialFooter from "@/components/SocialFooter";
import { GOOGLE_REVIEW_LINK } from "@/components/common/GoogleReviewCTA";

const REVIEW_TIPS = [
  "Ce que vous avez dégusté",
  "L’accueil et le service",
  "L’ambiance et le cadre",
  "Ce que vous aimeriez retrouver lors d’une prochaine visite",
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Votre avis reste libre",
    text: "Le bouton ouvre directement la fiche Google officielle. Vous choisissez votre note et vos mots, sans filtre.",
  },
  {
    icon: HeartHandshake,
    title: "Un vrai soutien local",
    text: "Chaque retour aide une crêperie indépendante de Mamers à progresser et à être mieux connue.",
  },
  {
    icon: MessageSquareHeart,
    title: "Quelques phrases suffisent",
    text: "Un avis personnel et précis est plus utile qu’un long texte. Parlez simplement de votre expérience.",
  },
];

const Avis = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-32 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10 blur-sm" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              Avis Google
            </div>

            <h1 className="font-display text-3xl font-black leading-tight">Partagez votre expérience</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Votre retour, positif comme critique, nous aide à progresser et permet aux futurs clients de mieux connaître la crêperie.
            </p>

            <div className="mt-5 rounded-3xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-center gap-1" aria-label="Cinq étoiles décoratives">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-7 w-7 fill-butter text-butter" aria-hidden="true" />
                ))}
              </div>
              <p className="text-center font-display text-2xl font-black">Merci pour votre visite</p>
              <p className="mt-1 text-center text-xs text-white/70">Une minute suffit pour laisser un avis utile et sincère.</p>
            </div>

            <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="mt-5 block">
              <Button className="h-14 w-full rounded-2xl bg-white text-base font-black text-espresso hover:bg-white/90">
                Ouvrir Google et donner mon avis
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <p className="mt-3 text-center text-xs text-white/70">Ouverture dans Google · aucun compte créé sur notre site</p>
          </div>
        </section>

        <section className="card-warm space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Pour vous guider</p>
            <h2 className="mt-1 font-display text-xl font-black text-espresso">Que raconter dans votre avis ?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Utilisez vos propres mots. Une expérience réelle, même racontée simplement, est toujours plus utile.
            </p>
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

        <section className="rounded-3xl border border-herb/15 bg-herb/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-herb/10 text-herb">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-espresso">Une remarque qui demande une réponse ?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Appelez-nous directement. Ce contact est séparé de Google et ne remplace pas votre liberté de laisser un avis public.
              </p>
              <a href="tel:+33259660176" className="mt-3 inline-flex text-sm font-bold text-herb hover:underline">
                Appeler le 02 59 66 01 76
              </a>
            </div>
          </div>
        </section>

        <SocialFooter />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-caramel/15 bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_30px_rgba(54,35,20,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto max-w-lg">
          <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="h-12 w-full rounded-2xl font-black">
              <Star className="mr-2 h-5 w-5" />
              Donner mon avis sur Google
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Avis;
