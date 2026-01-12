import { useState, useEffect } from "react";
import { ExternalLink, Heart, MessageCircle, Share2, Loader2, Send } from "lucide-react";
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
        // Fetch latest visible post (Instagram priority)
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

  const getNetworkIcon = (network: string) => {
    if (network === "instagram") {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
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
            Notre dernière publication — aidez-nous à la faire circuler 🙏
          </p>
        </div>

        {/* Square Social Screen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Premium Frame */}
          <div
            className="relative rounded-3xl p-1"
            style={{
              background:
                "linear-gradient(135deg, hsl(35 60% 70% / 0.6), hsl(32 65% 45% / 0.4), hsl(35 60% 70% / 0.6))",
              boxShadow:
                "0 0 40px -10px hsl(32 65% 45% / 0.3), 0 8px 30px -8px hsl(25 30% 15% / 0.15)",
            }}
          >
            <div className="bg-card rounded-[22px] overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                {getNetworkIcon(post.network)}
                <div className="flex-1">
                  <p className="font-semibold text-sm">La Crêperie des Saveurs</p>
                  <p className="text-xs text-muted-foreground capitalize">{post.network}</p>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>

              {/* Square Content Area (1:1) */}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square bg-gradient-to-br from-butter/50 to-caramel/20 relative group"
              >
                {/* Placeholder content - shows network branding */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 mb-4 opacity-30">
                    {post.network === "instagram" ? (
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    ) : (
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Voir la publication
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2 max-w-[200px] truncate">
                    {post.url}
                  </p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </a>

              {/* Interaction Buttons */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-1">
                  {/* Like */}
                  <button
                    onClick={handleLike}
                    disabled={hasLiked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      hasLiked
                        ? "bg-destructive/10 text-destructive"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
                    <span className="text-sm font-medium">{likeCount || "J'aime"}</span>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      showComments
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {comments.length || "Commenter"}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all ml-auto"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Partager</span>
                  </button>
                </div>

                {/* Note */}
                <p className="text-xs text-muted-foreground/60 text-center mt-3">
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
                    className="overflow-hidden border-t border-border/50"
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
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {comments.slice(0, 10).map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-secondary/50 rounded-xl px-4 py-3"
                          >
                            <p className="text-sm">{comment.comment_text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(comment.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
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
