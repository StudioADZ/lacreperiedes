import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface SocialPost {
  id: string;
  url: string;
  network: "instagram" | "facebook";
  is_visible: boolean;
  created_at: string;
}

interface ActusPanelProps {
  adminPassword: string;
}

const ActusPanel = ({ adminPassword }: ActusPanelProps) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data as SocialPost[]);
      }
    } catch (err) {
      console.log("Could not fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const detectNetwork = (url: string): "instagram" | "facebook" | null => {
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("facebook.com")) return "facebook";
    return null;
  };

  const handleAddPost = async () => {
    if (!newUrl.trim()) return;

    const network = detectNetwork(newUrl);
    if (!network) {
      setError("URL doit être Instagram ou Facebook");
      return;
    }

    setAddLoading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("social_posts")
        .insert({
          url: newUrl.trim(),
          network,
          is_visible: true,
        });

      if (error) throw error;

      setNewUrl("");
      fetchPosts();
    } catch (err) {
      setError("Erreur lors de l'ajout");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from("social_posts")
        .update({ is_visible: !currentVisibility })
        .eq("id", id);

      if (!error) {
        setPosts(posts.map(p => p.id === id ? { ...p, is_visible: !currentVisibility } : p));
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce post ?")) return;

    try {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);

      if (!error) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new post */}
      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Ajouter un lien de post</Label>
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://instagram.com/p/... ou facebook.com/..."
            className={error ? "border-destructive" : ""}
          />
          <Button onClick={handleAddPost} disabled={addLoading || !newUrl.trim()}>
            {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          Collez un lien Instagram ou Facebook
        </p>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        <Label className="font-semibold">Posts ({posts.length})</Label>
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`card-warm flex items-center gap-3 ${!post.is_visible ? "opacity-50" : ""}`}
            >
              <div className="flex-shrink-0">
                {post.network === "instagram" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{post.network}</p>
                <p className="text-xs text-muted-foreground truncate">{post.url}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>

                <button
                  onClick={() => handleToggleVisibility(post.id, post.is_visible)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title={post.is_visible ? "Masquer" : "Afficher"}
                >
                  {post.is_visible ? (
                    <Eye className="w-4 h-4 text-herb" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun post ajouté
          </p>
        )}
      </div>
    </div>
  );
};

export default ActusPanel;
