import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';

const PaymentSection = () => (
  <div className="space-y-4">
    <div className="bg-secondary/50 rounded-2xl p-4 flex gap-3 items-start">
      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        Metodele de plată sunt gestionate în mod securizat de Zenyth.ro.
        Nu stocăm datele cardului în această aplicație.
      </p>
    </div>

    <div className="text-center py-10 text-muted-foreground">
      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium mb-1">Gestionează pe Zenyth.ro</p>
      <p className="text-xs max-w-[220px] mx-auto">
        Adaugă sau modifică metodele de plată direct pe site-ul Zenyth.
      </p>
    </div>

    <a
      href="https://zenyth.ro/contul-meu"
      target="_blank"
      rel="noopener noreferrer"
      className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
    >
      <ExternalLink className="w-4 h-4" />
      Mergi la Zenyth.ro
    </a>
  </div>
);

export default PaymentSection;
