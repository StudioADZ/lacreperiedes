import { useState } from 'react';
import { ExternalLink, Copy, Check, Star, MessageSquare, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// Feature flag for future API integration
const META_API_ENABLED = false;

interface NetworkCard {
  id: string;
  name: string;
  handle: string;
  url: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  lastPostPreview?: string;
  lastPostDate?: string;
  rating?: number;
  reviewCount?: number;
}

// Icons
const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const networks: NetworkCard[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@lacreperiedessaveurs',
    url: 'https://www.instagram.com/lacreperiedessaveurs',
    icon: <InstagramIcon />,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    description: 'Photos, stories & reels',
    lastPostPreview: '🥞 Nouvelle crêpe du week-end !',
    lastPostDate: 'Il y a 2h'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'La Crêperie des Saveurs',
    url: 'https://www.facebook.com/share/1C9p9uUBDM/',
    icon: <FacebookIcon />,
    color: 'text-white',
    bgColor: 'bg-[#1877F2]',
    description: 'Actualités & événements',
    lastPostPreview: '📣 Week-end spécial galettes !',
    lastPostDate: 'Il y a 1j'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    handle: 'Communauté VIP',
    url: 'https://wa.me/message/QVZO5N4ZDR64M1',
    icon: <WhatsAppIcon />,
    color: 'text-white',
    bgColor: 'bg-[#25D366]',
    description: 'Promos exclusives & réservations',
    lastPostPreview: '💬 Rejoignez notre groupe !',
    lastPostDate: 'Actif'
  },
  {
    id: 'google',
    name: 'Google',
    handle: 'Fiche établissement',
    url: 'https://g.page/r/CfHqAKfL6g4XEAE',
    icon: <GoogleIcon />,
    color: 'text-foreground',
    bgColor: 'bg-white border border-border',
    description: 'Avis & localisation',
    rating: 4.8,
    reviewCount: 127
  }
];

const NetworkPreviewCards = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (network: NetworkCard) => {
    navigator.clipboard.writeText(network.url);
    setCopiedId(network.id);
    toast.success(`Lien ${network.name} copié !`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (network: NetworkCard) => {
    const text = `Retrouvez-nous sur ${network.name} ! ${network.url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <section className="px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
            📱 Nos Réseaux
          </span>
          <h2 className="font-display text-2xl font-bold mb-2">
            Suivez-nous partout !
          </h2>
          <p className="text-muted-foreground text-sm">
            Aperçu de nos dernières publications
          </p>
        </div>

        {/* Network Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {networks.map((network, index) => (
            <motion.div
              key={network.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-warm p-0 overflow-hidden hover:shadow-warm transition-shadow"
            >
              {/* Header with icon */}
              <div className={`${network.bgColor} ${network.color} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {network.icon}
                    <span className="font-semibold text-sm">{network.name}</span>
                  </div>
                  <a 
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3">
                {/* Handle */}
                <p className="text-xs text-muted-foreground truncate">
                  {network.handle}
                </p>

                {/* Last post preview or rating */}
                {network.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm">{network.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({network.reviewCount} avis)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium line-clamp-2">
                      {network.lastPostPreview}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {network.lastPostDate}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <a
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1">
                      <Eye className="w-3 h-3" />
                      Ouvrir
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(network)}
                    className="h-8 w-8 p-0"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyLink(network)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId === network.id ? (
                      <Check className="w-3 h-3 text-herb" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Google specific: review buttons */}
                {network.id === 'google' && (
                  <div className="flex gap-2 pt-1">
                    <a
                      href={network.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1">
                        <Star className="w-3 h-3" />
                        Voir avis
                      </Button>
                    </a>
                    <a
                      href={`${network.url}/review`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full text-xs h-7 gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Laisser un avis
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Future: API mode indicator */}
              {META_API_ENABLED && (network.id === 'instagram' || network.id === 'facebook') && (
                <div className="px-3 py-2 bg-herb/10 text-herb text-xs text-center">
                  🔴 Live • Sync activé
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stories CTA - Mode Lite */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <a
            href="https://www.instagram.com/lacreperiedessaveurs"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-400/20 border border-pink-500/30 p-4 text-center hover:bg-pink-500/10 transition-colors">
              <span className="text-lg">📸</span>
              <p className="font-display font-semibold mt-1">Voir nos Stories Instagram</p>
              <p className="text-xs text-muted-foreground">Coulisses & moments du jour</p>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default NetworkPreviewCards;
