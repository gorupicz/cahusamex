const providerReach = [
  { value: '1,550+', label: 'Operadores en la comunidad' },
  { value: '16,000+', label: 'Propiedades administradas' },
  { value: '20,000+', label: 'Alcance en canales de difusión' },
];

const ProvidersStats = () => {
  return (
    <div className="bg-navy-light text-white p-8 rounded-xl text-center mb-16">
      <p className="text-xl mb-6">El mercado que alcanzas como proveedor afiliado</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providerReach.map((stat) => (
          <div key={stat.label}>
            <p className="text-5xl font-bold text-teal-light mb-2">{stat.value}</p>
            <p className="text-xl">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProvidersStats;
