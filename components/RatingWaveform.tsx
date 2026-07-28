'use client';

import { useState } from 'react';

// Organic relative bar heights so the rating reads as a little waveform
// silhouette rather than five identical rectangles.
const BAR_HEIGHTS = [0.55, 0.85, 1, 0.7, 0.9];

type Props = {
  rating: number | null;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: boolean;
};

const SIZES = {
  sm: { height: 18, width: 3, gap: 2 },
  md: { height: 28, width: 4, gap: 3 },
  lg: { height: 44, width: 6, gap: 5 },
};

export default function RatingWaveform({ rating, onChange, size = 'md', label = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = Boolean(onChange);
  const active = hovered ?? rating ?? 0;
  const dims = SIZES[size];

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="inline-flex items-end"
        style={{ gap: dims.gap, height: dims.height }}
        onMouseLeave={() => setHovered(null)}
        role={interactive ? 'radiogroup' : undefined}
        aria-label={interactive ? 'Rating' : rating ? `Rated ${rating} out of 5` : 'Not rated'}
      >
        {BAR_HEIGHTS.map((h, i) => {
          const value = i + 1;
          const filled = value <= active;
          const bar = (
            <span
              key={value}
              className={`block rounded-sm transition-colors ${
                filled ? 'bg-amber' : 'bg-line'
              } ${interactive ? 'cursor-pointer' : ''}`}
              style={{ width: dims.width, height: Math.round(dims.height * h) }}
            />
          );

          if (!interactive) return bar;

          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5`}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onClick={() => onChange?.(value)}
              className="focus-visible:outline-none"
            >
              {bar}
            </button>
          );
        })}
      </div>
      {label && (
        <span className="font-mono text-xs text-slate">
          {rating ? `${rating}/5` : 'unrated'}
        </span>
      )}
    </div>
  );
}
