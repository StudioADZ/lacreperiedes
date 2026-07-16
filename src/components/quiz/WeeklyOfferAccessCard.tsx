import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Loader2, LockOpen, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const WeeklyOfferAccessCard = () => {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase as any).rpc("get_or_create_weekly_offer_access_code");
      if (!error && typeof data === "string") setCode(data);
      setLoading(false);
    };
    void load();
  }, []);

  const accessUrl = useMemo(() => code ? `${window.location.origin}/carte?offer=${encodeURIComponent(code)}` : "", [code]);

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (loading) return <div className="flex justify-center rounded-3xl border bg-white/75 p-6"><Loader2 className="h-6 w-6 animate-spin text-caramel" /></div>;
  if (!code) return null;

  return (
    <section className="rounded-3xl border-2 border-caramel/25 bg-gradient-to-br from-white via-butter/25 to-caramel/10 p-5 text-center shadow-sm">
      <div className="mb-3 flex items-center justify-center gap-2"><LockOpen className="h-5 w-5 text-caramel" /><h2 className="font-display text-xl font-black text-espresso">Votre accès aux propositions</h2></div>
      <p className="mx-auto max-w-sm text-muted-foreground">Ce code et ce QR restent les mêmes pour votre compte, même après plusieurs participations.</p>
      <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4 shadow-sm"><QRCodeSVG value={accessUrl} size={164} level="M" includeMargin /></div>
      <p className="mt-4 font-mono text-2xl font-black tracking-[0.12em] text-primary">{code}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={copy} className="h-11 rounded-xl">{copied ? <CheckCircle2 className="mr-2 h-4 w-4 text-herb" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Code copié" : "Copier le code"}</Button>
        <Button asChild className="h-11 rounded-xl"><a href={accessUrl}><QrCode className="mr-2 h-4 w-4" />Voir les propositions</a></Button>
      </div>
    </section>
  );
};

export default WeeklyOfferAccessCard;
