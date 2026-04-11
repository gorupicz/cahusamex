import Link from 'next/link';

const CtaSection = () => {
  return (
    <section className="bg-teal text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Eres Property Manager o Anfitrión?</h2>
        <p className="text-xl max-w-3xl mx-auto mb-8">
          Únete a nuestra comunidad y conecta con los mejores profesionales de la industria en México
        </p>
        <Link href="/contact" className="bg-white text-teal px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Contáctanos
        </Link>
      </div>
    </section>
  );
};

export default CtaSection;
