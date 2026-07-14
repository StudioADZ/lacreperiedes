import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Calendar, CheckCircle2, Copy, ExternalLink, Gift, Mail, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface QuizWinnerPremiumProps {
  firstName: string;
  email: string;
  phone: string;
  prize: string;
  prizeCode: string;
  secretCode?: string | null;
  onPlayAgain: () => void;
}

const QuizWinnerPremium = ({ firstName, email, phone, prize, prizeCode, onPlayAgain }: QuizWinnerPremiumProps) => {
  const confettiRef = useRef(false);
  const [copyOk, setCopyOk] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const isFormuleComplete = prize.toLowerCase().includes("formule");

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    confetti({ particleCount: 140, spread: 95, origin: { y: 0.55 } });
  }, []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(prizeCode);
    setCopyOk(true);
    window.setTimeout(() => setCopyOk(false), 1800);
  };

  const sendEmail = async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-prize-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, email, phone, prize, prizeCode }),
    });
    if (response.ok) setEmailSent(true);
  };

  const sendWhatsApp = () => {
    const message = encodeURIComponent(
      `J'ai gagné au Quiz de La Crêperie des Saveurs !\n\nLot : ${prize}\nCode caisse : ${prizeCode}\n\nCe code est aussi conservé dans mon espace client.`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <section className="card-quiz-hero rounded-3xl border-2 border-caramel/40 py-8 text-center">
        <span className="inline-flex rounded-full border border-herb/30 bg-herb/10 px-5 py-2 font-black text-herb">🏆 GAGNÉ !</span>
        <h1 className="mt-4 font-display text-3xl font-black">Félicitations {firstName} !</h1>
        <p className="mt-2 text-muted-foreground">Votre récompense est enregistrée dans votre espace client.</p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-caramel/30 bg-caramel/10 px-6 py-4">
          <Gift className="h-6 w-6 text-caramel" />
          <strong className="font-display text-2xl text-primary">{prize}</strong>
        </div>
      </section>

      <section className="card-warm border-2 border-primary/25 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Votre code gagnant</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Présentez ce code à la caisse. Il est nominatif, associé à votre compte et valable 7 jours.</p>
        <div className="rounded-2xl border-2 border-primary/25 bg-primary/10 p-5">
          <p className="font-mono text-4xl font-black tracking-[0.16em] text-primary">{prizeCode}</p>
          <Button variant="outline" size="sm" onClick={copyCode} className="mt-4 gap-2">
            {copyOk ? <CheckCircle2 className="h-4 w-4 text-herb" /> : <Copy className="h-4 w-4" />}
            {copyOk ? "Code copié" : "Copier le code"}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={sendEmail} disabled={emailSent}>
          <Mail className="mr-2 h-5 w-5" />{emailSent ? "Email envoyé" : "Recevoir aussi par email"}
        </Button>
        <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={sendWhatsApp}>
          <MessageCircle className="mr-2 h-5 w-5" />Partager sur WhatsApp
        </Button>
        <a href="https://g.page/r/CVTqauGmET0TEAE/preview" target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="h-12 w-full rounded-2xl"><Star className="mr-2 h-5 w-5 text-caramel" />Laisser un avis Google<ExternalLink className="ml-2 h-4 w-4" /></Button>
        </a>
        {isFormuleComplete && (
          <a href="/reserver" className="block"><Button className="h-12 w-full rounded-2xl"><Calendar className="mr-2 h-5 w-5" />Réserver une table</Button></a>
        )}
        <Button variant="ghost" className="w-full" onClick={onPlayAgain}>Rejouer pour le plaisir</Button>
      </section>
    </motion.div>
  );
};

export default QuizWinnerPremium;
