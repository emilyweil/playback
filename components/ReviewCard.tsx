import Link from 'next/link';
import RatingStars from '@/components/RatingStars';

type ReviewRow = {
  id: string;
  rating: number | null;
  body: string | null;
  listened_at: string;
  created_at: string;
  episode_id: string | null;
  profiles: { username: string; display_name: string | null } | null;
  podcasts: { title: string; slug: string } | null;
  episodes: {
    title: string;
    episode_number: number | null;
    season_number: number | null;
    podcasts: { title: string; slug: string } | null;
  } | null;
};

export default function ReviewCard({ review, showAuthor = true }: { review: ReviewRow; showAuthor?: boolean }) {
  const target = review.podcasts
    ? { label: review.podcasts.title, href: `/podcasts/${review.podcasts.slug}` }
    : review.episodes
      ? {
          label: `${review.episodes.podcasts?.title ?? 'Unknown podcast'} — ${
            review.episodes.season_number ? `S${review.episodes.season_number} ` : ''
          }${review.episodes.episode_number ? `E${review.episodes.episode_number}` : ''} ${review.episodes.title}`,
          href: `/episodes/${review.episode_id}`,
        }
      : { label: 'Unknown', href: '#' };

  return (
    <article className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {showAuthor && review.profiles && (
            <Link
              href={`/u/${review.profiles.username}`}
              className="font-display text-sm font-medium text-cream hover:text-amber transition-colors"
            >
              {review.profiles.display_name || review.profiles.username}
            </Link>
          )}
          <div className="mt-0.5 truncate text-sm text-slate">
            {review.episodes ? (
              <>
                logged{' '}
                <Link href={`/podcasts/${review.episodes.podcasts?.slug}`} className="text-cream hover:text-amber">
                  {review.episodes.podcasts?.title}
                </Link>
                {' — '}
                <span className="font-mono">
                  {review.episodes.season_number ? `S${review.episodes.season_number} ` : ''}
                  {review.episodes.episode_number ? `E${review.episodes.episode_number}` : ''}
                </span>{' '}
                {review.episodes.title}
              </>
            ) : (
              <>
                logged{' '}
                <Link href={target.href} className="text-cream hover:text-amber">
                  {target.label}
                </Link>
              </>
            )}
          </div>
        </div>
        {review.rating && <RatingStars rating={review.rating} size="sm" />}
      </div>

      {review.body && (
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-cream/90">{review.body}</p>
      )}

      <time className="mt-2 block font-mono text-[11px] text-slate">
        {new Date(review.listened_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </time>
    </article>
  );
}
