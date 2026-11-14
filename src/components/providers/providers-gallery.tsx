const gallery = [
  {
    src: '/uploads/providers-dinner.jpg',
    alt: 'Cena de networking de operadores de rentas vacacionales de la Cámara',
  },
  {
    src: '/uploads/providers-event.jpg',
    alt: 'Proveedores y operadores conviviendo en un evento de la Cámara',
  },
  {
    src: '/uploads/providers-sponsor.jpg',
    alt: 'Empresa proveedora presente como sponsor en un evento de la Cámara',
  },
];

const ProvidersGallery = () => {
  return (
    <div className="mb-16">
      <h2 className="text-navy mb-6 text-center">Presencia en cada encuentro</h2>
      <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
        Cenas, capacitaciones y eventos donde proveedores y operadores se conocen y hacen negocio
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gallery.map((photo) => (
          <div key={photo.src} className="rounded-xl overflow-hidden shadow-md card-hover">
            <img src={photo.src} alt={photo.alt} className="w-full h-64 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProvidersGallery;
