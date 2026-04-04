import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileSection from './account/ProfileSection';
import AddressesSection from './account/AddressesSection';
import NotificationsSection from './account/NotificationsSection';
import AppSettingsSection from './account/AppSettingsSection';
import OrdersSection from './account/OrdersSection';
import RefillHistorySection from './account/RefillHistorySection';
import PaymentSection from './account/PaymentSection';

const titleBySection: Record<string, string> = {
  profile: 'Profil',
  addresses: 'Adrese salvate',
  payment: 'Metode de plată',
  orders: 'Comenzile mele',
  'refill-history': 'Istoric reaprovizionări',
  notifications: 'Setări notificări',
  'app-settings': 'Setări aplicație',
};

const sectionComponent: Record<string, React.ReactNode> = {
  profile: <ProfileSection />,
  addresses: <AddressesSection />,
  payment: <PaymentSection />,
  orders: <OrdersSection />,
  'refill-history': <RefillHistorySection />,
  notifications: <NotificationsSection />,
  'app-settings': <AppSettingsSection />,
};

const AccountSection = () => {
  const navigate = useNavigate();
  const { section } = useParams();
  const title = section ? (titleBySection[section] ?? 'Cont') : 'Cont';
  const content = section ? (sectionComponent[section] ?? null) : null;

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/account')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Înapoi la Cont
        </button>
        <h1 className="text-xl font-bold mb-6">{title}</h1>
        {content ?? (
          <p className="text-sm text-muted-foreground">Secțiunea nu a fost găsită.</p>
        )}
      </motion.div>
    </div>
  );
};

export default AccountSection;
