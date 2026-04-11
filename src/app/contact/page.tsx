import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ContactInfo from '@/components/contact/contact-info';
import ChannelsCard from '@/components/contact/channels-card';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto',
  description: '¿Tienes preguntas o quieres formar parte de nuestra comunidad? ¡Estamos aquí para ayudarte!',
};

export default function ContactPage() {
  return (
    <>
      <Hero
        title="Contáctanos"
        subtitle="¿Tienes preguntas o quieres ser parte de la Cámara? ¡Estamos aquí para ayudarte!"
        backgroundImage="/lovable-uploads/17417649-66f8-462e-8d40-f554ede6af35.png"
      />
      <section className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <ContactInfo />
            <ChannelsCard />
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
