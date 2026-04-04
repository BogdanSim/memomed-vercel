import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  county: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

const emptyForm = {
  label: 'Acasă',
  first_name: '',
  last_name: '',
  street: '',
  city: '',
  county: '',
  postal_code: '',
  phone: '',
};

const ROMANIAN_COUNTIES = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila',
  'Brașov','București','Buzău','Călărași','Caraș-Severin','Cluj','Constanța',
  'Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara',
  'Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt',
  'Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea',
  'Vâlcea','Vaslui','Vrancea',
];

const AddressesSection = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    setAddresses((data as Address[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.street || !form.city || !form.county) {
      toast.error('Completează strada, orașul și județul');
      return;
    }
    setSaving(true);
    const isFirst = addresses.length === 0;
    const { error } = await supabase.from('addresses').insert({
      user_id: user.id,
      label: form.label || 'Acasă',
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      street: form.street,
      city: form.city,
      county: form.county,
      postal_code: form.postal_code || null,
      phone: form.phone || null,
      is_default: isFirst,
    });
    if (error) {
      toast.error('Nu am putut salva adresa');
    } else {
      toast.success('Adresă salvată');
      setShowForm(false);
      setForm(emptyForm);
      await fetchAddresses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Ștergi această adresă?');
    if (!confirmed) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user!.id);
    if (error) {
      toast.error('Nu am putut șterge adresa');
    } else {
      toast.success('Adresă ștearsă');
      await fetchAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    // Reset all, then set default
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    await fetchAddresses();
    toast.success('Adresă implicită actualizată');
  };

  const inp = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
      />
    </div>
  );

  if (loading) {
    return <div className="space-y-3 animate-pulse">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lista adrese */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-10 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nu ai adrese salvate</p>
        </div>
      )}

      <AnimatePresence>
        {addresses.map(addr => (
          <motion.div
            key={addr.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`bg-card rounded-2xl border p-4 ${addr.is_default ? 'border-primary' : 'border-border'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Implicită</span>
                  )}
                </div>
                {(addr.first_name || addr.last_name) && (
                  <p className="text-xs text-muted-foreground">{[addr.first_name, addr.last_name].filter(Boolean).join(' ')}</p>
                )}
                <p className="text-xs text-muted-foreground">{addr.street}</p>
                <p className="text-xs text-muted-foreground">{addr.city}, {addr.county}{addr.postal_code ? `, ${addr.postal_code}` : ''}</p>
                {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                    title="Setează ca implicită">
                    <Star className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                  title="Șterge">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Formular adaugă */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-4"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">Adresă nouă</h3>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Label */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Etichetă</label>
              <div className="flex gap-2">
                {['Acasă', 'Serviciu', 'Altul'].map(l => (
                  <button key={l} onClick={() => setForm(f => ({ ...f, label: l }))}
                    className={`flex-1 h-9 rounded-xl text-xs font-medium transition-all ${form.label === l ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {inp('Prenume', 'first_name', 'text', 'Ion')}
              {inp('Nume', 'last_name', 'text', 'Popescu')}
            </div>

            {inp('Stradă, număr, bloc, scară, apartament', 'street', 'text', 'Str. Florilor nr. 10, Ap. 5')}

            <div className="grid grid-cols-2 gap-3">
              {inp('Oraș', 'city', 'text', 'Cluj-Napoca')}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Județ</label>
                <select value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Selectează</option>
                  {ROMANIAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {inp('Cod poștal', 'postal_code', 'text', '400000')}
              {inp('Telefon', 'phone', 'tel', '07xx xxx xxx')}
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60">
              {saving ? 'Se salvează...' : 'Salvează adresa'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Plus className="w-4 h-4" /> Adaugă adresă nouă
        </button>
      )}
    </div>
  );
};

export default AddressesSection;
