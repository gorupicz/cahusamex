import Link from 'next/link';

const JoinCta = () => {
  return (
    <div className="text-center">
      <h2 className="text-navy mb-6">¿Quieres ser parte de la Cámara?</h2>
      <p className="text-gray-600 max-w-3xl mx-auto mb-8">
        Si eres operador de renta vacacional y quieres impulsar la competitividad de tu negocio en México y USA, contáctanos.
      </p>
      <Link href="/contact" className="btn-primary">Contáctanos</Link>
    </div>
  );
};

export default JoinCta;
