import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Get the end of the current week (Saturday 23:59:59)
const getWeekEnd = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until Saturday
  // If Sunday (0), we need 6 days
  // If Monday (1), we need 5 days
  // ...
  // If Saturday (6), we need 0 days
  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(23, 59, 59, 999);
  
  return saturday;
};

// Check if we're in the active period (Sunday 01:00 to Saturday 23:59)
const isActiveperiod = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  
  // Sunday before 01:00 = not active yet
  if (dayOfWeek === 0 && hours < 1) {
    return false;
  }
  
  return true;
};

// Get time until Sunday 01:00 (for pre-period display)
const getTimeUntilStart = (): Date => {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(1, 0, 0, 0);
  
  // If it's already past Sunday 01:00, get next Sunday
  if (now >= sunday) {
    sunday.setDate(sunday.getDate() + 7);
  }
  
  return sunday;
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
          <>Semaine en cours • Reset dimanche à 01h00</>
        ) : (
          <>Préparez-vous pour la nouvelle semaine !</>
        )}
      </p>
    </motion.div>
  );
};

export default WeeklyCountdown;
