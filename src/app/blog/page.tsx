import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Hero from '@/components/Hero';
import { blogPosts } from '@/data/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Análisis, infografías e inteligencia del sector de renta vacacional en México y USA.',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export default function BlogPage() {
  return (
    <>
      <Hero
        title="Blog"
        subtitle="Análisis, infografías e inteligencia del sector de renta vacacional en México y USA"
        backgroundImage="/uploads/27c70ccd-6775-4d50-84e2-e2cd60f72589.png"
      />
      <section className="section-container">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-sm text-gray-500 mb-2">
                    {formatDate(post.date)} · {post.author}
                  </p>
                  <h2 className="text-xl font-heading font-semibold text-navy mb-3 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-700 flex-1">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-6 inline-flex items-center text-info hover:text-navy font-medium transition-colors"
                  >
                    Leer más
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
