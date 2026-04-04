import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  gender: string;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculin' },
  { value: 'female', label: 'Feminin' },
  { value: 'other', label: 'Altul' },
  { value: 'prefer_not', label: 'Prefer să nu spun' },
];

const ProfileSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    gender: '',
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          birth_date: data.birth_date ?? '',
          gender: data.gender ?? '',
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      phone: profile.phone || null,
      birth_date: profile.birth_date || null,
      gender: profile.gender || null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast.error('Nu am putut salva profilul');
    } else {
      toast.success('Profil salvat');
    }
    setSaving(false);
  };

  const field = (label: string, key: keyof Profile, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type}
        value={profile[key]}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl bg-secondary text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
      />
    </div>
  );

  if (loading) {
    return <div className="space-y-4 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-11 rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Avatar placeholder */}
      <div className="flex justify-center mb-2">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* Email (readonly) */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
        <div className="w-full h-11 px-3 rounded-xl bg-secondary/50 text-sm flex items-center text-muted-foreground select-none">
          {user?.email}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field('Prenume', 'first_name', 'text', 'Ion')}
        {field('Nume', 'last_name', 'text', 'Popescu')}
      </div>

      {field('Telefon', 'phone', 'tel', '07xx xxx xxx')}
      {field('Data nașterii', 'birth_date', 'date')}

      {/* Gen */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Gen</label>
        <div className="grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setProfile(p => ({ ...p, gender: opt.value }))}
              className={`h-11 rounded-xl text-sm font-medium transition-all ${
                profile.gender === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 disabled:opacity-60"
      >
        {saving ? 'Se salvează...' : 'Salvează profilul'}
      </button>
    </div>
  );
};

export default ProfileSection;
