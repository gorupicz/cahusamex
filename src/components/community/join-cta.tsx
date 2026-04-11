import Link from 'next/link';

const JoinCta = () => {
  return (
    <div className="text-center">
      <h2 className="text-navy mb-6">¿Quieres unirte a nuestra comunidad?</h2>
      <p className="text-gray-600 max-w-3xl mx-auto mb-8">
        Si eres Property Manager o Anfitrión y quieres formar parte de la comunidad de renta vacacional más importante de México, contáctanos.
      </p>
      <Link href="/contact" className="btn-primary">Contáctanos</Link>
    </div>
  );
};

export default JoinCta;
