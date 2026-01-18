import { useMemo, useState } from 'react';
import { Facebook, Copy, Check, Rocket, Share2 } from 'lucide-react';
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
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
  </svg>
);

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

type BusyAction = null | 'facebook' | 'instagram' | 'whatsapp' | 'native' | 'copy' | 'boost';

const MetaShareHub = ({ content, showBoost = true, variant = 'full' }: MetaShareHubProps) => {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);

  const { fullShareText, hashtags } = useMemo(() => {
    const safeTitle = (content.title || '').trim();
    const safeDesc = (content.description || '').trim();
    const safeTags =
      (content.hashtags && content.hashtags.length > 0
        ? content.hashtags
        : ['#LaCreperieDesSaveurs', '#Mamers', '#Crepes']
      )
        .filter(Boolean)
        .join(' ');

    const shareText = `${safeTitle}\n\n${safeDesc}`.trim();
    return {
      hashtags: safeTags,
      fullShareText: `${shareText}\n\n${safeTags}`.trim(),
    };
  }, [content.description, content.hashtags, content.title]);

  // ---- helpers (safe) ----
  const lockAction = async (action: BusyAction, fn: () => Promise<void> | void) => {
    if (busy) return;
    setBusy(action);
    try {
      await fn();
    } finally {
      // micro delay to prevent double click spam (UX safe)
      setTimeout(() => setBusy(null), 450);
    }
  };

  const safeOpen = (url: string) => {
    const w = window.open(url, '_blank', 'noopener,noreferrer,width=700,height=600');
    if (!w) {
      toast.error("Popup bloquée par le navigateur. Lien copié.");
      safeCopy(url);
    }
  };

  const safeCopy = async (text: string) => {
    // 1) Modern clipboard
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallthrough to legacy copy
    }

    // 2) Legacy fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  // ---- actions ----

  const handleFacebookShare = () =>
    lockAction('facebook', () => {
      const fbUrl =
        `https://www.facebook.com/sharer/sharer.php?` +
        `u=${encodeURIComponent(content.url)}` +
        `&quote=${encodeURIComponent(fullShareText)}`;
      safeOpen(fbUrl);
    });

  const handleInstagramShare = () =>
    lockAction('instagram', async () => {
      const payload = `${fullShareText}\n\n👉 ${content.url}`;
      const ok = await safeCopy(payload);

      if (ok) {
        toast.success('Texte copié ! Ouvrez Instagram pour partager.', {
          action: {
            label: 'Ouvrir Instagram',
            onClick: () => safeOpen('https://www.instagram.com/lacreperiedessaveurs'),
          },
        });
      } else {
        toast.error("Impossible de copier automatiquement. Copiez manuellement le lien.");
      }
    });

  const handleWhatsAppShare = () =>
    lockAction('whatsapp', () => {
      const waText = encodeURIComponent(`${fullShareText}\n\n👉 ${content.url}`);
      safeOpen(`https://wa.me/?text=${waText}`);
    });

  const handleNativeShare = () =>
    lockAction('native', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: content.title,
            text: content.description,
            url: content.url,
          });
          return;
        } catch {
          // user cancelled or share failed -> fallback
        }
      }
      await handleCopyLink();
    });

  const handleCopyLink = async () =>
    lockAction('copy', async () => {
      const ok = await safeCopy(content.url);
      if (!ok) {
        toast.error("Impossible de copier le lien.");
        return;
      }
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    });

  const handleBoost = () =>
    lockAction('boost', async () => {
      const adCreationUrl = 'https://business.facebook.com/latest/ad_center/create_ad';

      const ok = await safeCopy(
        `Titre: ${content.title}\n\n` +
          `Description: ${content.description}\n\n` +
          `Lien: ${content.url}\n\n` +
          `Hashtags: ${hashtags}\n\n` +
          `Zone: Mamers (72600) + 20km\n` +
          `Objectif: Réservations`
      );

      if (ok) {
        toast.success('Contenu copié ! Redirection vers Meta Ads…', {
          description: 'Collez le contenu dans la création de pub',
          duration: 5000,
        });
      } else {
        toast.error("Impossible de copier le contenu. Je t'ouvre Meta Ads quand même.");
      }

      safeOpen(adCreationUrl);
    });

  // ---- UI ----

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFacebookShare}
          disabled={!!busy}
          className="h-9 w-9 p-0 hover:bg-[#1877F2]/10"
          aria-label="Partager sur Facebook"
          title="Partager sur Facebook"
        >
          <Facebook className="w-4 h-4 text-[#1877F2]" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleInstagramShare}
          disabled={!!busy}
          className="h-9 w-9 p-0 hover:bg-pink-500/10"
          aria-label="Partager sur Instagram"
          title="Partager sur Instagram"
        >
          <InstagramIcon />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleWhatsAppShare}
          disabled={!!busy}
          className="h-9 w-9 p-0 hover:bg-[#25D366]/10"
          aria-label="Partager sur WhatsApp"
          title="Partager sur WhatsApp"
        >
          <WhatsAppIcon />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNativeShare}
          disabled={!!busy}
          className="h-9 w-9 p-0"
          aria-label="Partager"
          title="Partager"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-warm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold">Partager cette publication</h3>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Facebook */}
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            onClick={handleFacebookShare}
            disabled={!!busy}
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30 w-full"
          >
            <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
              <Facebook className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Facebook</span>
          </Button>
        </motion.div>

        {/* Instagram */}
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            onClick={handleInstagramShare}
            disabled={!!busy}
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-pink-500/10 hover:border-pink-500/30 w-full"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white">
              <InstagramIcon />
            </div>
            <span className="text-xs font-medium">Instagram</span>
          </Button>
        </motion.div>

        {/* WhatsApp */}
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsAppShare}
            disabled={!!busy}
            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-[#25D366]/10 hover:border-[#25D366]/30 w-full"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
              <WhatsAppIcon />
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </Button>
        </motion.div>
      </div>

      {/* Copy link */}
      <Button type="button" variant="secondary" onClick={handleCopyLink} disabled={!!busy} className="w-full justify-center gap-2">
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
            type="button"
            onClick={handleBoost}
            disabled={!!busy}
            className="w-full bg-gradient-to-r from-[#1877F2] to-[#00C853] hover:opacity-90 text-white gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span>🚀 Booster cette publication</span>
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">Diffusez sur Meta Ads • Zone: Mamers +20km</p>
        </div>
      )}
    </motion.div>
  );
};

export default MetaShareHub;
