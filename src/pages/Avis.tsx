import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialFooter from "@/components/SocialFooter";

const Avis = () => {
  const googleReviewLink = "https://share.google/S2rTY32yn85OO48yT";

  // Avis d'exemple (statique) — à remplacer plus tard si vous connectez une source officielle
  const sampleReviews = [
    {
      name: "Marie L.",
      rating: 5,
      text: "Excellent accueil et galettes délicieuses ! La complète est parfaite. Je recommande vivement.",
      date: "Il y a 2 semaines",
    },
    {
      name: "Pierre D.",
      rating: 5,
      text: "Un vrai régal ! Les crêpes au caramel beurre salé sont incroyables. Ambiance chaleureuse.",
      date: "Il y a 1 mois",
    },
    {
      name: "Sophie M.",
      rating: 4,
      text: "Très bon restaurant, produits frais. Service rapide et sympathique. J'y retournerai !",
      date: "Il y a 1 mois",
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 inline mr-1" />
            Avis & Recommandations
          </span>

          <h1 className="font-display text-3xl font-bold mb-3">Votre avis nous aide</h1>

          <p className="text-muted-foreground">
            Une petite crêperie locale grandit grâce au bouche-à-oreille. Merci 💛
          </p>
        </div>

        {/* CTA to leave review */}
        <a href={googleReviewLink} target="_blank" rel="noopener noreferrer" className="block mb-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-caramel to-caramel-dark p-6 text-white">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-4 -bottom-12 w-24 h-24 rounded-full bg-white/5" />

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-7 h-7 fill-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">Laisser un avis Google</h2>
                <p className="text-white/85 text-sm mt-1">
                  20 secondes — et ça nous aide énormément.
                </p>
              </div>
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
        </a>

        {/* Transparency note (SAFE) */}
        <div className="card-warm mb-6">
          <p className="text-sm text-muted-foreground">
            ℹ️ Les avis ci-dessous sont des <strong>exemples</strong> d’affichage.
            Pour consulter les avis officiels, utilisez le bouton “Voir tous les avis sur Google”.
          </p>
        </div>

        {/* Rating Summary (kept but clarified) */}
        <div className="card-warm mb-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-8 h-8 text-caramel fill-caramel" />
            ))}
          </div>

          <p className="font-display text-3xl font-bold">4.9 / 5</p>
          <p className="text-muted-foreground text-sm mt-1">
            Indication visuelle — la note officielle est consultable sur Google.
          </p>
        </div>

        {/* Sample Reviews */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Exemples d’avis</h2>

          {sampleReviews.map((review, index) => (
            <div key={index} className="card-warm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>

                <div className="flex items-center gap-0.5" aria-label={`Note : ${review.rating} sur 5`}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-caramel fill-caramel" />
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{review.text}</p>
            </div>
          ))}
        </div>

        {/* View all on Google */}
        <a href={googleReviewLink} target="_blank" rel="noopener noreferrer" className="block mt-6">
          <Button variant="outline" className="w-full">
            Voir tous les avis sur Google
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </a>

        {/* Social Footer */}
        <SocialFooter />
      </div>
    </div>
  );
};

export default Avis;
