import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, CreditCard, Package, RefreshCcw, Pill, Bell, ChevronRight, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const Account = () => {
  const { treatments, logout } = useApp();
  const { user } = useAuth();
  const activeTreatments = treatments.length;
  const email = user?.email ?? '';

  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string } | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setAddressCount(count ?? 0));
  }, [user]);

  const displayName = profile?.first_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : email.split('@')[0];

  const menuSections = [
    {
      title: 'Cont',
      items: [
        { icon: User, label: 'Profil', sub: email, to: '/account/profile' },
        {
          icon: MapPin,
          label: 'Adrese salvate',
          sub: addressCount === null ? '...' : `${addressCount} ${addressCount === 1 ? 'adresă' : 'adrese'}`,
          to: '/account/addresses',
        },
        { icon: CreditCard, label: 'Metode de plată', sub: 'Gestionate pe Zenyth.ro', to: '/account/payment' },
      ],
    },
    {
      title: 'Comenzi',
      items: [
        { icon: Package, label: 'Comenzile mele', sub: 'Vezi istoricul comenzilor', to: '/account/orders' },
        { icon: RefreshCcw, label: 'Istoric reaprovizionări', sub: 'Ultimele 30 de zile', to: '/account/refill-history' },
      ],
    },
    {
      title: 'Sănătate',
      items: [
        { icon: Pill, label: 'Tratamente active', sub: `${activeTreatments} tratamente`, to: '/treatments' },
        { icon: Bell, label: 'Setări notificări', sub: 'Alerte administrare', to: '/account/notifications' },
      ],
    },
  ];

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeTreatments} tratamente active</p>
          </div>
        </div>
      </motion.div>

      {/* Menu sections */}
      {menuSections.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">{section.title}</h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {section.items.map((item, i) => (
              <Link
                key={item.label}
                to={item.to}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-secondary transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Settings & Logout */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 space-y-2">
        <Link to="/account/app-settings"
          className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border px-4 py-3.5 active:bg-secondary transition-colors">
          <Settings className="w-4.5 h-4.5 text-muted-foreground" />
          <span className="text-sm font-medium">Setări aplicație</span>
        </Link>
        <button
          className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border px-4 py-3.5 active:bg-secondary transition-colors"
          onClick={logout}
        >
          <LogOut className="w-4.5 h-4.5 text-destructive" />
          <span className="text-sm font-medium text-destructive">Deconectare</span>
        </button>
      </motion.div>

      <p className="text-[10px] text-muted-foreground text-center mt-8">
        Zi de zi by Zenyth · Versiunea 1.0.0
      </p>
    </div>
  );
};

export default Account;
