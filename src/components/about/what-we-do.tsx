const WhatWeDo = () => {
  return (
    <div className="mb-16">
      <h2 className="text-navy mb-6 text-center">Lo Que Hacemos</h2>
      <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
        Agrupamos a los principales operadores, desarrollamos planes de capacitación y vinculación,
        y creamos estándares de excelencia con impacto social y ambiental.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-navy mb-4">Comunidad</h3>
          <p className="text-gray-600 mb-4">
            Nuestra comunidad cuenta con 1,550 miembros administrando más de 16,000 propiedades
            de renta vacacional.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Grupos curados para propietarios e inversionistas por ciudad</li>
            <li>Grupos curados para Operadores por región</li>
            <li>Todos los grupos son gratuitos para permitir un compromiso genuino</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-navy mb-4">Iniciativas y Actividades</h3>
          <p className="text-gray-600 mb-4">
            Desarrollamos diversas actividades para fortalecer nuestra comunidad:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Cenas de networking en 24 ciudades</li>
            <li>Workshops presenciales con expertos del sector</li>
            <li>Charlas online con líderes de opinión</li>
            <li>Compras colectivas para obtener mejores condiciones</li>
            <li>Colaboraciones entre miembros de la comunidad</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhatWeDo;
