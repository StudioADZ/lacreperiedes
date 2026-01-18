import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface SocialPost {
  id: string;
  url: string;
  network: "instagram" | "facebook";
  is_visible: boolean;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ActusPanelProps {
  adminPassword: string; // (conservé pour compat, non utilisé ici)
}

const ActusPanel = ({ adminPassword }: ActusPanelProps) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshLoading, setRefreshLoading] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authHeaders = useMemo(
    () => ({
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    }),
    []
  );

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const detectNetwork = (url: string): "instagram" | "facebook" | null => {
    const u = url.toLowerCase();
    if (u.includes("instagram.com")) return "instagram";
    if (u.includes("facebook.com")) return "facebook";
    return null;
  };

  const isValidHttpUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const fetchPosts = useCallback(async (opts?: { silent?: boolean }) => {
    const controller = new AbortController();

    if (!opts?.silent) setLoading(true);
    else setRefreshLoading(true);

    clearMessages();

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/social_posts?order=created_at.desc`, {
        headers: authHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer les posts");
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Erreur de chargement");
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let aborter: any = null;
    (async () => {
      aborter = await fetchPosts();
    })();
    return () => {
      if (typeof aborter === "function") aborter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPost = async () => {
    clearMessages();

    const url = newUrl.trim();
    if (!url) return;

    if (!isValidHttpUrl(url)) {
      setError("URL invalide (doit commencer par http:// ou https://)");
      return;
    }

    const network = detectNetwork(url);
    if (!network) {
      setError("URL doit être Instagram ou Facebook");
      return;
    }

    setAddLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/social_posts`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          url,
          network,
          is_visible: true,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout");

      setNewUrl("");
      setNotice("Post ajouté ✅");
      await fetchPosts({ silent: true });
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'ajout");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    clearMessages();

    // Optimistic UI
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_visible: !currentVisibility } : p)));

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/social_posts?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ is_visible: !currentVisibility }),
      });

      if (!response.ok) throw new Error("Erreur de mise à jour");

      setNotice(!currentVisibility ? "Affiché ✅" : "Masqué ✅");
    } catch (err: any) {
      // Revert
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_visible: currentVisibility } : p)));
      setError(err?.message || "Erreur lors du changement de visibilité");
    }
  };

  const handleDelete = async (id: string) => {
    clearMessages();

    if (!confirm("Supprimer ce post ?")) return;

    const snapshot = posts;
    setPosts((prev) => prev.filter((p) => p.id !== id));

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/social_posts?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) throw new Error("Erreur de suppression");

      setNotice("Supprimé ✅");
    } catch (err: any) {
      setPosts(snapshot);
      setError(err?.message || "Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" aria-live="polite">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {(error || notice) && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2 ${
            error ? "bg-destructive/5 border-destructive/20" : "bg-herb/5 border-herb/20"
          }`}
          aria-live="polite"
        >
          <AlertCircle className={`w-4 h-4 mt-0.5 ${error ? "text-destructive" : "text-herb"}`} />
          <p className={`text-xs ${error ? "text-destructive" : "text-herb"}`}>{error || notice}</p>
        </div>
      )}

      {/* Add new post */}
      <div className="card-warm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Label className="font-semibold">Ajouter un lien de post</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPosts({ silent: true })}
            disabled={refreshLoading}
          >
            {refreshLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Actualiser
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://instagram.com/... ou https://facebook.com/..."
            className={error ? "border-destructive" : ""}
            onFocus={() => setNotice("")}
          />
          <Button onClick={handleAddPost} disabled={addLoading || !newUrl.trim()}>
            {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">Collez un lien Instagram ou Facebook (http/https).</p>
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
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
                  aria-label="Ouvrir le post"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>

                <button
                  onClick={() => handleToggleVisibility(post.id, post.is_visible)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title={post.is_visible ? "Masquer" : "Afficher"}
                  type="button"
                >
                  {post.is_visible ? <Eye className="w-4 h-4 text-herb" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  aria-label="Supprimer le post"
                  type="button"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {posts.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun post ajouté</p>}
      </div>
    </div>
  );
};

export default ActusPanel;
