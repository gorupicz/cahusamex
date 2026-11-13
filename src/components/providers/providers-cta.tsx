import Link from 'next/link';

const ProvidersCta = () => {
  return (
    <div className="text-center">
      <h2 className="text-navy mb-6">¿Listo para llegar a más operadores?</h2>
      <p className="text-gray-600 max-w-3xl mx-auto mb-8">
        Contamos con una membresía pensada para cada tipo de proveedor —local, regional y
        tecnológico—. Cuéntanos a qué se dedica tu empresa y te ayudamos a elegir la opción que
        más impulse tu negocio.
      </p>
      <Link href="/contact" className="btn-primary">Contactar</Link>
    </div>
  );
};

export default ProvidersCta;
