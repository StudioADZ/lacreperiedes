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
import { Link } from "react-router-dom";
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
    title: "Un avis totalement libre",
    text: "La fiche Google officielle s’ouvre directement. Vous choisissez votre note et vos mots, sans filtre de notre part.",
  },
  {
    icon: HeartHandshake,
    title: "Un soutien concret à Mamers",
    text: "Chaque retour aide une crêperie indépendante à progresser et permet aux futurs clients de mieux nous connaître.",
  },
  {
    icon: MessageSquareHeart,
    title: "Quelques mots suffisent",
    text: "Un avis simple, personnel et précis est souvent le plus utile. Une minute suffit.",
  },
];

const Avis = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[hsl(35_45%_92%)] via-background to-[hsl(42_50%_96%)] px-4 pb-32 pt-20">
      <div className="mx-auto max-w-lg space-y-6">
        <section
          className="relative overflow-hidden rounded-[2rem] border border-caramel/20 bg-gradient-to-br from-espresso via-espresso/95 to-caramel/80 p-5 text-white shadow-elevated"
          aria-labelledby="review-title"
        >
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-butter/10" aria-hidden="true" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-butter" aria-hidden="true" />
              Avis Google
            </div>

            <h1 id="review-title" className="font-display text-3xl font-black leading-tight">
              Votre expérience compte vraiment
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Positif, mitigé ou critique : votre retour sincère nous aide à progresser et guide les futurs clients.
            </p>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-center gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-7 w-7 fill-butter text-butter" />
                ))}
              </div>
              <p className="text-center font-display text-2xl font-black">Merci pour votre visite</p>
              <p className="mt-1 text-center text-xs text-white/70">La publication se fait directement sur la fiche Google officielle.</p>
            </div>

            <a
              href={GOOGLE_REVIEW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-butter focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
              aria-label="Ouvrir la fiche Google de La Crêperie des Saveurs pour laisser un avis"
            >
              <Button className="h-14 w-full rounded-2xl bg-white text-base font-black text-espresso hover:bg-white/90">
                Donner mon avis sur Google
                <ExternalLink className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </a>
            <p className="mt-3 text-center text-xs text-white/70">Aucun compte supplémentaire n’est créé sur notre site.</p>
          </div>
        </section>

        <section className="card-warm space-y-4" aria-labelledby="review-help-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-caramel">Pour vous guider</p>
            <h2 id="review-help-title" className="mt-1 font-display text-xl font-black text-espresso">
              Que raconter dans votre avis ?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Écrivez naturellement. Il n’est pas nécessaire de répondre à tous les points.
            </p>
          </div>

          <div className="grid gap-2">
            {REVIEW_TIPS.map((tip) => (
              <div key={tip} className="flex items-center gap-3 rounded-2xl border border-border/55 bg-white/65 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-caramel" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3" aria-label="Informations sur les avis">
          {TRUST_POINTS.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-3xl border border-caramel/15 bg-white/65 p-4 shadow-sm backdrop-blur">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-caramel/10 text-caramel">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-black text-espresso">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-herb/15 bg-herb/5 p-5" aria-labelledby="direct-contact-title">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-herb/10 text-herb">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="direct-contact-title" className="font-display text-lg font-black text-espresso">
                Une remarque qui demande une réponse ?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Appelez-nous directement pour échanger avec l’équipe. Ce contact ne remplace jamais votre liberté de publier un avis.
              </p>
              <a
                href="tel:+33259660176"
                className="mt-3 inline-flex min-h-11 items-center rounded-xl text-sm font-bold text-herb hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Appeler le 02 59 66 01 76
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-caramel/20 bg-butter/30 p-5 text-center">
          <h2 className="font-display text-lg font-black text-espresso">Envie de revenir ?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Réservez votre prochaine table en quelques instants.</p>
          <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-2xl font-bold">
            <Link to="/reserver">Réserver une table</Link>
          </Button>
        </section>

        <SocialFooter />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-caramel/15 bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_30px_rgba(54,35,20,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto max-w-lg">
          <a
            href={GOOGLE_REVIEW_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Donner un avis sur la fiche Google de La Crêperie des Saveurs"
          >
            <Button className="h-12 w-full rounded-2xl font-black">
              <Star className="mr-2 h-5 w-5" aria-hidden="true" />
              Donner mon avis sur Google
              <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
};

export default Avis;