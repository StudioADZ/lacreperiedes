import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Loader2, 
  Inbox, 
  Check, 
  Clock, 
  User,
  Phone,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
}

interface MessagesPanelProps {
  adminPassword: string;
}

const MessagesPanel = ({ adminPassword }: MessagesPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_messages', adminPassword }),
      });

      if (!response.ok) throw new Error('Unauthorized');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/admin-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_message_read', adminPassword, messageId }),
      });

      setMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header */}
      <div className="card-warm text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">Messagerie</h2>
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Tous les messages sont lus'}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 gap-2"
          onClick={fetchMessages}
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="card-warm text-center py-8">
            <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Aucun message pour l'instant</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les messages des clients apparaîtront ici
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`card-warm cursor-pointer transition-all ${
                !msg.is_read ? 'border-l-4 border-l-primary' : ''
              } ${selectedMessage?.id === msg.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                setSelectedMessage(msg);
                if (!msg.is_read) markAsRead(msg.id);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm truncate">{msg.sender_name}</span>
                    {!msg.is_read && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                        Nouveau
                      </span>
                    )}
                  </div>
                  {msg.subject && (
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Selected Message Detail */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="card-warm border-2 border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Message complet
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMessage(null)}
              >
                Fermer
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedMessage.sender_name}</span>
              </div>
              
              {selectedMessage.sender_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedMessage.sender_email}`} className="text-primary hover:underline">
                    {selectedMessage.sender_email}
                  </a>
                </div>
              )}
              
              {selectedMessage.sender_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${selectedMessage.sender_phone}`} className="text-primary hover:underline">
                    {selectedMessage.sender_phone}
                  </a>
                </div>
              )}

              {selectedMessage.subject && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Sujet</p>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Message</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                <Check className="w-3 h-3 text-herb" />
                Lu
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessagesPanel;
