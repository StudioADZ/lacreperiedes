import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_REVIEW_LINK = "https://g.page/r/CVTqauGmET0TEBM/review";

interface GoogleReviewCTAProps {
  variant?: "default" | "compact" | "card";
  className?: string;
  /**
   * Optional: override the default label without changing logic
   */
  label?: string;
}

const GoogleReviewCTA = ({
  variant = "default",
  className = "",
  label = "Laisser un avis Google",
}: GoogleReviewCTAProps) => {
  const linkProps = {
    href: GOOGLE_REVIEW_LINK,
    target: "_blank",
    rel: "noopener noreferrer",
    title: "Ouvre Google Reviews dans un nouvel onglet",
    "aria-label": "Laisser un avis Google (ouvre un nouvel onglet)",
  };

  if (variant === "compact") {
    return (
      <div className={className}>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a {...linkProps}>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {label}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </Button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`card-warm text-center ${className}`}>
        <div className="flex items-center justify-center gap-1 mb-2" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Votre avis nous aide à nous améliorer !
        </p>

        <Button asChild className="w-full gap-2">
          <a {...linkProps}>
            <Star className="w-4 h-4" />
            {label}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          Merci, ça aide énormément une petite crêperie locale. 💛
        </p>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`text-center ${className}`}>
      <Button asChild variant="outline" className="gap-2">
        <a {...linkProps}>
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          {label}
          <ExternalLink className="w-4 h-4 opacity-50" />
        </a>
      </Button>

      <p className="text-xs text-muted-foreground mt-2">
        Merci, ça aide énormément une petite crêperie locale. 💛
      </p>
    </div>
  );
};

export { GOOGLE_REVIEW_LINK };
export default GoogleReviewCTA;
