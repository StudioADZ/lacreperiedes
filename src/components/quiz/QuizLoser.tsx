import { motion } from "framer-motion";
import { Clock, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizLoserProps {
  firstName: string;
  email: string;
  phone: string;
  score?: number;
  secretCode?: string | null;
  stockRemaining: {
    formule_complete_remaining: number;
    galette_remaining: number;
    crepe_remaining: number;
  };
  onPlayAgain: () => void;
}

const QuizLoser = ({ firstName, score, stockRemaining, onPlayAgain }: QuizLoserProps) => {
  const totalRemaining = stockRemaining.formule_complete_remaining + stockRemaining.galette_remaining + stockRemaining.crepe_remaining;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="card-warm py-8 text-center">
        <div className="mb-4 text-6xl">😊</div>
        <h1 className="font-display text-3xl font-black">Bien joué {firstName} !</h1>
        {score !== undefined && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2">
            <span className="text-sm font-medium">Votre score</span>
            <strong className="text-2xl text-primary">{score}/10</strong>
          </div>
        )}
        <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
          Cette fois, le score n’atteint pas le seuil gagnant. Votre participation reste enregistrée dans votre espace client.
        </p>
      </section>

      <section className="rounded-3xl border border-caramel/20 bg-white/75 p-5 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold">Lots encore disponibles cette semaine</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-butter/35 p-3"><strong className="text-xl text-herb">{stockRemaining.formule_complete_remaining}</strong><p className="text-xs text-muted-foreground">Formules</p></div>
          <div className="rounded-xl bg-butter/35 p-3"><strong className="text-xl text-herb">{stockRemaining.galette_remaining}</strong><p className="text-xs text-muted-foreground">Galettes</p></div>
          <div className="rounded-xl bg-butter/35 p-3"><strong className="text-xl text-herb">{stockRemaining.crepe_remaining}</strong><p className="text-xs text-muted-foreground">Crêpes</p></div>
        </div>
      </section>

      <Button onClick={onPlayAgain} variant="outline" className="h-14 w-full rounded-2xl" disabled={totalRemaining <= 0}>
        <RefreshCw className="mr-2 h-5 w-5" />
        {totalRemaining > 0 ? "Rejouer pour le plaisir" : "Lots épuisés cette semaine"}
      </Button>

      <a href="https://g.page/r/CVTqauGmET0TEAE/preview" target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="outline" className="h-12 w-full rounded-2xl"><Star className="mr-2 h-5 w-5 text-caramel" />Laisser un avis Google</Button>
      </a>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />Un gain maximum par compte et par semaine
      </div>
    </motion.div>
  );
};

export default QuizLoser;
