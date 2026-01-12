import { useState, useEffect } from "react";
import { ExternalLink, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";

interface SocialPost {
  id: string;
  url: string;
  network: "instagram" | "facebook";
  is_visible: boolean;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SocialWall = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/social_posts?is_visible=eq.true&order=created_at.desc&limit=4`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.log("Social posts not available yet");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no posts
  }

  const getNetworkIcon = (network: string) => {
    if (network === "instagram") {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>
    );
  };

  return (
    <section className="px-4 mt-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold">📺 Actus de la Crêperie</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Nos dernières publications
          </p>
        </div>

        <div className="grid gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-warm flex items-start gap-4 group hover:border-primary/30 transition-all"
            >
              <div className="flex-shrink-0">
                {getNetworkIcon(post.network)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium capitalize">{post.network}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {post.url}
                </p>
              </div>
              <div className="flex gap-2 text-muted-foreground">
                <span className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Heart className="w-4 h-4" />
                </span>
                <span className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </span>
                <span className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialWall;
