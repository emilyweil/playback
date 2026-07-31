import Link from 'next/link';
import RatingStars from '@/components/RatingStars';

type Props = {
  slug: string;
  title: string;
  coverUrl: string | null;
  averageRating?: number | null;
  ratingCount?: number;
  caption?: string;
};

export default function PodcastTile({ slug, title, coverUrl, averageRating, ratingCount, caption }: Props) {
  return (
    <Link href={`/podcasts/${slug}`} className="group w-32 flex-shrink-0 sm:w-36">
      <div className="aspect-square w-full overflow-hidden rounded bg-raised">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-slate">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 font-display text-sm font-medium text-cream group-hover:text-amber transition-colors">
        {title}
      </h3>
      <div className="mt-1 flex items-center gap-1.5">
        <RatingStars rating={averageRating ? Math.round(averageRating) : null} size="sm" />
        {typeof ratingCount === 'number' && ratingCount > 0 && (
          <span className="font-mono text-[11px] text-slate">{ratingCount}</span>
        )}
      </div>
      {caption && <p className="mt-1 truncate text-[11px] text-slate">{caption}</p>}
    </Link>
  );
}
