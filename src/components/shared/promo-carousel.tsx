import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

interface PromoSlide {
  id: number;
  image: string;
  title: string;
  description: string;
  link?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
    title: 'Nouvelle Collection Mode',
    description: 'Jusqu\'à -40% sur toute la collection automne-hiver',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop',
    title: 'High-Tech en Promo',
    description: 'Les meilleurs smartphones et laptops aux meilleurs prix',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    title: 'Mode Africaine Authentique',
    description: 'Découvrez nos créations en wax et bazin',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=400&fit=crop',
    title: 'Audio Premium',
    description: 'Casques et écouteurs des plus grandes marques',
  },
];

export function PromoCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <div className="w-full mb-4">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent>
          {PROMO_SLIDES.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full h-32 md:h-48 lg:h-56 rounded-lg overflow-hidden group cursor-pointer">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
                  <div className="p-4 md:p-8 max-w-xl">
                    <h2 className="text-white font-bold text-lg md:text-2xl lg:text-3xl mb-1 md:mb-2">
                      {slide.title}
                    </h2>
                    <p className="text-white/90 text-xs md:text-sm lg:text-base">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}
