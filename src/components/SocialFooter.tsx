import { MessageCircle, Star } from "lucide-react";
import { useLocation } from "react-router-dom";
import { GOOGLE_REVIEW_LINK } from "./common/GoogleReviewCTA";

// Lien fiche Google établissement (différent du lien avis)
const GOOGLE_BUSINESS_LINK = "https://share.google/BGUgjAnOT3yQfJd12";

// Ordre fixe: Google / Facebook / Instagram / TikTok / YouTube / WhatsApp
const socialLinks = [
  {
    name: "Google",
    href: GOOGLE_BUSINESS_LINK, // Fiche établissement, pas avis
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    bgColor: "bg-white border border-gray-200",
    textColor: "text-gray-700",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1C9p9uUBDM/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    bgColor: "bg-[#1877F2]",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/lacreperiedessaveurs?utm_source=qr&igsh=MXhzZGl5OG96NjZrZA==",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    gradient: "from-purple-500 via-pink-500 to-orange-400",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@creperiedessaveurs",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
    bgColor: "bg-black",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@LACRÊPERIEDESSAVEURS",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    bgColor: "bg-[#FF0000]",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/message/QVZO5N4ZDR64M1",
    icon: <MessageCircle className="w-5 h-5" />,
    bgColor: "bg-[#25D366]",
  },
];

const SocialFooter = () => {
  const location = useLocation();
  
  // Don't show on Social/Réseaux page to avoid duplicate
  if (location.pathname === '/reseaux' || location.pathname === '/social') {
    return null;
  }

  return (
    <footer className="mt-12 pb-8">
      <div className="max-w-lg mx-auto px-4">
        {/* Google Review CTA */}
        <div className="text-center mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <a
            href={GOOGLE_REVIEW_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-yellow-300 text-sm font-medium hover:bg-yellow-50 transition-colors"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            Laisser un avis Google
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            Merci, ça aide énormément une petite crêperie locale. 💛
          </p>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-display text-lg font-semibold">Suivez-nous</h3>
          <p className="text-sm text-muted-foreground">Retrouvez-nous sur les réseaux</p>
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
                link.gradient
                  ? `bg-gradient-to-br ${link.gradient}`
                  : link.bgColor
              }`}
              style={{
                boxShadow: "0 4px 15px -3px rgba(0,0,0,0.2), 0 0 20px -5px rgba(255,200,100,0.3)",
              }}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default SocialFooter;
