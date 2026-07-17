import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2, PartyPopper, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import confetti from "canvas-confetti";

const TYPES = [
  ["galette", "Galette", "🥞"],
  ["crepe", "Crêpe", "🍯"],
  ["milkshake", "Milkshake", "🥤"],
  ["smoothie", "Smoothie", "🍹"],
] as const;

type Proposal = Record<string, string | boolean | null>;

const SecretMenuUnlocked = ({ justUnlocked = false, isAdminAccess = false }: { justUnlocked?: boolean; isAdminAccess?: boolean }) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any).from("weekly_proposals_public").select("*").eq("is_active", true).order("week_start", { ascending: false }).limit(1).maybeSingle();
      if (!error && data) setProposal(data as Proposal);
      setLoading(false);
    };
    void load();
    if (justUnlocked) confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
  }, [justUnlocked]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-caramel" /></div>;
  if (!proposal || !TYPES.some(([type]) => proposal[`${type}_special`])) return <div className="rounded-3xl border bg-white/75 p-8 text-center text-muted-foreground">La prochaine proposition du moment arrive bientôt.</div>;

  const date = (value: unknown) => typeof value === "string" && value ? format(new Date(value), "dd MMM yyyy", { locale: fr }) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {justUnlocked && <div className="flex items-center justify-center gap-2 rounded-2xl bg-herb/10 p-3 font-black text-herb"><PartyPopper className="h-5 w-5" />Accès débloqué</div>}
      {isAdminAccess && <div className="rounded-xl bg-primary/10 p-2 text-center text-xs font-bold text-primary">Aperçu administrateur</div>}

      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-caramel/10 px-4 py-2 text-sm font-bold text-caramel"><Sparkles className="h-4 w-4" />Exclusif après le quiz</span>
        <h2 className="mt-3 font-display text-2xl font-black text-espresso">{String(proposal.menu_name || "Proposition du moment")}</h2>
        {(proposal.valid_from || proposal.valid_to) && <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{date(proposal.valid_from)}{proposal.valid_from && proposal.valid_to ? " → " : ""}{date(proposal.valid_to)}</p>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TYPES.map(([type, label, emoji]) => {
          const name = proposal[`${type}_special`];
          if (!name) return null;
          const image = proposal[`${type}_special_image_url`];
          const description = proposal[`${type}_special_description`];
          const price = proposal[`${type}_special_price`];
          return (
            <article key={type} className="overflow-hidden rounded-3xl border border-caramel/20 bg-white shadow-sm">
              {typeof image === "string" && image && <img src={image} alt={String(name)} className="aspect-[4/3] w-full object-cover" />}
              <div className="p-4">
                <p className="text-xs font-black uppercase tracking-wider text-caramel">{emoji} {label} du moment</p>
                <h3 className="mt-2 font-display text-xl font-black text-espresso">{String(name)}</h3>
                {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{String(description)}</p>}
                {price && <p className="mt-4 font-display text-2xl font-black text-primary">{String(price)} €</p>}
              </div>
            </article>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SecretMenuUnlocked;