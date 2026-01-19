import { useState, useEffect } from "react";
import { ExternalLink, Heart, MessageCircle, Share2, Loader2, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface SocialPost {
  id: string;
  url: string;
  network: "instagram" | "facebook";
  is_visible: boolean;
  created_at: string;
}

interface PostInteraction {
  id: string;
  post_id: string;
  interaction_type: "like" | "comment";
  device_fingerprint: string;
  comment_text: string | null;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Simple device fingerprint for anti-spam
const getDeviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
};

// Format relative time in French
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const SocialWall = () => {
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<PostInteraction[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<PostInteraction[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deviceId = getDeviceId();

  useEffect(() => {
    const fetchLatestPost = async () => {
      try {
        // Fetch latest visible post (Instagram priority via order)
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/social_posts?is_visible=eq.true&order=network.asc,created_at.desc&limit=1`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setPost(data[0]);
            fetchInteractions(data[0].id);
          }
        }
      } catch (err) {
        console.log("Social posts not available yet");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPost();
  }, []);

  const fetchInteractions = async (postId: string) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/post_interactions?post_id=eq.${postId}&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data: PostInteraction[] = await response.json();
        setInteractions(data);

        // Count likes
        const likes = data.filter((i) => i.interaction_type === "like");
        setLikeCount(likes.length);
        setHasLiked(likes.some((i) => i.device_fingerprint === deviceId));

        // Get comments
        setComments(data.filter((i) => i.interaction_type === "comment"));
      }
    } catch (err) {
      console.log("Could not fetch interactions");
    }
  };

  const handleLike = async () => {
    if (!post || hasLiked) return;

    setHasLiked(true);
    setLikeCount((c) => c + 1);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/post_interactions`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          post_id: post.id,
          interaction_type: "like",
          device_fingerprint: deviceId,
        }),
      });
    } catch (err) {
      setHasLiked(false);
      setLikeCount((c) => c - 1);
    }
  };

  const handleComment = async () => {
    if (!post || !newComment.trim() || submitting) return;

    setSubmitting(true);
    const commentText = newComment.trim();
    setNewComment("");

    // Optimistic update
    const tempComment: PostInteraction = {
      id: crypto.randomUUID(),
      post_id: post.id,
      interaction_type: "comment",
      device_fingerprint: deviceId,
      comment_text: commentText,
      created_at: new Date().toISOString(),
    };
    setComments((c) => [tempComment, ...c]);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/post_interactions`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          post_id: post.id,
          interaction_type: "comment",
          device_fingerprint: deviceId,
          comment_text: commentText,
        }),
      });
    } catch (err) {
      // Remove optimistic comment on error
      setComments((c) => c.filter((comment) => comment.id !== tempComment.id));
      setNewComment(commentText);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: "La Crêperie des Saveurs",
      text: "Découvrez La Crêperie des Saveurs à Mamers ! 🥞",
      url: post.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(post.url);
      alert("Lien copié !");
    }
  };

  const handleWhatsAppShare = () => {
    if (!post) return;
    const text = encodeURIComponent(`Découvrez La Crêperie des Saveurs à Mamers ! 🥞 ${post.url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const getNetworkIcon = (network: string) => {
    if (network === "instagram") {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="px-4 mt-12">
        <div className="max-w-lg mx-auto text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <section className="px-4 mt-12">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold">📺 Actus en direct</h2>
          <p className="text-muted-foreground text-sm mt-1">
            La dernière publication de la Crêperie
          </p>
        </div>

        {/* Square Social Screen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Premium Caramel/Ivory Frame */}
          <div
            className="relative rounded-3xl p-1.5"
            style={{
              background:
                "linear-gradient(145deg, hsl(35 60% 75% / 0.8), hsl(32 65% 50% / 0.5), hsl(40 50% 80% / 0.7))",
              boxShadow:
                "0 0 50px -12px hsl(32 65% 45% / 0.35), 0 10px 40px -10px hsl(25 30% 15% / 0.18), inset 0 1px 0 hsl(45 60% 90% / 0.4)",
            }}
          >
            <div className="bg-card rounded-[20px] overflow-hidden shadow-inner">
              {/* Post Header - Like Instagram */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-gradient-to-r from-transparent via-butter/20 to-transparent">
                {getNetworkIcon(post.network)}
                <div className="flex-1">
                  <p className="font-semibold text-sm">La Crêperie des Saveurs</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(post.created_at)}</span>
                    <span>•</span>
                    <span className="capitalize">{post.network}</span>
                  </div>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  title="Ouvrir sur le réseau social"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>

              {/* Square Content Area (1:1) - Social Post Look */}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square relative group overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, hsl(42 55% 92%) 0%, hsl(35 45% 88%) 50%, hsl(40 50% 85%) 100%)"
                }}
              >
                {/* Decorative social media pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>

                {/* Network branding and content preview */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  {/* Large network icon */}
                  <div className="w-24 h-24 mb-6 opacity-25">
                    {post.network === "instagram" ? (
                      <svg className="w-full h-full text-espresso" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    ) : (
                      <svg className="w-full h-full text-espresso" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                  </div>

                  {/* Caption preview */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 max-w-[85%] shadow-soft">
                    <p className="text-espresso font-medium text-sm leading-relaxed line-clamp-3">
                      🥞 Découvrez notre dernière publication !
                      <br />
                      <span className="text-muted-foreground">Cliquez pour voir sur {post.network === "instagram" ? "Instagram" : "Facebook"}</span>
                    </p>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-all duration-300 flex items-center justify-center">
                  <motion.div 
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-elevated">
                      <ExternalLink className="w-8 h-8 text-primary" />
                    </div>
                  </motion.div>
                </div>
              </a>

              {/* Interaction Buttons - Like Instagram */}
              <div className="p-4 border-t border-border/30">
                <div className="flex items-center gap-1 mb-3">
                  {/* Like */}
                  <motion.button
                    onClick={handleLike}
                    disabled={hasLiked}
                    whileTap={{ scale: hasLiked ? 1 : 0.9 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                      hasLiked
                        ? "bg-red-50 text-red-500 border border-red-100"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-5 h-5 transition-all ${hasLiked ? "fill-current scale-110" : ""}`} />
                    <span className="text-sm font-medium">{likeCount > 0 ? likeCount : "J'aime"}</span>
                  </motion.button>

                  {/* Comment */}
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                      showComments
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {comments.length > 0 ? comments.length : "Commenter"}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all ml-auto"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Partager</span>
                  </button>
                </div>

                {/* Note */}
                <p className="text-xs text-muted-foreground/60 text-center">
                  Interactions enregistrées sur le site
                </p>
              </div>

              {/* Comments Section */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/30"
                  >
                    <div className="p-4 space-y-4">
                      {/* Comment Input */}
                      <div className="flex gap-2">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleComment()}
                          placeholder="Votre commentaire..."
                          className="flex-1"
                          maxLength={200}
                        />
                        <Button
                          onClick={handleComment}
                          disabled={!newComment.trim() || submitting}
                          size="icon"
                          className="flex-shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* WhatsApp share option */}
                      <button
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Partager sur WhatsApp
                      </button>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {comments.slice(0, 10).map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-secondary/50 rounded-xl px-4 py-3"
                          >
                            <p className="text-sm">{comment.comment_text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(comment.created_at)}
                            </p>
                          </motion.div>
                        ))}

                        {comments.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            Soyez le premier à commenter !
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Aidez-nous et partagez 👉
          </p>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button className="btn-hero">
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir la publication
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SocialWall;
