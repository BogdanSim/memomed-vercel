import { useApp } from '@/context/AppContext';
import { Package, ExternalLink } from 'lucide-react';

const OrdersSection = () => {
  const { treatments } = useApp();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Comenzile plasate prin aplicație via Zenyth.ro apar mai jos.
      </p>

      {/* Placeholder — comenzile vin din WooCommerce */}
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium mb-1">Nicio comandă încă</p>
        <p className="text-xs max-w-[220px] mx-auto">
          Comenzile tale de suplimente vor apărea aici după prima achiziție.
        </p>
      </div>

      <a
        href="https://zenyth.ro/contul-meu/comenzi"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-12 rounded-2xl border border-border flex items-center justify-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform"
      >
        <ExternalLink className="w-4 h-4" />
        Vezi comenzile pe Zenyth.ro
      </a>
    </div>
  );
};

export default OrdersSection;
