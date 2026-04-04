import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Pill, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Treatment, IntakeLog } from '@/types/treatment';
import { useApp } from '@/context/AppContext';

interface DoseCardProps {
  treatment: Treatment;
  log: IntakeLog;
}

const mealLabel = { before: 'Înainte de masă', after: 'După masă', none: '' };

const SNOOZE_MINUTES = 30;
const UNDO_DELAY_MS = 4000;

const DoseCard = ({ treatment, log }: DoseCardProps) => {
  const { updateIntakeStatus } = useApp();
  const [takingAnim, setTakingAnim] = useState(false);
  const [snoozeMinutesLeft, setSnoozeMinutesLeft] = useState<number | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const time = log.scheduledAt.split('T')[1]?.substring(0, 5) || '';
  const isPending = log.status === 'pending' || log.status === 'snoozed';

  // Countdown pentru doza amânată
  useEffect(() => {
    if (log.status !== 'snoozed') {
      setSnoozeMinutesLeft(null);
      return;
    }
    const tick = () => {
      const snoozedAt = (log as any).updatedAt
        ? new Date((log as any).updatedAt).getTime()
        : Date.now() - (SNOOZE_MINUTES * 60 * 1000) / 2;
      const elapsed = (Date.now() - snoozedAt) / 1000 / 60;
      const remaining = Math.max(0, Math.ceil(SNOOZE_MINUTES - elapsed));
      setSnoozeMinutesLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [log.status, (log as any).updatedAt]);

  // Curăță timer-ul de undo la unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const statusLabel: Record<string, string> = {
    taken: 'Luată',
    skipped: 'Sărită',
    missed: 'Ratată',
    snoozed:
      snoozeMinutesLeft !== null
        ? `Amânată · revine în ${snoozeMinutesLeft} min`
        : 'Amânată',
  };

  const handleTake = () => {
    if (takingAnim) return;
    setTakingAnim(true);

    // Afișăm toast cu posibilitate de undo timp de 4 secunde
    let cancelled = false;
    const toastId = toast('Doză marcată ca luată', {
      duration: UNDO_DELAY_MS,
      action: {
        label: 'Anulează',
        onClick: () => {
          cancelled = true;
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
          setTakingAnim(false);
          toast.dismiss(toastId);
        },
      },
    });

    undoTimerRef.current = setTimeout(() => {
      if (!cancelled) {
        updateIntakeStatus(log.id, 'taken');
      }
    }, UNDO_DELAY_MS);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-[20px] border border-border p-4 ${
        log.status === 'taken'
          ? 'border-l-4 border-l-primary'
          : log.status === 'missed' || log.status === 'skipped'
          ? 'border-l-4 border-l-destructive opacity-60'
          : log.status === 'snoozed'
          ? 'border-l-4 border-l-yellow-400'
          : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {treatment.type === 'medication' ? (
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Pill className="w-6 h-6 text-accent-foreground" />
          </div>
        ) : treatment.wooProductImage ? (
          <img
            src={treatment.wooProductImage}
            alt={treatment.name}
            className="w-12 h-12 rounded-xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Leaf className="w-6 h-6 text-accent-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{treatment.name}</h3>
          <p className="text-xs text-muted-foreground">
            {time} · {treatment.unitsPerIntake} {treatment.unitLabel}
            {treatment.mealCondition !== 'none' &&
              ` · ${mealLabel[treatment.mealCondition]}`}
          </p>
          {!isPending && (
            <span
              className={`text-[10px] font-semibold mt-0.5 inline-block ${
                log.status === 'taken' ? 'text-primary' : 'text-destructive'
              }`}
            >
              {statusLabel[log.status] || log.status}
            </span>
          )}
          {log.status === 'snoozed' && snoozeMinutesLeft !== null && (
            <span className="text-[10px] font-semibold mt-0.5 inline-block text-yellow-500">
              {statusLabel['snoozed']}
            </span>
          )}
        </div>
        {log.status === 'taken' && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary" />
          </motion.div>
        )}
        {(log.status === 'missed' || log.status === 'skipped') && (
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <X className="w-4 h-4 text-destructive" />
          </div>
        )}
        {log.status === 'snoozed' && (
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2 mt-3">
          <motion.button
            onClick={handleTake}
            whileTap={{ scale: 0.92 }}
            animate={takingAnim ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.3, type: 'spring' }}
            className="flex-1 h-10 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {takingAnim ? (
                <motion.span
                  key="done"
                  className="flex items-center gap-1.5"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 600,
                      damping: 15,
                      delay: 0.05,
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                  Luată!
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  className="flex items-center gap-1.5"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                >
                  <Check className="w-4 h-4" /> Luată
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {log.status !== 'snoozed' && (
            <button
              onClick={() => updateIntakeStatus(log.id, 'snoozed')}
              className="h-10 px-3 rounded-2xl bg-secondary text-secondary-foreground text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Clock className="w-3.5 h-3.5" /> Amână
            </button>
          )}
          <button
            onClick={() => updateIntakeStatus(log.id, 'skipped')}
            className="h-10 px-3 rounded-2xl bg-secondary text-secondary-foreground text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <X className="w-3.5 h-3.5" /> Omit
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DoseCard;
