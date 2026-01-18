import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Radio,
  Crop,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
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

interface ActusLivePanelProps {
  adminPassword: string;
}

const LS_CROP_KEY = "actus_force_square_crop_v1";

const ActusLivePanel = ({ adminPassword }: ActusLivePanelProps) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [newUrl, setNewUrl] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<"instagram" | "facebook">("instagram");

  const [addLoading, setAddLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const [forceSquareCrop, setForceSquareCrop] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LS_CROP_KEY);
      return raw ? raw === "1" : true;
    } catch {
      return true;
    }
  });

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  // --- Helpers
  const normalizeUrl = (url: string) => url.trim();

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

  const callEdgeFunction = useCallback(
    async (action: string, data: Record<string, unknown> = {}, signal?: AbortSignal) => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-social-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          action,
          password: adminPassword,
          ...data,
        }),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const msg = payload?.error || payload?.message || "Request failed";
        throw new Error(msg);
      }

      return payload;
    },
    [adminPassword]
  );

  const fetchPosts = useCallback(
    async (opts?: { silent?: boolean }) => {
      const controller = new AbortController();

      if (!opts?.silent) {
        setLoading(true);
      } else {
        setRefreshLoading(true);
      }

      clearMessages();

      try {
        const result = await callEdgeFunction("list", {}, controller.signal);
        const list: SocialPost[] = Array.isArray(result?.posts) ? result.posts : [];
        setPosts(list);
      } catch (err: any) {
        // UI safe: show error but don't crash
        setError(err?.message || "Impossible de récupérer les posts.");
      } finally {
        if (!opts?.silent) setLoading(false);
        setRefreshLoading(false);
      }

      return () => controller.abort();
    },
    [callEdgeFunction]
  );

  // Initial load
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

  // Persist crop option (UI only)
  useEffect(() => {
    try {
      localStorage.setItem(LS_CROP_KEY, forceSquareCrop ? "1" : "0");
    } catch {
      // ignore
    }
  }, [forceSquareCrop]);

  // --- Derived state: "latest live" = newest visible post
  const latestPost = useMemo(() => {
    const visibles = posts.filter((p) => p.is_visible);
    if (visibles.length === 0) return null;

    // pick newest created_at
    return visibles
      .slice()
      .sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0))[0];
  }, [posts]);

  // --- Actions
  const handleAddPost = async () => {
    clearMessages();

    const url = normalizeUrl(newUrl);
    if (!url) return;

    if (!isValidHttpUrl(url)) {
      setError("URL invalide (doit commencer par http:// ou https://)");
      return;
    }

    const detectedNetwork = detectNetwork(url);
    const network = detectedNetwork || selectedNetwork;

    setAddLoading(true);

    try {
      await callEdgeFunction("create", { url, network });
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

    // Optimistic UI (safe) — revert on error
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, is_visible: !currentVisibility } : p)));

    try {
      await callEdgeFunction("update", {
        id,
        is_visible: !currentVisibility,
      });
      setNotice(!currentVisibility ? "Affiché ✅" : "Masqué ✅");
    } catch (err: any) {
      // revert
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
      await callEdgeFunction("delete", { id });
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
      {/* Header */}
      <div className="text-center p-4 rounded-xl bg-gradient-to-r from-caramel/10 via-butter/20 to-caramel/10 border border-caramel/20">
        <h2 className="font-display text-xl font-bold flex items-center justify-center gap-2">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          ACTUS LIVE
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Contrôlez ce qui s'affiche sur la page d'accueil
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
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
      </div>

      {/* Messages */}
      {(error || notice) && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2 ${
            error ? "bg-destructive/5 border-destructive/20" : "bg-herb/5 border-herb/20"
          }`}
          aria-live="polite"
        >
          <AlertCircle className={`w-4 h-4 mt-0.5 ${error ? "text-destructive" : "text-herb"}`} />
          <p className={`text-xs ${error ? "text-destructive" : "text-herb"}`}>
            {error || notice}
          </p>
        </div>
      )}

      {/* Current Live Post Preview */}
      {latestPost && (
        <div className="card-glow">
          <Label className="mb-3 block font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Post actuellement en direct
          </Label>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            {latestPost.network === "instagram" ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium capitalize">{latestPost.network}</p>
              <p className="text-xs text-muted-foreground truncate">{latestPost.url}</p>
            </div>

            <a
              href={latestPost.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Ouvrir le post"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3">
            “EN DIRECT” correspond au post visible le plus récent (si plusieurs sont visibles).
          </p>
        </div>
      )}

      {/* Source Selector */}
      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Source prioritaire</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedNetwork("instagram")}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selectedNetwork === "instagram" ? "border-pink-400 bg-pink-50" : "border-border hover:border-pink-200"
            }`}
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
              </svg>
            </div>
            <span className="font-medium">Instagram</span>
          </button>

          <button
            onClick={() => setSelectedNetwork("facebook")}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selectedNetwork === "facebook" ? "border-blue-400 bg-blue-50" : "border-border hover:border-blue-200"
            }`}
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <span className="font-medium">Facebook</span>
          </button>
        </div>
      </div>

      {/* Add new post */}
      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Ajouter un post (URL)</Label>
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
        <p className="text-xs text-muted-foreground mt-2">Le réseau sera détecté automatiquement depuis l'URL.</p>
      </div>

      {/* Options */}
      <div className="card-warm">
        <Label className="mb-3 block font-semibold">Options d'affichage</Label>

        <button
          onClick={() => setForceSquareCrop((v) => !v)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            forceSquareCrop ? "border-primary bg-primary/5" : "border-border"
          }`}
          type="button"
        >
          <div className="flex items-center gap-3">
            <Crop className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">Format carré (1:1)</p>
              <p className="text-xs text-muted-foreground">Option UI (stockée localement sur cet appareil)</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${forceSquareCrop ? "bg-primary" : "bg-border"}`}>
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                forceSquareCrop ? "translate-x-4" : "translate-x-0.5"
              } translate-y-0.5`}
            />
          </div>
        </button>

        <button
          className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-accent mt-3 transition-all opacity-50 cursor-not-allowed"
          disabled
          type="button"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-accent" />
            <div className="text-left">
              <p className="font-medium">Dernier post automatique</p>
              <p className="text-xs text-muted-foreground">Meta API non connectée</p>
            </div>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded">Bientôt</span>
        </button>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        <Label className="font-semibold">Tous les posts ({posts.length})</Label>

        <AnimatePresence mode="popLayout">
          {posts.map((post) => {
            const isLive = latestPost?.id === post.id;

            return (
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
                  <p className="text-sm font-medium capitalize flex items-center gap-2">
                    {post.network}
                    {isLive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">EN DIRECT</span>}
                  </p>
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
                    type="button"
                    aria-label="Supprimer le post"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {posts.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun post ajouté</p>}
      </div>
    </div>
  );
};

export default ActusLivePanel;
