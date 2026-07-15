import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserData } from "@/hooks/useUserMemory";

type QuizLegalData = {
  firstName: string;
  email: string;
  phone: string;
  rgpdConsent: boolean;
  rulesAccepted: boolean;
  ageConfirmed: boolean;
};

interface QuizPreFormProps {
  onSubmit: (data: QuizLegalData) => void;
  isLoading: boolean;
  error?: string;
  savedData?: UserData | null;
  score?: number;
}

const QuizPreForm = ({ onSubmit, isLoading, error, savedData, score }: QuizPreFormProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!savedData) return;
    setFirstName(savedData.firstName || "");
    setEmail(savedData.email || "");
    setPhone(savedData.phone || "");
  }, [savedData]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (firstName.trim().length < 2) nextErrors.firstName = "Prénom requis (minimum 2 caractères)";
    if (!email.trim()) nextErrors.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Email invalide";
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone.trim()) nextErrors.phone = "Téléphone requis";
    else if (phoneDigits.length < 10) nextErrors.phone = "Numéro de téléphone invalide";
    if (!ageConfirmed) nextErrors.ageConfirmed = "Vous devez certifier avoir 18 ans révolus";
    if (!rulesAccepted) nextErrors.rulesAccepted = "Vous devez accepter le règlement du quiz";
    if (!rgpdConsent) nextErrors.rgpdConsent = "Vous devez accepter le traitement nécessaire de vos données";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({ firstName: firstName.trim(), email: email.trim(), phone: phone.trim(), rgpdConsent, rulesAccepted, ageConfirmed });
  };

  return (
    <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="card-warm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="mb-2 font-display text-2xl font-bold">Avant d’afficher votre résultat</h2>
        <p className="mb-4 text-muted-foreground">Confirmez vos coordonnées et les conditions de participation.</p>
        {score !== undefined && (
          <div className="inline-flex items-center gap-2 rounded-full border border-herb/30 bg-gradient-to-r from-herb/10 to-butter/20 px-4 py-2">
            <span className="text-sm font-medium">Score enregistré :</span>
            <span className="text-2xl font-bold text-herb">{score}</span>
            <span className="text-muted-foreground">/10</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card-warm space-y-4" noValidate>
        <Field label="Prénom" error={errors.firstName}>
          <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Votre prénom" autoComplete="given-name" className={errors.firstName ? "border-destructive" : ""} aria-invalid={Boolean(errors.firstName)} />
        </Field>
        <Field label="Email du compte" error={errors.email}>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@email.com" autoComplete="email" className={errors.email ? "border-destructive" : ""} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Téléphone" error={errors.phone}>
          <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="06 12 34 56 78" autoComplete="tel" inputMode="tel" className={errors.phone ? "border-destructive" : ""} aria-invalid={Boolean(errors.phone)} />
          <p className="mt-1 text-xs text-muted-foreground">Utilisé uniquement pour identifier le bénéficiaire et gérer un éventuel gain.</p>
        </Field>

        <div className="rounded-2xl border border-caramel/25 bg-butter/30 p-4">
          <div className="mb-3 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-caramel" aria-hidden="true" />
            <div>
              <p className="font-semibold text-espresso">Conditions indispensables</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Le quiz avec récompense est réservé aux personnes majeures. Tout gain expire le dimanche de la semaine du gain à 22h00.</p>
            </div>
          </div>

          <ConsentRow id="age-confirmed" checked={ageConfirmed} onChange={setAgeConfirmed} error={errors.ageConfirmed}>
            Je certifie avoir <strong>18 ans révolus</strong> et être autorisé à participer.
          </ConsentRow>
          <ConsentRow id="rules-accepted" checked={rulesAccepted} onChange={setRulesAccepted} error={errors.rulesAccepted}>
            J’accepte le <Link to="/legal#quiz" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">règlement complet du quiz</Link>, notamment la limite d’un gain par semaine et son expiration le dimanche à 22h00.
          </ConsentRow>
          <ConsentRow id="privacy-consent" checked={rgpdConsent} onChange={setRgpdConsent} error={errors.rgpdConsent}>
            J’accepte le traitement de mes données nécessaire à la validation, à la sécurité et à la remise du gain, conformément à la <Link to="/legal#privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">politique de confidentialité</Link>.
          </ConsentRow>
        </div>

        <div className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
          Plusieurs tentatives peuvent être autorisées, mais <strong>un seul gain maximum par personne, compte, appareil et semaine</strong>.
        </div>

        {error && <div className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive" role="alert">{error}</div>}

        <Button type="submit" className="btn-hero w-full py-6 text-lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />Validation sécurisée…</> : "Valider et découvrir mon résultat"}
        </Button>
      </form>
    </motion.div>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label} *</Label>
    {children}
    {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
  </div>
);

const ConsentRow = ({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (value: boolean) => void; error?: string; children: React.ReactNode }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} className={error ? "border-destructive" : ""} aria-invalid={Boolean(error)} />
      <Label htmlFor={id} className="cursor-pointer text-sm leading-relaxed">{children}</Label>
    </div>
    {error && <p className="ml-7 mt-1 text-xs text-destructive" role="alert">{error}</p>}
  </div>
);

export default QuizPreForm;
