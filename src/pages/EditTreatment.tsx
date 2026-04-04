import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Pill, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { type TreatmentType, type MealCondition } from '@/types/treatment';
import { zenythProducts, ZenythProduct } from '@/data/zenythProducts';

const EditTreatment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { treatments, updateTreatment } = useApp();

  const treatment = treatments.find(t => t.id === id);

  const [name, setName] = useState('');
  const [type, setType] = useState<TreatmentType>('supplement');
  const [frequency, setFrequency] = useState(1);
  const [times, setTimes] = useState(['08:00']);
  const [meal, setMeal] = useState<MealCondition>('none');
  const [units, setUnits] = useState(1);
  const [unitLabel, setUnitLabel] = useState('capsulă');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWoo, setSelectedWoo] = useState<ZenythProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populează câmpurile cu datele tratamentului existent
  useEffect(() => {
    if (treatment) {
      setName(treatment.name);
      setType(treatment.type);
      setFrequency(treatment.frequencyPerDay);
      setTimes(treatment.times);
      setMeal(treatment.mealCondition);
      setUnits(treatment.unitsPerIntake);
      setUnitLabel(treatment.unitLabel);
      setStartDate(treatment.startDate);
      setEndDate(treatment.endDate ?? '');
      setNotes(treatment.notes ?? '');
      // Dacă era un produs Zenyth, găsim produsul și-l setăm
      if (treatment.wooProductId) {
        const woo = zenythProducts.find(p => p.id === treatment.wooProductId);
        if (woo) setSelectedWoo(woo);
      }
    }
  }, [treatment]);

  const normalizeSearch = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');

  const levenshtein = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  };

  const mapUnitLabel = (p: ZenythProduct) => {
    const u = p.unitLabel.toLowerCase();
    if (u.includes('capsule')) return 'capsulă';
    if (u.includes('compr') || u.includes('comprimat')) return 'comprimat';
    if (u.includes('plic')) return 'plicuri';
    return unitLabel;
  };

  const suggestions =
    name.length > 1
      ? (() => {
          const q = normalizeSearch(name);
          const threshold = q.length <= 4 ? 1 : 2;
          return zenythProducts
            .map(p => {
              const skuN = normalizeSearch(p.sku);
              const nameN = normalizeSearch(p.name);
              if (nameN.includes(q) || skuN.includes(q)) return { p, score: 0 };
              const dist = levenshtein(q, skuN);
              return { p, score: dist };
            })
            .filter(x => x.score <= threshold || x.score === 0)
            .sort((a, b) => a.score - b.score)
            .slice(0, 8)
            .map(x => x.p);
        })()
      : [];

  // Generează ore echidistante între 08:00 și 22:00
  const generateTimes = (f: number): string[] => {
    if (f === 1) return ['08:00'];
    const startMinutes = 8 * 60;
    const endMinutes = 22 * 60;
    const step = (endMinutes - startMinutes) / (f - 1);
    return Array.from({ length: f }, (_, i) => {
      const total = Math.round(startMinutes + i * step);
      const h = Math.floor(total / 60).toString().padStart(2, '0');
      const m = (total % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    });
  };

  const handleFrequencyChange = (f: number) => {
    setFrequency(f);
    setTimes(generateTimes(f));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!name && !selectedWoo) {
      setError('Completează numele produsului');
      return;
    }
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateTreatment(id, {
        name: selectedWoo ? selectedWoo.name : name,
        type,
        source: selectedWoo ? 'woo' : 'manual',
        wooProductId: selectedWoo?.id,
        wooProductImage: selectedWoo?.image,
        frequencyPerDay: frequency,
        unitsPerIntake: units,
        unitLabel,
        mealCondition: meal,
        times,
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
        packageSize: selectedWoo?.unitsPerPackage || undefined,
      });
      toast.success('Tratament actualizat');
      navigate('/treatments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu am putut salva modificările');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!treatment) {
    return (
      <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Înapoi
        </button>
        <p className="text-sm text-muted-foreground">Tratamentul nu a fost găsit.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Înapoi
        </button>
        <h1 className="text-xl font-bold mb-6">Editează tratament</h1>

        <div className="space-y-5">
          {/* Nume cu autocomplete */}
          <div className="relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nume produs</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={name}
                onChange={e => { setName(e.target.value); setShowSuggestions(true); setSelectedWoo(null); }}
                placeholder="Caută produs Zenyth sau scrie manual..."
                className="w-full h-11 pl-9 pr-4 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedWoo(p);
                      setName(p.name);
                      setUnitLabel(mapUnitLabel(p));
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-secondary transition-colors text-left">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedWoo && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-accent/50">
                <img src={selectedWoo.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xs font-medium text-accent-foreground">Produs Zenyth selectat</span>
              </div>
            )}
          </div>

          {/* Tip */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tip</label>
            <div className="flex gap-2">
              {(['supplement', 'medication'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {t === 'supplement' ? <Leaf className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                  {t === 'supplement' ? 'Supliment' : 'Medicament'}
                </button>
              ))}
            </div>
          </div>

          {/* Frecvență */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Frecvență</label>
            <div className="flex items-center gap-3 h-11">
              <button
                onClick={() => handleFrequencyChange(Math.max(1, frequency - 1))}
                disabled={frequency <= 1}
                className="w-11 h-11 rounded-xl bg-secondary text-secondary-foreground text-xl font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30">
                −
              </button>
              <div className="flex-1 h-11 rounded-xl bg-secondary flex items-center justify-center">
                <span className="text-sm font-semibold">{frequency}x / zi</span>
              </div>
              <button
                onClick={() => handleFrequencyChange(Math.min(6, frequency + 1))}
                disabled={frequency >= 6}
                className="w-11 h-11 rounded-xl bg-secondary text-secondary-foreground text-xl font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30">
                +
              </button>
            </div>
          </div>

          {/* Ore */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Ore</label>
            <div className={times.length <= 3 ? 'flex gap-2' : 'grid grid-cols-2 gap-2'}>
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {times.length > 3 && (
                    <span className="text-xs text-muted-foreground w-4 text-right flex-shrink-0">{i + 1}.</span>
                  )}
                  <input type="time" value={t} onChange={e => { const nt = [...times]; nt[i] = e.target.value; setTimes(nt); }}
                    className="flex-1 h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
            </div>
          </div>

          {/* Condiție masă */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Condiție masă</label>
            <div className="flex gap-2">
              {([['before', 'Înainte'], ['after', 'După'], ['none', 'Fără']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setMeal(v)}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all ${meal === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Unități */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Unități / doză</label>
              <input type="number" min={1} value={units} onChange={e => setUnits(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Formă</label>
              <select value={unitLabel} onChange={e => setUnitLabel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30">
                <option>capsulă</option>
                <option>comprimat</option>
                <option>plicuri</option>
                <option>picături</option>
                <option>ml</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data început</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data sfârșit</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Note</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observații opționale..."
              className="w-full px-3 py-2 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground" />
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <button onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 disabled:opacity-60">
            {isSubmitting ? 'Se salvează...' : 'Salvează modificările'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditTreatment;
