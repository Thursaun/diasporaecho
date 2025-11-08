import { useEffect, useRef, useState } from 'react';
import FigureCard from './FigureCard';

// =============================================================================
// PERFORMANCE OPTIMIZATION: Lazy Loading Wrapper for FigureCard
// =============================================================================

/**
 * LazyFigureCard - Wrapper component that delays rendering of FigureCard
 * until it's near the viewport using Intersection Observer
 *
 * PERFORMANCE BENEFITS:
 * - Reduces initial render time by only rendering visible cards
 * - Decreases memory usage by deferring off-screen components
 * - Improves scroll performance with progressive loading
 * - Shows skeleton while loading for better UX
 */
function LazyFigureCard(props) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    // PERFORMANCE: Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // PERFORMANCE: Mark as visible and stop observing
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // PERFORMANCE: Optimized loading - start earlier for smoother UX
        rootMargin: '200px', // Load when 200px before entering viewport (increased from 50px)
        threshold: 0.01, // Trigger when even 1% is visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className="w-full">
      {isVisible ? (
        <FigureCard {...props} />
      ) : (
        // PERFORMANCE: Lightweight skeleton placeholder
        <div className="card relative w-full max-w-sm aspect-[1/1.4] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 flex flex-col p-6 pt-14">
            {/* Skeleton for badge */}
            <div className="absolute top-4 left-4 w-20 h-6 bg-white/40 rounded-full"></div>

            {/* Skeleton for title */}
            <div className="h-8 bg-black/10 rounded-xl w-3/4 mb-4"></div>

            {/* Skeleton for description */}
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-black/5 rounded w-full"></div>
              <div className="h-3 bg-black/5 rounded w-5/6"></div>
              <div className="h-3 bg-black/5 rounded w-4/6"></div>
            </div>

            {/* Skeleton for buttons */}
            <div className="flex justify-between items-end mt-auto">
              <div className="h-6 w-16 bg-black/10 rounded-lg"></div>
              <div className="flex gap-2">
                <div className="h-7 w-16 bg-black/10 rounded-lg"></div>
                <div className="h-7 w-16 bg-black/10 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LazyFigureCard;
