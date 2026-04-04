import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import DoseCard from '@/components/DoseCard';
import { TrendingUp, AlertTriangle, Clock, Plus, Pill } from 'lucide-react';
import ZLogo from '@/components/ZLogo';
import type { Treatment } from '@/types/treatment';

const calcDaysRemaining = (t: Treatment): number | null => {
  if (!t.packageSize) return null;
  const start = new Date(t.startDate);
  const now = new Date();
  const daysElapsed = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const dailyUsage = t.unitsPerIntake * t.frequencyPerDay;
  const remaining = t.packageSize - daysElapsed * dailyUsage;
  return Math.max(0, Math.floor(remaining / dailyUsage));
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bună dimineața';
  if (hour >= 12 && hour < 18) return 'Bună ziua';
  return 'Bună seara';
};

const Dashboard = () => {
  const { treatments, intakeLogs } = useApp();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const todayLogs = useMemo(() =>
    intakeLogs.filter(l => l.scheduledAt.startsWith(today))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [intakeLogs, today]
  );

  const taken = todayLogs.filter(l => l.status === 'taken').length;
  const total = todayLogs.length;
  const progress = total > 0 ? Math.round((taken / total) * 100) : 0;

  const pendingLogs = todayLogs.filter(l => l.status === 'pending');
  const completedLogs = todayLogs.filter(l => l.status !== 'pending');

  const nextDose = useMemo(() => {
    if (pendingLogs.length === 0) return null;
    const log = pendingLogs[0];
    const treatment = treatments.find(t => t.id === log.treatmentId);
    const time = log.scheduledAt.split('T')[1]?.substring(0, 5);
    return treatment ? { treatment, time, log } : null;
  }, [pendingLogs, treatments]);

  const lowStockTreatments = useMemo(() =>
    treatments
      .map(t => ({ treatment: t, daysRemaining: calcDaysRemaining(t) }))
      .filter(({ daysRemaining }) => daysRemaining !== null && daysRemaining <= 5),
    [treatments]
  );


  return (
    <div className="pb-32 px-4 pt-4 max-w-lg mx-auto overflow-x-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ZLogo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Zi de zi</h1>
              <span className="text-[10px] text-muted-foreground font-medium">by Zenyth</span>
            </div>
          </div>
          <button onClick={() => navigate('/add')} className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center active:scale-95 transition-transform">
            <Plus className="w-5 h-5 text-primary" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{getGreeting()}! Iată programul de azi.</p>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-[20px] border border-border p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Progres zilnic</span>
          </div>
          <span className="text-2xl font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{taken} din {total} doze luate</p>
      </motion.div>

      {/* Next dose highlight */}
      {nextDose && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-primary/5 border border-primary/20 rounded-[20px] p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Următoarea administrare</span>
          </div>
          <div className="flex items-center gap-3">
            {nextDose.treatment.type === 'medication' ? (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
            ) : nextDose.treatment.wooProductImage ? (
              <img src={nextDose.treatment.wooProductImage} alt={nextDose.treatment.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ZLogo className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">{nextDose.treatment.name}</p>
              <p className="text-xs text-muted-foreground">{nextDose.time} · {nextDose.treatment.unitsPerIntake} {nextDose.treatment.unitLabel}</p>
            </div>
            <span className="text-lg font-bold text-primary">{nextDose.time}</span>
          </div>
        </motion.div>
      )}

      {/* Low stock alerts */}
      {lowStockTreatments.length > 0 && (
        <div className="mb-5 space-y-2">
          {lowStockTreatments.slice(0, 2).map(({ treatment, daysRemaining }) => (
            <motion.div key={treatment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 border-l-4 border-l-warning">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{treatment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {daysRemaining === 0 ? 'Stoc epuizat' : `Mai ai pentru ~${daysRemaining} zile`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pending Doses */}
      {pendingLogs.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">De luat</h2>
          <div className="space-y-3">
            {pendingLogs.map(log => {
              const treatment = treatments.find(t => t.id === log.treatmentId);
              return treatment ? <DoseCard key={log.id} treatment={treatment} log={log} /> : null;
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedLogs.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Finalizate</h2>
          <div className="space-y-3">
            {completedLogs.map(log => {
              const treatment = treatments.find(t => t.id === log.treatmentId);
              return treatment ? <DoseCard key={log.id} treatment={treatment} log={log} /> : null;
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center mt-8 px-4">
        Această aplicație este un instrument de tracking și nu înlocuiește sfatul medical.
      </p>
    </div>
  );
};

export default Dashboard;
