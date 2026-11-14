import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { blogPosts, getBlogPost } from '@/data/blog';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Artículo no encontrado' };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="bg-sand-light">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Link
          href="/blog"
          className="inline-flex items-center text-info hover:text-navy font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al blog
        </Link>

        <header className="mb-8">
          <p className="text-sm text-gray-500 mb-2">
            {formatDate(post.date)} · {post.author}
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-navy leading-tight">
            {post.title}
          </h1>
          {post.body && (
            <p className="mt-5 text-lg text-gray-700 leading-relaxed">
              {post.body}
            </p>
          )}
        </header>

        {post.infographic && (
          <figure className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="w-full overflow-x-auto">
              <iframe
                src={post.infographic.src}
                title={post.title}
                loading="lazy"
                className="block w-full min-w-[1180px] md:min-w-0 h-[1380px] border-0"
              />
            </div>
            <figcaption className="px-5 py-3 text-xs text-gray-500 border-t border-gray-100">
              Infografía: {post.author} · Desliza horizontalmente para verla completa en mobile.
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}
