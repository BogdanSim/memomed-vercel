import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { RefreshCcw } from 'lucide-react';

const RefillHistorySection = () => {
  const { treatments, intakeLogs } = useApp();

  // Calculăm câte doze luate are fiecare tratament în ultimele 30 de zile
  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return treatments.map(t => {
      const logs = intakeLogs.filter(
        l => l.treatmentId === t.id &&
             l.status === 'taken' &&
             new Date(l.scheduledAt) >= thirtyDaysAgo
      );
      return { treatment: t, takenCount: logs.length };
    }).filter(s => s.takenCount > 0);
  }, [treatments, intakeLogs]);

  if (stats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <RefreshCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium mb-1">Niciun istoric încă</p>
        <p className="text-xs max-w-[220px] mx-auto">
          Istoricul administrărilor din ultimele 30 de zile va apărea aici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">Ultimele 30 de zile</p>
      {stats.map(({ treatment, takenCount }) => (
        <div key={treatment.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <RefreshCcw className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{treatment.name}</p>
            <p className="text-xs text-muted-foreground">
              {takenCount} doze luate · {treatment.frequencyPerDay}x/zi
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-primary">{takenCount}</p>
            <p className="text-[10px] text-muted-foreground">doze</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RefillHistorySection;
