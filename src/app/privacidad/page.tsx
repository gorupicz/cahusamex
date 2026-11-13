import type { Metadata } from 'next';
import Link from 'next/link';
import { CONNECT_PATH, DIRECTORY_PATH, EDIT_PATH } from '@/lib/directory/config';
import { siteConfig } from '@/data/site-config';

export const metadata: Metadata = {
  title: 'Aviso de privacidad',
  description: 'Cómo trata CAHUSA MX los datos del directorio y de Connect.',
  alternates: { canonical: '/privacidad' },
};

// Written without a lawyer's review (same as the Cancún Tech Day notice it is based on).
const CONTACT = 'goru@cahusa.mx';

export default function PrivacyPage() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="mb-2 font-heading text-4xl text-navy">Aviso de privacidad</h1>
      <p className="mb-10 text-sm text-muted-foreground">Directorio y Connect · Última actualización: 13 de noviembre de 2026</p>

      <div className="space-y-8 text-navy/90 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:text-navy [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        <section>
          <h2>Quién trata tus datos</h2>
          <p>
            {siteConfig.name} (&quot;CAHUSA MX&quot;) trata los datos de su{' '}
            <Link href={DIRECTORY_PATH} className="text-teal underline">
              directorio
            </Link>{' '}
            y de{' '}
            <Link href={CONNECT_PATH} className="text-teal underline">
              Connect
            </Link>
            . Para cualquier pregunta o solicitud sobre tus datos escríbenos a{' '}
            <a href={`mailto:${CONTACT}`} className="text-teal underline">
              {CONTACT}
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Qué datos tenemos y de dónde vienen</h2>
          <ul>
            <li>
              <strong>Registros a eventos.</strong> Si te registraste a un evento de CAHUSA MX en Luma, tomamos tu nombre, correo,
              empresa, cargo, ciudad, LinkedIn y, si el evento lo preguntó, el tamaño de tu empresa. Con eso armamos un borrador privado
              de tu perfil.
            </li>
            <li>
              <strong>Lo que tú escribes.</strong> Cuando entras a{' '}
              <Link href={EDIT_PATH} className="text-teal underline">
                tu perfil
              </Link>{' '}
              y lo guardas: descripción, servicios, categorías, sitio web, WhatsApp, foto o logo.
            </li>
            <li>
              <strong>Inicio de sesión.</strong> El código de 6 dígitos que te enviamos (guardado de forma cifrada y con vencimiento de
              10 minutos) y una huella cifrada de tu dirección IP para limitar abusos.
            </li>
            <li>
              <strong>Connect.</strong> Las descripciones de cliente ideal que escribes, los resultados de tus búsquedas, las intros que
              pides y, si te suscribes, el estado de tu suscripción.
            </li>
          </ul>
        </section>

        <section>
          <h2>El directorio</h2>
          <p>
            Tu perfil solo es público si tú lo publicas, y puedes despublicarlo cuando quieras. Tu correo nunca se muestra. Tu LinkedIn y
            tu WhatsApp tampoco, salvo que tengas un plan de pago de Connect y elijas mostrarlos. Quien quiera contactarte pide una
            intro.
          </p>
        </section>

        <section>
          <h2>Connect: sugerencias e intros</h2>
          <ul>
            <li>
              Para sugerir personas que encajan con el cliente ideal que describe un miembro, usamos los datos de trabajo de los perfiles
              (cargo, empresa, tamaño de empresa, frase, categorías, servicios y parte de la descripción), incluidos los borradores no
              publicados.
            </li>
            <li>
              Ese análisis lo hace Claude, el modelo de inteligencia artificial de Anthropic. Claude recibe esos datos de trabajo, pero
              no nombres, correos, teléfonos ni enlaces de las personas sugeridas.
            </li>
            <li>
              Las sugerencias son anónimas: el miembro ve el tipo de puesto y de empresa, la ciudad y el motivo, nunca tu empresa ni tus
              datos de contacto. En los planes de pago ve tu nombre.
            </li>
            <li>
              Si el miembro pide la intro, Esteban Gorupicz te escribe desde goru@cahusa.mx con el miembro en copia. Ahí conoces quién
              es y decides si responder. Nadie recibe tus datos de contacto sin ese correo.
            </li>
            <li>
              Puedes pedir en cualquier momento que no te sugiramos ni te enviemos intros escribiendo a{' '}
              <a href={`mailto:${CONTACT}`} className="text-teal underline">
                {CONTACT}
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2>Pagos</h2>
          <p>
            Las suscripciones a Connect se cobran con Stripe. Los datos de tu tarjeta los recibe y guarda Stripe, no CAHUSA MX; nosotros
            solo guardamos el estado de tu suscripción.
          </p>
        </section>

        <section>
          <h2>Con quién compartimos datos</h2>
          <ul>
            <li>Supabase, donde se guarda la base de datos y las fotos.</li>
            <li>Vercel, donde corre el sitio.</li>
            <li>Resend, que envía los códigos de acceso y las intros.</li>
            <li>Anthropic (Claude), para las sugerencias de Connect, en los términos de arriba.</li>
            <li>Stripe, para los pagos.</li>
          </ul>
          <p className="mt-3">No vendemos tus datos ni los usamos para publicidad.</p>
        </section>

        <section>
          <h2>Tus derechos</h2>
          <p>
            Puedes acceder, corregir, cancelar u oponerte al uso de tus datos (derechos ARCO). Casi todo lo puedes hacer tú mismo en tu
            perfil; para borrarlo por completo o para cualquier otra solicitud escríbenos a{' '}
            <a href={`mailto:${CONTACT}`} className="text-teal underline">
              {CONTACT}
            </a>
            .
          </p>
        </section>
      </div>
    </section>
  );
}
