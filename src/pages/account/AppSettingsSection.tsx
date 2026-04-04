import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Moon, Sun, Globe } from 'lucide-react';

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const AppSettingsSection = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [use24h, setUse24h] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDarkMode(parsed.darkMode ?? false);
        setUse24h(parsed.use24h ?? true);
        if (parsed.darkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify({ darkMode, use24h }));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success('Setări salvate');
  };

  const row = (icon: React.ReactNode, label: string, sub: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center gap-4 bg-card rounded-2xl border border-border px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-4">
      {row(
        <Moon className="w-4.5 h-4.5" />,
        'Mod întunecat',
        'Schimbă tema aplicației',
        darkMode,
        setDarkMode
      )}
      {row(
        <Globe className="w-4.5 h-4.5" />,
        'Format 24h',
        'Afișează orele în format 24 de ore',
        use24h,
        setUse24h
      )}

      <div className="bg-secondary/50 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground">
          Versiunea aplicației: <span className="font-semibold">1.0.0</span>
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        Salvează setările
      </button>
    </div>
  );
};

export default AppSettingsSection;
