import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-sand-light">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-teal mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-navy mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
