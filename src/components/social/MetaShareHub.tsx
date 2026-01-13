import { useState } from 'react';
import { Facebook, ExternalLink, Copy, Check, Rocket, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ShareableContent {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

interface MetaShareHubProps {
  content: ShareableContent;
  showBoost?: boolean;
  variant?: 'full' | 'compact';
}

// Instagram icon SVG
const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
  </svg>
);

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const MetaShareHub = ({ content, showBoost = true, variant = 'full' }: MetaShareHubProps) => {
  const [copied, setCopied] = useState(false);

  const shareText = `${content.title}\n\n${content.description}`;
  const hashtags = content.hashtags?.join(' ') || '#LaCreperieDesSaveurs #Mamers #Crepes';
  const fullShareText = `${shareText}\n\n${hashtags}`;

  // Facebook Share URL (opens share dialog with pre-filled content)
  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(fullShareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  // Instagram - Open app or web (note: can't pre-fill, but opens profile for story)
  const handleInstagramShare = () => {
    // Instagram doesn't have direct share URLs like FB, so we copy and guide
    navigator.clipboard.writeText(fullShareText + '\n' + content.url);
    toast.success('Texte copié ! Ouvrez Instagram pour partager.', {
      action: {
        label: 'Ouvrir Instagram',
        onClick: () => window.open('https://www.instagram.com/lacreperiedessaveurs', '_blank')
      }
    });
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const waText = encodeURIComponent(`${fullShareText}\n\n👉 ${content.url}`);
    window.open(`https://wa.me/?text=${waText}`, '_blank');
  };

  // Native Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
          url: content.url
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(content.url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  // Meta Ads Boost - Opens Meta Ads Manager with pre-filled info
  const handleBoost = () => {
    // Meta Business Suite URL for creating an ad
    // Note: This requires user to be logged into Meta Business Suite
    const adCreationUrl = `https://business.facebook.com/latest/ad_center/create_ad`;
    
    // Copy the content for easy paste
    navigator.clipboard.writeText(
      `Titre: ${content.title}\n\nDescription: ${content.description}\n\nLien: ${content.url}\n\nZone: Mamers (72600) + 20km\nObjectif: Réservations`
    );
    
    toast.success('Contenu copié ! Redirigez vers Meta Ads...', {
      description: 'Collez le contenu dans la création de pub',
      duration: 5000
    });
    
    window.open(adCreationUrl, '_blank');
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFacebookShare}
          className="h-9 w-9 p-0 hover:bg-[#1877F2]/10"
        >
          <Facebook className="w-4 h-4 text-[#1877F2]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInstagramShare}
          className="h-9 w-9 p-0 hover:bg-pink-500/10"
        >
          <InstagramIcon />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWhatsAppShare}
          className="h-9 w-9 p-0 hover:bg-[#25D366]/10"
        >
          <WhatsAppIcon />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNativeShare}
          className="h-9 w-9 p-0"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-warm space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold">Partager cette publication</h3>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Facebook */}
        <Button
          variant="outline"
          onClick={handleFacebookShare}
          className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30"
        >
          <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
            <Facebook className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Facebook</span>
        </Button>

        {/* Instagram */}
        <Button
          variant="outline"
          onClick={handleInstagramShare}
          className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-pink-500/10 hover:border-pink-500/30"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white">
            <InstagramIcon />
          </div>
          <span className="text-xs font-medium">Instagram</span>
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          onClick={handleWhatsAppShare}
          className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-[#25D366]/10 hover:border-[#25D366]/30"
        >
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
            <WhatsAppIcon />
          </div>
          <span className="text-xs font-medium">WhatsApp</span>
        </Button>
      </div>

      {/* Copy link */}
      <Button
        variant="secondary"
        onClick={handleCopyLink}
        className="w-full justify-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-herb" />
            <span>Lien copié !</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copier le lien</span>
          </>
        )}
      </Button>

      {/* Boost button */}
      {showBoost && (
        <div className="pt-2 border-t border-border/50">
          <Button
            onClick={handleBoost}
            className="w-full bg-gradient-to-r from-[#1877F2] to-[#00C853] hover:opacity-90 text-white gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span>🚀 Booster cette publication</span>
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Diffusez sur Meta Ads • Zone: Mamers +20km
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MetaShareHub;
