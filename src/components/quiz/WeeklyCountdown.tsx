import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Get the end of the current week (Sunday 23:59:59)
const getWeekEnd = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until Sunday 23:59
  // If Sunday (0), it's today
  // If Monday (1), we need 6 days
  // etc.
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  sunday.setHours(23, 59, 59, 999);
  
  return sunday;
};

// Check if we're in the active period (Monday 00:01 to Sunday 23:59)
const isActiveperiod = (): boolean => {
  // Quiz is always active during the week (Mon 00:01 to Sun 23:59)
  // Only inactive during the brief moment between Sun 23:59 and Mon 00:01
  return true;
};

// Get time until Monday 00:01 (for pre-period display)
const getTimeUntilStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Calculate next Monday 00:01
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 1, 0, 0);
  
  // If it's Monday and past 00:01, get next Monday
  if (dayOfWeek === 1 && now.getHours() >= 0) {
    monday.setDate(monday.getDate() + 7);
  }
  
  return monday;
};

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-gradient-to-b from-primary/20 to-primary/10 border border-primary/30 rounded-xl px-3 py-2 min-w-[52px]">
      <span className="font-mono text-2xl font-bold text-primary">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
      {label}
    </span>
  </div>
);

const WeeklyCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isActive, setIsActive] = useState(true);
  const [targetDate, setTargetDate] = useState<Date>(getWeekEnd());

  useEffect(() => {
    const updateCountdown = () => {
      const active = isActiveperiod();
      setIsActive(active);
      
      if (active) {
        const weekEnd = getWeekEnd();
        setTargetDate(weekEnd);
        setTimeLeft(calculateTimeLeft(weekEnd));
      } else {
        const startTime = getTimeUntilStart();
        setTargetDate(startTime);
        setTimeLeft(calculateTimeLeft(startTime));
      }
    };

    // Initial calculation
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if time is running out (less than 24 hours)
  const isUrgent = isActive && timeLeft.days === 0 && timeLeft.hours < 24;
  const isCritical = isActive && timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border-2 ${
        isCritical 
          ? 'bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/40' 
          : isUrgent 
            ? 'bg-gradient-to-r from-caramel/20 to-caramel/10 border-caramel/40'
            : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {isCritical ? (
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
        ) : (
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-caramel' : 'text-primary'}`} />
        )}
        <span className={`text-sm font-semibold ${
          isCritical ? 'text-destructive' : isUrgent ? 'text-caramel' : 'text-primary'
        }`}>
          {isActive ? (
            isCritical ? '⚡ Dernières heures !' : isUrgent ? '⏰ Fin bientôt !' : 'Fin dans :'
          ) : (
            '🎮 Nouvelle semaine dans :'
          )}
        </span>
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-center gap-2">
        <TimeUnit value={timeLeft.days} label="Jours" />
        <span className="text-xl font-bold text-muted-foreground mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.hours} label="Heures" />
        <span className="text-xl font-bold text-muted-foreground mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <span className="text-xl font-bold text-muted-foreground mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>

      {/* Info text */}
      <p className="text-xs text-center text-muted-foreground mt-3">
        {isActive ? (
          <>Semaine : lundi 00h01 → dimanche 23h59<br/>Gains valables jusqu'à dimanche 23h59</>
        ) : (
          <>Nouvelle semaine lundi à 00h01 !</>
        )}
      </p>
    </motion.div>
  );
};

export default WeeklyCountdown;
