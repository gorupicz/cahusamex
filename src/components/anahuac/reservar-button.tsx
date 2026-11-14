import { ArrowRight } from 'lucide-react';

type Variant = 'orange' | 'navy' | 'outline';

interface ReservarButtonProps {
  variant?: Variant;
  label?: string;
  className?: string;
}

const variants: Record<Variant, string> = {
  orange:
    'bg-anahuac text-white hover:bg-anahuac-600 shadow-lg shadow-anahuac/30',
  navy: 'bg-navy text-white hover:bg-navy-light',
  outline:
    'border-2 border-anahuac text-anahuac hover:bg-anahuac hover:text-white',
};

/**
 * Repeated conversion CTA. Always scrolls to the inscription form — the payment
 * step lives behind the form's own submit button, so the data is captured before
 * anyone reaches Stripe.
 */
const ReservarButton = ({
  variant = 'orange',
  label = 'RESERVAR INSCRIPCIÓN',
  className = '',
}: ReservarButtonProps) => {
  return (
    <a
      href="#inscripcion"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 font-heading text-base font-semibold tracking-wide transition-colors ${variants[variant]} ${className}`}
    >
      {label}
      <ArrowRight size={18} aria-hidden="true" />
    </a>
  );
};

export default ReservarButton;
