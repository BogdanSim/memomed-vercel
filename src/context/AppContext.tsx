import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Treatment, IntakeLog } from '@/types/treatment';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface AppState {
  treatments: Treatment[];
  intakeLogs: IntakeLog[];
  isSyncing: boolean;
  refresh: () => Promise<void>;
  addTreatment: (payload: Omit<Treatment, 'id' | 'userId'>) => Promise<void>;
  removeTreatment: (treatmentId: string) => Promise<void>;
  updateIntakeStatus: (logId: string, status: IntakeLog['status']) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppState | null>(null);

const mapTreatment = (row: any): Treatment => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  type: row.type,
  source: row.source,
  wooProductId: row.woo_product_id ?? undefined,
  wooProductImage: row.woo_product_image ?? undefined,
  frequencyPerDay: row.frequency_per_day,
  unitsPerIntake: row.units_per_intake,
  unitLabel: row.unit_label,
  mealCondition: row.meal_condition,
  times: row.times,
  startDate: row.start_date,
  endDate: row.end_date ?? undefined,
  notes: row.notes ?? undefined,
  packageSize: row.package_size ?? undefined,
});

const mapLog = (row: any): IntakeLog => ({
  id: row.id,
  treatmentId: row.treatment_id,
  scheduledAt: row.scheduled_at,
  status: row.status,
  confirmedAt: row.confirmed_at ?? undefined,
});

const ensureDailyLogs = async (userId: string, dateStr: string) => {
  const { data: treatments } = await supabase
    .from('treatments')
    .select('id, times, frequency_per_day')
    .eq('user_id', userId)
    .lte('start_date', dateStr)
    .or(`end_date.is.null,end_date.gte.${dateStr}`);

  if (!treatments?.length) return;

  const logsToInsert: any[] = [];
  for (const t of treatments) {
    const times: string[] = t.times;
    for (const time of times) {
      const scheduledAt = `${dateStr}T${time}:00`;
      const { data: existing } = await supabase
        .from('intake_logs')
        .select('id')
        .eq('treatment_id', t.id)
        .eq('scheduled_at', scheduledAt)
        .maybeSingle();
      if (!existing) {
        logsToInsert.push({
          treatment_id: t.id,
          scheduled_at: scheduledAt,
          status: 'pending',
        });
      }
    }
  }

  if (logsToInsert.length > 0) {
    await supabase.from('intake_logs').insert(logsToInsert);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout: authLogout } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const treatmentsQuery = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapTreatment);
    },
    enabled: Boolean(user),
  });

  const intakeLogsQuery = useQuery({
    queryKey: ['intakeLogs', today],
    queryFn: async () => {
      await ensureDailyLogs(user!.id, today);
      const { data, error } = await supabase
        .from('intake_logs')
        .select('*, treatments!inner(user_id)')
        .eq('treatments.user_id', user!.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapLog);
    },
    enabled: Boolean(user),
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['treatments'] }),
      queryClient.invalidateQueries({ queryKey: ['intakeLogs', today] }),
    ]);
  }, [queryClient, today]);

  const addTreatment = useCallback(async (payload: Omit<Treatment, 'id' | 'userId'>) => {
    if (!user) throw new Error('Neautentificat');
    const { error } = await supabase.from('treatments').insert({
      user_id: user.id,
      name: payload.name,
      type: payload.type,
      source: payload.source,
      woo_product_id: payload.wooProductId ?? null,
      woo_product_image: payload.wooProductImage ?? null,
      frequency_per_day: payload.frequencyPerDay,
      units_per_intake: payload.unitsPerIntake,
      unit_label: payload.unitLabel,
      meal_condition: payload.mealCondition,
      times: payload.times,
      start_date: payload.startDate,
      end_date: payload.endDate ?? null,
      notes: payload.notes ?? null,
      package_size: payload.packageSize ?? null,
    });
    if (error) throw error;
    await refresh();
  }, [user, refresh]);

  const removeTreatment = useCallback(async (treatmentId: string) => {
    if (!user) throw new Error('Neautentificat');
    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', treatmentId)
      .eq('user_id', user.id);
    if (error) throw error;
    await refresh();
  }, [user, refresh]);

  const updateIntakeStatus = useCallback(async (logId: string, status: IntakeLog['status']) => {
    const confirmedAt = status === 'taken' ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from('intake_logs')
      .update({ status, confirmed_at: confirmedAt, updated_at: new Date().toISOString() })
      .eq('id', logId)
      .select()
      .single();
    if (error) throw error;
    const updated = mapLog(data);
    queryClient.setQueryData<IntakeLog[]>(['intakeLogs', today], (prev = []) =>
      prev.map(log => (log.id === updated.id ? updated : log))
    );
  }, [queryClient, today]);

  const value = useMemo<AppState>(() => ({
    treatments: treatmentsQuery.data ?? [],
    intakeLogs: intakeLogsQuery.data ?? [],
    isSyncing: treatmentsQuery.isFetching || intakeLogsQuery.isFetching,
    refresh,
    addTreatment,
    removeTreatment,
    updateIntakeStatus,
    logout: authLogout,
  }), [treatmentsQuery.data, treatmentsQuery.isFetching, intakeLogsQuery.data, intakeLogsQuery.isFetching, refresh, addTreatment, removeTreatment, updateIntakeStatus, authLogout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
