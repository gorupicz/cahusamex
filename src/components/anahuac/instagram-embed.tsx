import { Instagram } from 'lucide-react';
import { anahuacProgram } from '@/data/anahuac';

/**
 * Program video.
 *
 * Instagram blocks autoplay inside its own iframe embed, so when a self-hosted
 * copy of the reel is available (`anahuacProgram.instagramVideoSrc`) we render a
 * native <video> that autoplays muted on load. Otherwise we fall back to the
 * official Instagram embed, which requires one tap to play.
 */
const InstagramEmbed = () => {
  const { instagramUrl, instagramVideoSrc } = anahuacProgram;

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-2xl border border-anahuac-100 bg-white shadow-xl">
        {instagramVideoSrc ? (
          <video
            src={instagramVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            className="aspect-[9/16] w-full bg-navy object-cover"
          />
        ) : (
          <iframe
            src={`${instagramUrl.replace(/\/$/, '')}/embed/captioned/`}
            title="Certificación en IA Aplicada — Universidad Anáhuac Cancún"
            className="h-[640px] w-full border-0"
            scrolling="no"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-navy transition-colors hover:text-anahuac"
      >
        <Instagram size={16} aria-hidden="true" />
        Ver el video en Instagram
      </a>
    </div>
  );
};

export default InstagramEmbed;
