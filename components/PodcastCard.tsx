import Link from 'next/link';
import RatingStars from '@/components/RatingStars';

type Props = {
  slug: string;
  title: string;
  coverUrl: string | null;
  hostNames?: string | null;
  averageRating?: number | null;
  ratingCount?: number;
};

export default function PodcastCard({ slug, title, coverUrl, hostNames, averageRating, ratingCount }: Props) {
  return (
    <Link href={`/podcasts/${slug}`} className="group flex gap-3">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-raised">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-slate">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-display text-sm font-medium text-cream group-hover:text-amber transition-colors">
          {title}
        </h3>
        {hostNames && <p className="truncate text-xs text-slate">{hostNames}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          <RatingStars rating={averageRating ? Math.round(averageRating) : null} size="sm" />
          {typeof ratingCount === 'number' && ratingCount > 0 && (
            <span className="font-mono text-[11px] text-slate">{ratingCount}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
