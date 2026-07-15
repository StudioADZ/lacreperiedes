import { ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEW_LINK = "https://g.page/r/CVTqauGmET0TEBM/review";

interface GoogleReviewCTAProps {
  variant?: "default" | "compact" | "card";
  className?: string;
}

const ReviewLink = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <a
    href={GOOGLE_REVIEW_LINK}
    target="_blank"
    rel="noopener noreferrer"
    className={`rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
    aria-label="Ouvrir la fiche Google de La Crêperie des Saveurs pour laisser un avis"
  >
    {children}
  </a>
);

const GoogleReviewCTA = ({ variant = "default", className = "" }: GoogleReviewCTAProps) => {
  if (variant === "compact") {
    return (
      <ReviewLink className={`inline-flex ${className}`}>
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="h-4 w-4 fill-current" aria-hidden="true" />
          Laisser un avis Google
          <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
        </Button>
      </ReviewLink>
    );
  }

  if (variant === "card") {
    return (
      <div className={`card-warm text-center ${className}`}>
        <div className="mb-2 flex items-center justify-center gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-5 w-5 fill-caramel text-caramel" />
          ))}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Votre retour sincère nous aide à progresser.</p>
        <ReviewLink className="block">
          <Button className="w-full gap-2">
            <Star className="h-4 w-4" aria-hidden="true" />
            Laisser un avis Google
            <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
          </Button>
        </ReviewLink>
        <p className="mt-3 text-xs text-muted-foreground">Merci de soutenir une crêperie indépendante de Mamers.</p>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <ReviewLink className="inline-flex">
        <Button variant="outline" className="gap-2">
          <Star className="h-5 w-5 fill-current" aria-hidden="true" />
          Laisser un avis Google
          <ExternalLink className="h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </ReviewLink>
      <p className="mt-2 text-xs text-muted-foreground">Votre avis reste libre et est publié directement sur Google.</p>
    </div>
  );
};

export { GOOGLE_REVIEW_LINK };
export default GoogleReviewCTA;