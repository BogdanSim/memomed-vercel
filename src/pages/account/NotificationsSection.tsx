import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bell, Mail, Smartphone } from 'lucide-react';

interface NotifSettings {
  notifications_push: boolean;
  notifications_email: boolean;
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const NotificationsSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotifSettings>({
    notifications_push: true,
    notifications_email: true,
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notifications_push, notifications_email')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          notifications_push: data.notifications_push ?? true,
          notifications_email: data.notifications_email ?? true,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      notifications_push: settings.notifications_push,
      notifications_email: settings.notifications_email,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast.error('Nu am putut salva setările');
    } else {
      toast.success('Setări salvate');
    }
    setSaving(false);
  };

  const toggle = (key: keyof NotifSettings, icon: React.ReactNode, label: string, sub: string) => (
    <div className="flex items-center gap-4 bg-card rounded-2xl border border-border px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Toggle value={settings[key]} onChange={v => setSettings(s => ({ ...s, [key]: v }))} />
    </div>
  );

  if (loading) {
    return <div className="space-y-3 animate-pulse">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground mb-2">Alege cum vrei să fii notificat despre orele de administrare.</p>

      {toggle('notifications_push',
        <Smartphone className="w-4.5 h-4.5 text-foreground" />,
        'Notificări push',
        'Alerte la orele de administrare'
      )}
      {toggle('notifications_email',
        <Mail className="w-4.5 h-4.5 text-foreground" />,
        'Email zilnic',
        'Rezumat dimineața cu dozele de azi'
      )}

      <div className="bg-secondary/50 rounded-2xl p-4">
        <div className="flex gap-2 items-start">
          <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Notificările push funcționează doar dacă ai acordat permisiunea browserului.
            Poți activa/dezactiva oricând din setările browserului.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {saving ? 'Se salvează...' : 'Salvează setările'}
      </button>
    </div>
  );
};

export default NotificationsSection;
