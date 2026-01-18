import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Check, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactFormProps {
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

const ContactForm = ({ userEmail, userName, userPhone }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    phone: userPhone || '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Length limits for validation
  const MAX_NAME_LENGTH = 100;
  const MAX_EMAIL_LENGTH = 254;
  const MAX_PHONE_LENGTH = 20;
  const MAX_SUBJECT_LENGTH = 200;
  const MAX_MESSAGE_LENGTH = 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = formData.name.trim();
    const message = formData.message.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const subject = formData.subject.trim();
    
    // Validate required fields
    if (!name || !message) {
      toast.error('Veuillez remplir votre nom et votre message');
      return;
    }

    // Validate length limits
    if (name.length > MAX_NAME_LENGTH) {
      toast.error(`Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères`);
      return;
    }
    if (email.length > MAX_EMAIL_LENGTH) {
      toast.error(`L'email ne peut pas dépasser ${MAX_EMAIL_LENGTH} caractères`);
      return;
    }
    if (phone.length > MAX_PHONE_LENGTH) {
      toast.error(`Le téléphone ne peut pas dépasser ${MAX_PHONE_LENGTH} caractères`);
      return;
    }
    if (subject.length > MAX_SUBJECT_LENGTH) {
      toast.error(`Le sujet ne peut pas dépasser ${MAX_SUBJECT_LENGTH} caractères`);
      return;
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_type: 'client',
          sender_name: name.slice(0, MAX_NAME_LENGTH),
          sender_email: email ? email.slice(0, MAX_EMAIL_LENGTH) : null,
          sender_phone: phone ? phone.slice(0, MAX_PHONE_LENGTH) : null,
          subject: subject ? subject.slice(0, MAX_SUBJECT_LENGTH) : null,
          message: message.slice(0, MAX_MESSAGE_LENGTH),
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Message envoyé ! Nous vous répondrons bientôt.');
      
      // Reset form after delay
      setTimeout(() => {
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-warm text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-herb/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-herb" />
        </div>
        <h3 className="font-display text-xl font-bold text-herb">Message envoyé !</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Nous vous répondrons dans les plus brefs délais.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="card-warm space-y-4"
    >
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display font-bold">Nous contacter</h3>
        <p className="text-sm text-muted-foreground">
          Une question ? Un message ? Écrivez-nous !
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1 text-xs">
            <User className="w-3 h-3" /> Nom *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.slice(0, MAX_NAME_LENGTH) }))}
            placeholder="Votre nom"
            maxLength={MAX_NAME_LENGTH}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1 text-xs">
            <Mail className="w-3 h-3" /> Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.slice(0, MAX_EMAIL_LENGTH) }))}
            placeholder="votre@email.com"
            maxLength={MAX_EMAIL_LENGTH}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-1 text-xs">
          <Phone className="w-3 h-3" /> Téléphone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.slice(0, MAX_PHONE_LENGTH) }))}
          placeholder="06 12 34 56 78"
          maxLength={MAX_PHONE_LENGTH}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-xs">Sujet</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value.slice(0, MAX_SUBJECT_LENGTH) }))}
          placeholder="Objet de votre message"
          maxLength={MAX_SUBJECT_LENGTH}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-xs">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value.slice(0, MAX_MESSAGE_LENGTH) }))}
          placeholder="Votre message..."
          rows={4}
          maxLength={MAX_MESSAGE_LENGTH}
          required
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.message.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !formData.name.trim() || !formData.message.trim()}
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Envoyer le message
          </>
        )}
      </Button>
    </motion.form>
  );
};

export default ContactForm;
