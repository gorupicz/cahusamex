import Link from 'next/link';

interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
}

const Hero = ({
  title,
  subtitle,
  backgroundImage,
  showButton = false,
  buttonText = "Conoce más",
  buttonLink = "/about"
}: HeroProps) => {
  return (
    <div
      className="relative bg-cover bg-center h-[70vh] flex items-center"
      style={{ backgroundImage: `linear-gradient(rgba(26, 58, 84, 0.7), rgba(26, 58, 84, 0.7)), url(${backgroundImage})` }}
    >
      <div className="container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">{title}</h1>
        {subtitle && (
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto animate-slide-up opacity-0" style={{animationDelay: '0.3s'}}>
            {subtitle}
          </p>
        )}
        {showButton && (
          <div className="animate-slide-up opacity-0" style={{animationDelay: '0.6s'}}>
            <Link href={buttonLink!} className="btn-primary">
              {buttonText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
