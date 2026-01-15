import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEW_LINK = "https://g.page/r/CVTqauGmET0TEAE/preview";

interface GoogleReviewCTAProps {
  variant?: "default" | "compact" | "card";
  className?: string;
}

const GoogleReviewCTA = ({ variant = "default", className = "" }: GoogleReviewCTAProps) => {
  if (variant === "compact") {
    return (
      <a
        href={GOOGLE_REVIEW_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          Laisser un avis Google
          <ExternalLink className="w-3 h-3 opacity-50" />
        </Button>
      </a>
    );
  }

  if (variant === "card") {
    return (
      <div className={`card-warm text-center ${className}`}>
        <div className="flex items-center justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Votre avis nous aide à nous améliorer !
        </p>
        <a
          href={GOOGLE_REVIEW_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full gap-2">
            <Star className="w-4 h-4" />
            Laisser un avis Google
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground mt-3">
          Merci, ça aide énormément une petite crêperie locale. 💛
        </p>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`text-center ${className}`}>
      <a
        href={GOOGLE_REVIEW_LINK}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" className="gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Laisser un avis Google
          <ExternalLink className="w-4 h-4 opacity-50" />
        </Button>
      </a>
      <p className="text-xs text-muted-foreground mt-2">
        Merci, ça aide énormément une petite crêperie locale. 💛
      </p>
    </div>
  );
};

export { GOOGLE_REVIEW_LINK };
export default GoogleReviewCTA;
