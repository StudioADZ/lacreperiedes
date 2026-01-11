import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Gift, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Quiz = () => {
  const [isStarted, setIsStarted] = useState(false);

  // Mock stock data - will be replaced with real data from backend
  const stockData = {
    formuleComplete: { total: 10, remaining: 7 },
    galette: { total: 20, remaining: 15 },
    crepe: { total: 30, remaining: 22 },
  };

  const StockIndicator = ({ label, remaining, total, emoji }: { label: string; remaining: number; total: number; emoji: string }) => {
    const percentage = (remaining / total) * 100;
    const isLow = remaining <= 3;
    
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{label}</span>
            {isLow && <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">🔥 Populaire</span>}
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'Épuisé'}
          </p>
        </div>
      </div>
    );
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              🎯 Quiz Hebdomadaire
            </span>
            <h1 className="font-display text-3xl font-bold mb-3">
              Testez vos connaissances !
            </h1>
            <p className="text-muted-foreground">
              Répondez à 10 questions et gagnez des crêpes gratuites
            </p>
          </div>

          {/* Rules */}
          <div className="card-warm mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-caramel" />
              Comment ça marche ?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">1</span>
                <span>Répondez à <strong>10 questions</strong> sur la culture crêpière et générale</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">2</span>
                <span>Obtenez votre score et découvrez votre lot</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">3</span>
                <span>Présentez votre QR code au restaurant pour récupérer votre gain</span>
              </li>
            </ul>
          </div>

          {/* Prizes */}
          <div className="card-warm mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-herb" />
              Les lots à gagner
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-caramel/10 to-caramel/5 border border-caramel/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium">Formule Complète</p>
                    <p className="text-xs text-muted-foreground">100% de bonnes réponses</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <p className="font-medium">Une Galette</p>
                    <p className="text-xs text-muted-foreground">90-99% de bonnes réponses</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥉</span>
                  <div>
                    <p className="font-medium">Une Crêpe</p>
                    <p className="text-xs text-muted-foreground">80-89% de bonnes réponses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="card-warm mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-terracotta" />
              Stock de la semaine
            </h2>
            <div className="space-y-3">
              <StockIndicator label="Formule Complète" remaining={stockData.formuleComplete.remaining} total={stockData.formuleComplete.total} emoji="🏆" />
              <StockIndicator label="Galette" remaining={stockData.galette.remaining} total={stockData.galette.total} emoji="🥈" />
              <StockIndicator label="Crêpe" remaining={stockData.crepe.remaining} total={stockData.crepe.total} emoji="🥉" />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Nouvelle semaine chaque dimanche à minuit
            </p>
          </div>

          {/* Start Button */}
          <Button 
            className="w-full btn-hero text-lg py-6 group"
            onClick={() => setIsStarted(true)}
          >
            <span>Commencer le Quiz</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            1 participation gagnante max par semaine et par personne
          </p>
        </div>
      </div>
    );
  }

  // Quiz in progress - placeholder for now
  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">Quiz en cours de configuration</h2>
          <p className="text-muted-foreground mb-6">
            Le système de quiz nécessite une base de données pour fonctionner. 
            Activez Lovable Cloud pour continuer.
          </p>
          <Button variant="outline" onClick={() => setIsStarted(false)}>
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
