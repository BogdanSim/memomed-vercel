import { memo, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Search, Pill, Check } from 'lucide-react';
import type { ZenythProduct } from '@/data/zenythProducts';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';


const Refill = () => {
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ZenythProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    supabase.from('products').select('*').order('name')
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) setError('Nu am putut încărca produsele');
        else setProducts((data ?? []).map((row: any): ZenythProduct => ({
          id: String(row.id),
          name: row.name,
          sku: row.sku,
          image: row.image,
          price: row.price,
          currency: row.currency,
          unitsPerPackage: row.units_per_package,
          unitLabel: row.unit_label,
          category: row.category,
          description: row.description,
          url: row.url,
          unitsPerIntake: row.units_per_intake,
          frequencyPerDay: row.frequency_per_day,
          daysRemaining: row.days_remaining,
          totalDays: row.total_days,
        })));
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const searchValue = search.trim().toLowerCase();

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(searchValue)),
    [products, searchValue]
  );

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-1">Produsele noastre</h1>
        <p className="text-sm text-muted-foreground mb-5">Alege produsul și comandă rapid</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută produs..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-card text-sm border border-border outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
      </div>

      {error && <p className="text-xs text-destructive mb-4">{error}</p>}
      {isLoading && !error && <p className="text-xs text-muted-foreground mb-4">Se încarcă produsele...</p>}

      {filteredProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Toate produsele</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onAdd={() => { addItem(product); toast.success(`${product.name} adăugat în coș`); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cart banner */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-50"
          >
            <button
              onClick={() => navigate('/checkout')}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-between px-5 shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
            >
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{totalItems}</span>
              <span>Vezi coșul</span>
              <ShoppingCart className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type ProductCardProps = {
  product: ZenythProduct;
  index: number;
  onAdd: () => void;
};

const ProductCard = memo(({ product, index, onAdd }: ProductCardProps) => {
  const isMedication = product.name.toLowerCase().includes('paracetamol') || product.category.toLowerCase().includes('medicament');
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = () => {
    if (justAdded) return;
    onAdd();
    setJustAdded(true);
    timerRef.current = setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card rounded-[20px] border border-border shadow-sm overflow-hidden flex flex-col"
    >
      <div className="p-3 flex flex-col gap-3">
        <div className="w-full rounded-2xl bg-white flex items-center justify-center overflow-hidden aspect-[4/3] p-3">
          {isMedication ? (
            <Pill className="w-12 h-12 text-primary" />
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-sm leading-tight">{product.name}</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{product.description}</p>
          <p className="text-[10px] text-muted-foreground">
            {product.unitsPerPackage} {product.unitLabel}
          </p>
        </div>

        <div className="flex justify-end">
          <span className="text-[10px] font-semibold">{product.price} {product.currency}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-3">
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.93 }}
            animate={justAdded ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.25, type: 'spring' }}
            className={`w-full rounded-2xl text-[11px] font-semibold flex items-center justify-center gap-2 shadow-sm px-4 py-3 transition-colors duration-300 ${
              justAdded ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  className="flex items-center gap-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <motion.div
                    initial={{ rotate: -30, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                  Adăugat!
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  className="flex items-center gap-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adaugă în coș
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-2xl bg-secondary text-secondary-foreground text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform px-4 py-3"
            aria-label={`Vezi detalii pentru ${product.name}`}
          >
            <Eye className="w-4 h-4" />
            Vezi detalii
          </a>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default Refill;
