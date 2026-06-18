'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';

interface FeaturedProvider {
  name: string;
  category: string;
  logo: string;
  /** Tailwind background for the logo tile, matched to each brand. */
  tile: string;
  description: string;
}

const featuredProviders: FeaturedProvider[] = [
  {
    name: 'Guesty',
    category: 'Property Management · Software',
    logo: '/uploads/providers/guesty.svg',
    tile: 'bg-white',
    description:
      'Plataforma líder de software de property management para rentas vacacionales y estancias cortas: centraliza las reservas de Airbnb, Booking y Vrbo en un solo panel, con channel manager, automatización de mensajes, precios dinámicos y herramientas de operación. Hasta 35% de descuento para afiliados.',
  },
  {
    name: 'Mahora',
    category: 'Conciergerie VIP · Riviera Maya',
    logo: '/uploads/providers/mahora.png',
    tile: 'bg-[#0a0a0a]',
    description:
      'Agencia de conciergerie y el brazo derecho de los anfitriones en la Riviera Maya: se encarga de toda la logística VIP del huésped —transporte legal con placas federales, chefs privados en villa, yates y tours de lujo, y expediciones a cenotes— con atención trilingüe. Los operadores delegan el concierge y ganan comisión preferencial por cada servicio que contratan sus huéspedes.',
  },
  {
    name: 'Rezer',
    category: 'Actividades turísticas · App',
    logo: '/uploads/providers/rezer.png',
    tile: 'bg-[#0a0a0a]',
    description:
      'Plataforma y app para ganar comisiones recomendando y reservando actividades turísticas: tours y excursiones, transporte y entradas a restaurantes y discotecas, todo en un solo lugar. Para anfitriones de Airbnb, comisión preferencial de hasta 45% en los tours de Cancún Sailing.',
  },
  {
    name: 'Zama Beach Club',
    category: 'Beach Club · Isla Mujeres',
    logo: '/uploads/providers/zama.png',
    tile: 'bg-[#1e2a5c]',
    description:
      'Beach club en Playa Norte, Isla Mujeres. Los afiliados disfrutan uso gratuito de camastros, camas y salas, además de acceso a regaderas, baños, albercas y playa. Comisión preferencial del 7% con pagos quincenales.',
  },
  {
    name: 'DewYou',
    category: 'Self-care Club · Puerto Cancún',
    logo: '/uploads/providers/dewyou.png',
    tile: 'bg-[#f5f0e6]',
    description:
      'Self-care club en Puerto Cancún: workouts faciales, nail bar con manicure y pedicure, y un snack & collagen bar con bebidas funcionales y opciones wellness. Comisión del 10% por cada cliente referido, con workouts faciales desde $850 y manicure desde $180.',
  },
  {
    name: 'Cancún Sailing',
    category: 'Tours en catamarán · Isla Mujeres',
    logo: '/uploads/providers/cancun-sailing.svg',
    tile: 'bg-white',
    description:
      'Operador de tours en velero y catamarán a Isla Mujeres desde Cancún: navegación, snorkel en arrecife y día de playa con servicio a bordo. Para afiliados, hasta 45% de comisión en todos los tours.',
  },
  {
    name: 'Onora',
    category: 'Cocina mexicana · Puerto Cancún',
    logo: '/uploads/providers/onora.png',
    tile: 'bg-[#003c1e]',
    description:
      'Restaurante de cocina mexicana contemporánea del chef Jonatán Gómez Luna (estrella Michelin), en Plaza ESPACIO, Puerto Cancún. Un homenaje a las heroínas anónimas de la gastronomía tradicional mexicana, reinterpretada con técnica y creatividad. De día restaurante; de noche, La Cantina de Onora.',
  },
  {
    name: 'Grupo RosaNegra',
    category: 'Restaurantes de lujo · Entertainment',
    logo: '/uploads/providers/rosanegra.png',
    tile: 'bg-[#0a0a0a]',
    description:
      'Grupo de ultra high-end entertainment restaurants fundado por Eduardo Beaven. Reúne más de 10 conceptos —RosaNegra, Tora, Parole, Chambao, entre otros— que fusionan alta cocina con shows, música y un ambiente de celebración. Con presencia en Cancún, Tulum, CDMX, Los Cabos, Isla Mujeres, Madrid y Miami.',
  },
];

const ProvidersCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const paused = useRef(false);

  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      if (!paused.current) api.scrollNext();
    }, 3500);
    return () => clearInterval(id);
  }, [api]);

  return (
    <div
      className="relative max-w-7xl mx-auto px-12"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <Carousel setApi={setApi} opts={{ align: 'start', loop: true }}>
        <CarouselContent>
          {featuredProviders.map((provider) => (
            <CarouselItem key={provider.name} className="basis-full sm:basis-1/2 lg:basis-1/4">
              <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col card-hover">
                <div className={`${provider.tile} h-40 flex items-center justify-center p-8`}>
                  <img
                    src={provider.logo}
                    alt={`Logo de ${provider.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-sm font-medium text-teal mb-2">{provider.category}</span>
                  <h3 className="text-xl font-bold text-navy mb-3">{provider.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{provider.description}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default ProvidersCarousel;
