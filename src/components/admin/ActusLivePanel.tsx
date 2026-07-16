import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  Instagram,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SocialPost {
  id: string;
  url: string;
  network: "instagram" | "facebook";
  is_visible: boolean;
  created_at: string;
}

type FilterKey = "all" | "visible" | "hidden" | "instagram" | "facebook";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ActusLivePanel = ({ adminPassword }: { adminPassword: string }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<"instagram" | "facebook">("instagram");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const callEdgeFunction = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-social-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, password: adminPassword, ...data }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Service indisponible");
    return result;
  }, [adminPassword]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callEdgeFunction("list");
      const next = Array.isArray(result.posts) ? result.posts : [];
      setPosts(next);
      setSelectedId((current) => current && next.some((post: SocialPost) => post.id === current) ? current : next[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [callEdgeFunction]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const detectNetwork = (url: string) => {
    const normalized = url.toLowerCase();
    if (normalized.includes("instagram.com")) return "instagram" as const;
    if (normalized.includes("facebook.com") || normalized.includes("fb.watch")) return "facebook" as const;
    return null;
  };

  const addPost = async () => {
    const url = newUrl.trim();
    if (!url) return;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      toast.error("Ajoute une URL complète commençant par https://");
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      toast.error("URL non valide");
      return;
    }

    const network = detectNetwork(url) || selectedNetwork;
    setActionLoading("create");
    try {
      await callEdgeFunction("create", { url, network });
      setNewUrl("");
      setSelectedNetwork(network);
      toast.success("Publication ajoutée");
      await loadPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVisibility = async (post: SocialPost) => {
    setActionLoading(post.id);
    try {
      await callEdgeFunction("update", { id: post.id, is_visible: !post.is_visible });
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_visible: !item.is_visible } : item));
      toast.success(post.is_visible ? "Publication masquée" : "Publication publiée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Modification impossible");
    } finally {
      setActionLoading(null);
    }
  };

  const deletePost = async (post: SocialPost) => {
    if (!window.confirm("Supprimer définitivement cette publication ?")) return;
    setActionLoading(post.id);
    try {
      await callEdgeFunction("delete", { id: post.id });
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setSelectedId((current) => current === post.id ? null : current);
      toast.success("Publication supprimée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesQuery = !needle || post.url.toLowerCase().includes(needle) || post.network.includes(needle);
      if (!matchesQuery) return false;
      if (filter === "visible") return post.is_visible;
      if (filter === "hidden") return !post.is_visible;
      if (filter === "instagram") return post.network === "instagram";
      if (filter === "facebook") return post.network === "facebook";
      return true;
    });
  }, [posts, query, filter]);

  const selected = posts.find((post) => post.id === selectedId) || null;
  const visibleCount = posts.filter((post) => post.is_visible).length;
  const hiddenCount = posts.length - visibleCount;
  const instagramCount = posts.filter((post) => post.network === "instagram").length;
  const facebookCount = posts.filter((post) => post.network === "facebook").length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-5 gap-2">
        <Metric label="Total" value={posts.length} />
        <Metric label="En ligne" value={visibleCount} />
        <Metric label="Masqués" value={hiddenCount} />
        <Metric label="Instagram" value={instagramCount} />
        <Metric label="Facebook" value={facebookCount} />
      </section>

      <section className="rounded-3xl border border-caramel/15 bg-white p-3 shadow-sm">
        <div className="grid gap-2 xl:grid-cols-[180px_minmax(0,1fr)_auto]">
          <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
            <button onClick={() => setSelectedNetwork("instagram")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-black ${selectedNetwork === "instagram" ? "bg-white text-espresso shadow-sm" : "text-muted-foreground"}`}><Instagram className="h-4 w-4" />Instagram</button>
            <button onClick={() => setSelectedNetwork("facebook")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-black ${selectedNetwork === "facebook" ? "bg-white text-espresso shadow-sm" : "text-muted-foreground"}`}><Facebook className="h-4 w-4" />Facebook</button>
          </div>
          <Input value={newUrl} onChange={(event) => setNewUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addPost(); }} placeholder="Colle l’URL de la publication…" className="h-11 rounded-xl" />
          <Button onClick={addPost} disabled={!newUrl.trim() || actionLoading === "create"} className="h-11 rounded-xl bg-caramel font-black text-white">
            {actionLoading === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" />Ajouter</>}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-caramel/15 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une publication…" className="h-10 rounded-xl pl-10" /></div>
          <div className="flex flex-wrap gap-1.5">
            {([['all','Tous'],['visible','En ligne'],['hidden','Masqués'],['instagram','Instagram'],['facebook','Facebook']] as const).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filter === value ? "bg-caramel text-white" : "bg-muted text-muted-foreground"}`}>{label}</button>)}
          </div>
          <Button variant="outline" size="sm" onClick={loadPosts} className="rounded-xl"><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
        </div>
      </section>

      <section className="grid min-h-[560px] overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-sm xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
        <div className="min-w-0 overflow-auto border-b xl:border-b-0 xl:border-r">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-butter/80 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur"><tr><th className="w-14 p-4">N°</th><th>Réseau</th><th>Publication</th><th>Statut</th><th>Date</th><th className="pr-4 text-right">Actions</th></tr></thead>
            <tbody>
              {filteredPosts.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Aucune publication pour ce filtre.</td></tr> : filteredPosts.map((post, index) => (
                <tr key={post.id} onClick={() => setSelectedId(post.id)} className={`cursor-pointer border-t transition hover:bg-butter/20 ${selectedId === post.id ? "bg-caramel/10" : ""}`}>
                  <td className="p-4 font-black text-espresso">{index + 1}</td>
                  <td><NetworkBadge network={post.network} /></td>
                  <td className="max-w-[420px]"><p className="truncate font-medium text-espresso">{post.url}</p></td>
                  <td><Status visible={post.is_visible} /></td>
                  <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(post.created_at)}</td>
                  <td className="pr-4"><div className="flex justify-end gap-1"><a href={post.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="rounded-lg p-2 hover:bg-muted"><ExternalLink className="h-4 w-4" /></a><button onClick={(event) => { event.stopPropagation(); void toggleVisibility(post); }} className="rounded-lg p-2 hover:bg-muted" title={post.is_visible ? "Masquer" : "Publier"}>{actionLoading === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : post.is_visible ? <EyeOff className="h-4 w-4 text-caramel" /> : <Eye className="h-4 w-4 text-herb" />}</button><button onClick={(event) => { event.stopPropagation(); void deletePost(post); }} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="bg-muted/10 p-4">
          {!selected ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sélectionne une publication</div> : <div className="space-y-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-caramel">Aperçu</p><h3 className="mt-1 font-display text-2xl font-black text-espresso">Publication sociale</h3></div>
            <div className="rounded-3xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><NetworkBadge network={selected.network} /><Status visible={selected.is_visible} /></div><p className="mt-4 break-all text-sm leading-relaxed text-muted-foreground">{selected.url}</p><p className="mt-4 text-xs text-muted-foreground">Ajoutée le {formatDate(selected.created_at)}</p></div>
            <div className="grid gap-2"><Button asChild className="rounded-xl"><a href={selected.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Ouvrir la publication</a></Button><Button variant="outline" onClick={() => void toggleVisibility(selected)} disabled={actionLoading === selected.id} className="rounded-xl">{selected.is_visible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{selected.is_visible ? "Masquer du site" : "Afficher sur le site"}</Button><Button variant="outline" onClick={() => void deletePost(selected)} disabled={actionLoading === selected.id} className="rounded-xl border-destructive/30 text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button></div>
          </div>}
        </aside>
      </section>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => <div className="rounded-xl border border-caramel/15 bg-white px-3 py-2 shadow-sm"><p className="font-display text-lg font-black leading-none text-espresso">{value}</p><p className="mt-1 truncate text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p></div>;
const NetworkBadge = ({ network }: { network: SocialPost['network'] }) => network === "instagram" ? <span className="inline-flex items-center gap-2 rounded-full bg-caramel/10 px-3 py-1 text-xs font-black text-caramel"><Instagram className="h-3.5 w-3.5" />Instagram</span> : <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary"><Facebook className="h-3.5 w-3.5" />Facebook</span>;
const Status = ({ visible }: { visible: boolean }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${visible ? "bg-herb/15 text-herb" : "bg-muted text-muted-foreground"}`}>{visible ? "En ligne" : "Masqué"}</span>;
const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default ActusLivePanel;
