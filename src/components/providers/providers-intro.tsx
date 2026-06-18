const ProvidersIntro = () => {
  return (
    <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-navy mb-6">¿Por qué afiliarte como Proveedor?</h2>
        <p className="text-gray-600 mb-4">
          Si tu empresa comercializa servicios turísticos, bienes y servicios conexos o
          soluciones tecnológicas para propietarios y administradores de rentas vacacionales,
          la Cámara es tu puerta de entrada a un mercado activo y en crecimiento en México y USA.
        </p>
        <p className="text-gray-600 mb-4">
          Afiliarte te conecta directamente con quienes toman las decisiones de compra: ganas
          visibilidad dentro de la comunidad, presencia en los eventos presenciales y un lugar
          en una red consolidada de la industria de la hospitalidad.
        </p>
        <p className="text-gray-600">
          Más que un directorio, somos una comunidad donde proveedores y operadores construyen
          relaciones comerciales de largo plazo.
        </p>
      </div>
      <div className="rounded-xl overflow-hidden shadow-lg">
        <img
          src="/uploads/providers-networking.jpg"
          alt="Proveedores y operadores de rentas vacacionales en un evento de networking de la Cámara"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ProvidersIntro;
