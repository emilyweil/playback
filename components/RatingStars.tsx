'use client';

import { useState } from 'react';

type Props = {
  rating: number | null;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: boolean;
};

const SIZES = {
  sm: 14,
  md: 20,
  lg: 30,
};

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={filled ? 'text-amber' : 'text-line'}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3 5.9 20.5l1.3-6.6-4.9-4.5 6.6-.8L12 2.5z" />
    </svg>
  );
}

export default function RatingStars({ rating, onChange, size = 'md', label = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const active = hovered ?? rating ?? 0;
  const px = SIZES[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
        role={interactive ? 'radiogroup' : undefined}
        aria-label={interactive ? 'Rating' : rating ? `Rated ${rating} out of 5` : 'Not rated'}
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const star = <Star key={value} filled={value <= active} size={px} />;

          if (!interactive) return star;

          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5`}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onClick={() => onChange?.(value)}
              className="cursor-pointer focus-visible:outline-none"
            >
              {star}
            </button>
          );
        })}
      </div>
      {label && <span className="font-mono text-xs text-slate">{rating ? `${rating}/5` : 'unrated'}</span>}
    </div>
  );
}
