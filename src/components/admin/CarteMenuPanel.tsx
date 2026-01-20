import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UtensilsCrossed, ChefHat, Loader2, Copy, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CartePublicPanel from './CartePublicPanel';
import SecretMenuAdminPanel from './SecretMenuAdminPanel';

interface CarteMenuPanelProps {
  adminPassword: string;
}

const CarteMenuPanel = ({ adminPassword }: CarteMenuPanelProps) => {
  const [activeTab, setActiveTab] = useState<'carte' | 'secret'>('carte');
  const [dailyCode, setDailyCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  useEffect(() => {
    fetchDailyCode();
  }, []);

  const fetchDailyCode = async () => {
    setIsLoadingCode(true);
    try {
      const { data, error } = await supabase.rpc('get_daily_code');
      if (!error && data) {
        setDailyCode(data);
      }
    } catch (err) {
      console.error('Error fetching daily code:', err);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const copyDailyCode = () => {
    if (dailyCode) {
      navigator.clipboard.writeText(dailyCode);
      toast.success('Code du jour copié !');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Daily Code Banner */}
      {dailyCode && (
        <div className="card-warm bg-gradient-to-r from-caramel/10 to-butter/20 border-caramel/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-caramel/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-caramel" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Code du jour</p>
                <p className="font-mono text-xl font-bold text-caramel tracking-wider">
                  {isLoadingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : dailyCode}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyDailyCode} className="gap-1">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchDailyCode} className="gap-1">
                <RefreshCw className={`w-4 h-4 ${isLoadingCode ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'carte' | 'secret')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="carte" className="gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            La Carte
          </TabsTrigger>
          <TabsTrigger value="secret" className="gap-2">
            <ChefHat className="w-4 h-4" />
            Menu Secret
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carte" className="mt-4">
          <CartePublicPanel adminPassword={adminPassword} />
        </TabsContent>

        <TabsContent value="secret" className="mt-4">
          <SecretMenuAdminPanel adminPassword={adminPassword} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CarteMenuPanel;
