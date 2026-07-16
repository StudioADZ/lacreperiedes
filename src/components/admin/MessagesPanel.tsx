import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
type Status = "new" | "in_progress" | "replied" | "archived";
type Channel = "email" | "phone" | "sms" | "whatsapp" | "other";

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  admin_status?: Status;
  admin_reply?: string | null;
  replied_at?: string | null;
  reply_channel?: Channel | null;
  admin_updated_at?: string | null;
}

const statusLabel: Record<Status, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  replied: "Répondu",
  archived: "Archivé",
};

const makeRobotReply = (message: Message) => {
  const text = `${message.subject || ""} ${message.message}`.toLowerCase();
  const firstName = message.sender_name?.trim().split(/\s+/)[0] || "";
  const hello = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  let body = "Merci pour votre message. Nous l’avons bien reçu et nous revenons vers vous rapidement avec les informations nécessaires.";
  if (/réserv|table|place|horaire/.test(text)) body = "Merci pour votre demande. Pour confirmer au mieux votre venue, vous pouvez réserver directement en ligne ou nous appeler au 02 59 66 01 76. Nous sommes ouverts tous les jours de 12h à 22h en continu.";
  else if (/menu|carte|galette|crêpe|allerg|sans gluten/.test(text)) body = "Merci pour votre message. Nous allons vérifier votre demande avec la cuisine afin de vous proposer la solution la plus adaptée. Vous pouvez également consulter notre carte en ligne avant votre venue.";
  else if (/groupe|anniversaire|événement|privatis/.test(text)) body = "Merci de penser à La Crêperie des Saveurs pour votre événement. Nous allons étudier votre demande et revenir vers vous avec une proposition adaptée au nombre de personnes et à la date souhaitée.";
  else if (/réclamation|déçu|problème|erreur|rembours/.test(text)) body = "Merci de nous avoir signalé cette situation. Nous sommes désolés pour ce désagrément et souhaitons comprendre précisément ce qui s’est passé afin de vous apporter une réponse sérieuse et rapide.";
  return `${hello}\n\n${body}\n\nBien cordialement,\nL’équipe de La Crêperie des Saveurs`;
};

const MessagesPanel = ({ adminPassword }: { adminPassword: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [reply, setReply] = useState("");
  const [channel, setChannel] = useState<Channel>("email");

  const request = async (payload: Record<string, unknown>) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Service de messagerie indisponible");
    return data;
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await request({ action: "list" });
      setMessages(data.messages || []);
      setSelectedId((current) => current || data.messages?.[0]?.id || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMessages(); }, []);

  const selected = messages.find((message) => message.id === selectedId) || null;
  useEffect(() => {
    if (selected) {
      setReply(selected.admin_reply || "");
      setChannel(selected.reply_channel || (selected.sender_email ? "email" : selected.sender_phone ? "phone" : "other"));
    }
  }, [selectedId]);

  const counts = useMemo(() => ({
    new: messages.filter((m) => (m.admin_status || (m.is_read ? "in_progress" : "new")) === "new").length,
    in_progress: messages.filter((m) => m.admin_status === "in_progress").length,
    replied: messages.filter((m) => m.admin_status === "replied").length,
  }), [messages]);

  const filtered = useMemo(() => messages.filter((m) => {
    const status = m.admin_status || (m.is_read ? "in_progress" : "new");
    const haystack = `${m.sender_name} ${m.sender_email || ""} ${m.subject || ""} ${m.message}`.toLowerCase();
    return (filter === "all" || status === filter) && haystack.includes(query.toLowerCase());
  }), [messages, filter, query]);

  const update = async (status: Status, extra: Record<string, unknown> = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await request({ action: "update", messageId: selected.id, status, reply, channel, ...extra });
      setMessages((items) => items.map((item) => item.id === selected.id ? data.message : item));
      toast.success(status === "replied" ? "Réponse enregistrée dans le suivi" : "Suivi mis à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const copyReply = async () => {
    await navigator.clipboard.writeText(reply);
    toast.success("Réponse copiée");
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-caramel" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["À traiter", counts.new, Inbox],
          ["En cours", counts.in_progress, Clock3],
          ["Répondus", counts.replied, CheckCircle2],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-caramel/15 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-muted-foreground">{String(label)}</span><Icon className="h-4 w-4 text-caramel" /></div>
            <div className="mt-2 font-display text-3xl font-black text-espresso">{String(value)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-caramel/15 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un client, un sujet ou un message" className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "new", "in_progress", "replied", "archived"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === value ? "bg-caramel text-white" : "bg-muted text-muted-foreground hover:bg-caramel/10"}`}>{value === "all" ? "Tous" : statusLabel[value]}</button>)}
          </div>
          <Button variant="outline" onClick={loadMessages} className="shrink-0"><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
        </div>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-caramel/15 bg-white shadow-warm lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-caramel/10 bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="max-h-[620px] overflow-y-auto p-2">
            {filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Aucun message dans cette vue.</div> : filtered.map((msg) => {
              const status = msg.admin_status || (msg.is_read ? "in_progress" : "new");
              return <button key={msg.id} onClick={() => setSelectedId(msg.id)} className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${selectedId === msg.id ? "border-caramel bg-butter/25" : "border-transparent bg-white hover:border-caramel/15"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-black text-espresso">{msg.sender_name}</p><p className="truncate text-xs font-semibold">{msg.subject || "Sans objet"}</p></div><span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{statusLabel[status]}</span></div><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{msg.message}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString("fr-FR")}</p></button>;
            })}
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-5">
          {!selected ? <div className="flex h-full items-center justify-center text-muted-foreground"><MessageSquareText className="mr-2 h-5 w-5" />Sélectionne un message</div> : <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><User className="h-4 w-4 text-caramel" /><h2 className="font-display text-xl font-black text-espresso">{selected.sender_name}</h2></div><p className="mt-1 text-sm font-semibold">{selected.subject || "Sans objet"}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">{selected.sender_email && <a className="flex items-center gap-1 hover:text-caramel" href={`mailto:${selected.sender_email}`}><Mail className="h-3.5 w-3.5" />{selected.sender_email}</a>}{selected.sender_phone && <a className="flex items-center gap-1 hover:text-caramel" href={`tel:${selected.sender_phone}`}><Phone className="h-3.5 w-3.5" />{selected.sender_phone}</a>}</div></div><Button variant="outline" onClick={() => void update("archived")}><Archive className="mr-2 h-4 w-4" />Archiver</Button></div>

            <div className="rounded-2xl border bg-muted/25 p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p></div>

            <div className="rounded-3xl border border-caramel/20 bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-4 text-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-black"><Bot className="h-5 w-5 text-butter" />Robot de réponse</div><p className="mt-1 text-xs text-white/65">Prépare une réponse. Tu gardes toujours la validation finale.</p></div><Button onClick={() => { setReply(makeRobotReply(selected)); void update("in_progress", { reply: makeRobotReply(selected) }); }} className="bg-butter font-black text-espresso hover:bg-butter/90"><Sparkles className="mr-2 h-4 w-4" />Générer</Button></div>
            </div>

            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Écris ou génère ta réponse…" className="min-h-44 rounded-2xl" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="email">E-mail</option><option value="phone">Téléphone</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="other">Autre</option></select><Button variant="outline" onClick={copyReply} disabled={!reply}><Copy className="mr-2 h-4 w-4" />Copier</Button>{selected.sender_email && <Button asChild variant="outline" disabled={!reply}><a href={`mailto:${selected.sender_email}?subject=${encodeURIComponent(selected.subject || "Réponse de La Crêperie des Saveurs")}&body=${encodeURIComponent(reply)}`}><Mail className="mr-2 h-4 w-4" />Ouvrir l’e-mail</a></Button>}<Button className="sm:ml-auto bg-herb text-white" onClick={() => void update("replied")} disabled={saving || !reply}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />Marquer comme répondu</>}</Button></div>
            {selected.replied_at && <p className="text-xs text-muted-foreground">Dernière réponse confirmée le {new Date(selected.replied_at).toLocaleString("fr-FR")} via {selected.reply_channel || "canal non précisé"}.</p>}
          </div>}
        </section>
      </div>
    </motion.div>
  );
};

export default MessagesPanel;
