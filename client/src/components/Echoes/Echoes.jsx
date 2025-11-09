import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFigures } from '../../utils/api';
import LazyFigureCard from './LazyFigureCard';

// =============================================================================
// PERFORMANCE IMPROVEMENTS: Pagination & Loading Optimization
// =============================================================================

const categories = [
  "Intellectuals Leaders",
  "Civil Rights Activists", 
  "Political Leaders",
  "Educators & Scholars",
  "Arts, Culture & Entertainment",
  "Inventors & Innovators",
  "Athletic Icons",
  "Freedom Fighters",
  "Pan-African Leaders",
  "Literary Icons",
];

// PERFORMANCE: Pagination constants for faster initial load
const FIGURES_PER_PAGE = 12;
const INITIAL_LOAD = 8; // Load only 8 cards initially for faster rendering

function Echoes({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [], currentUser }) {
  // =============================================================================
  // STATE MANAGEMENT: Optimized for performance
  // =============================================================================

  const [allFigures, setAllFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized like handler with local state update
  // =============================================================================

  const handleLikeClick = useCallback(async (figure) => {
    const figureId = figure._id || figure.wikipediaId;
    console.log(`🎯 Echoes handleLikeClick: ${figure.name} (current likes: ${figure.likes})`);

    // PERFORMANCE: Optimistic update - immediately update UI
    setAllFigures((prevFigures) =>
      prevFigures.map((fig) => {
        const currentId = fig._id || fig.wikipediaId;
        if (currentId === figureId) {
          return {
            ...fig,
            likes: (fig.likes || 0) + 1, // Optimistically increment
          };
        }
        return fig;
      })
    );

    // Call parent handler in background
    try {
      const updatedFigure = await onLikeFigureClick(figure);
      console.log(`✅ Server like successful for ${figure.name}, new count: ${updatedFigure.likes}`);

      // PERFORMANCE: Update only the specific figure with server response (including likedBy)
      setAllFigures((prevFigures) =>
        prevFigures.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return {
              ...fig,
              likes: updatedFigure.likes, // Use actual server count
              likedBy: updatedFigure.likedBy, // Update likedBy array for like status check
            };
          }
          return fig;
        })
      );
    } catch (error) {
      console.error("❌ Like action failed:", error);

      // PERFORMANCE: Revert optimistic update on error
      setAllFigures((prevFigures) =>
        prevFigures.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return {
              ...fig,
              likes: (fig.likes || 1) - 1, // Revert the increment
            };
          }
          return fig;
        })
      );
    }
  }, [onLikeFigureClick]);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Calculations
  // =============================================================================
  
  // PERFORMANCE: Memoize categorized figures to avoid recalculation on every render
  const categorizedFigures = useMemo(() => {
    if (!allFigures.length) return {};
    
    console.log('🔄 Recalculating categorized figures...');
    const categorized = { all: allFigures };
    
    categories.forEach((category) => {
      categorized[category] = allFigures.filter(
        (figure) => figure.category === category
      );
    });
    
    console.log('✅ Categorized figures calculated:', Object.keys(categorized).map(key => `${key}: ${categorized[key].length}`));
    return categorized;
  }, [allFigures]);

  // PERFORMANCE: Get current figures to display with pagination
  const currentFigures = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    const sliced = categoryFigures.slice(0, displayCount);
    console.log(`📊 Displaying ${sliced.length} of ${categoryFigures.length} figures in category: ${activeCategory}`);
    return sliced;
  }, [categorizedFigures, activeCategory, displayCount]);

  // PERFORMANCE: Check if more figures can be loaded
  const hasMoreFigures = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    return displayCount < categoryFigures.length;
  }, [categorizedFigures, activeCategory, displayCount]);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Helper Functions
  // =============================================================================
  
  // PERFORMANCE: Memoize saved figure checking to avoid recalculation
  const isFigureSaved = useCallback((figure) => {
    if (!figure || !savedFigures) return false;

    const figureId = figure.wikipediaId || figure._id;
    return savedFigures.some((savedFigure) => {
      const savedId = savedFigure.wikipediaId || savedFigure._id;
      return savedId === figureId;
    });
  }, [savedFigures]);

  // PERFORMANCE: Memoize liked figure checking to avoid recalculation
  const isFigureLiked = useCallback((figure) => {
    if (!figure || !currentUser) return false;

    const likedBy = figure.likedBy || [];
    return likedBy.includes(currentUser._id);
  }, [currentUser]);

  // PERFORMANCE: Optimized load more function with loading state
  const loadMoreFigures = useCallback(() => {
    if (loadingMore || !hasMoreFigures) return;
    
    console.log('📥 Loading more figures...');
    setLoadingMore(true);
    
    // PERFORMANCE: Simulate small delay for better UX (prevents jarring instant loads)
    setTimeout(() => {
      setDisplayCount(prev => {
        const newCount = prev + FIGURES_PER_PAGE;
        console.log(`📈 Display count increased from ${prev} to ${newCount}`);
        return newCount;
      });
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreFigures]);

  // PERFORMANCE: Reset display count when category changes (with optimization)
  const handleCategoryChange = useCallback((category) => {
    if (category === activeCategory) return; // Avoid unnecessary state updates
    
    console.log(`🔄 Switching category from ${activeCategory} to ${category}`);
    setActiveCategory(category);
    setDisplayCount(INITIAL_LOAD);
  }, [activeCategory]);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Data Fetching
  // =============================================================================
  
  useEffect(() => {
    console.log('🚀 Starting figure fetch...');
    setLoading(true);
    setError(null);
    
    // PERFORMANCE: Add timeout for better error handling
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Request timeout reached');
      setError("Request timed out. Please try again.");
      setLoading(false);
    }, 30000); // 30 second timeout
    
    getFigures()
      .then((data) => {
        clearTimeout(timeoutId);
        console.log("✅ Figures fetched successfully:", data.length, "figures");
        setAllFigures(data);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("❌ Error fetching figures:", err);
        setError("Failed to load figures. Please check your connection and try again.");
        setLoading(false);
      });

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Rendering
  // =============================================================================

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
      {/* Header with performance stats */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Echoes Gallery</h1>
        {!loading && allFigures.length > 0 && (
          <p className="text-sm sm:text-base text-gray-600">
            Explore {allFigures.length} inspiring figures from history.
          </p>
        )}
      </div>

      {/* PERFORMANCE: Optimized Category Navigation with scroll optimization */}
      <div className="mb-6 sm:mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex border-b border-gray-300 w-full min-w-max">
          <button
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium relative whitespace-nowrap transition-colors duration-200 min-h-[44px] flex items-center ${
              activeCategory === "all"
                ? "text-secondary"
                : "text-gray-500 hover:text-secondary"
            }`}
            onClick={() => handleCategoryChange("all")}
          >
            <span>All Figures</span>
            {!loading && (
              <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs">
                {categorizedFigures.all?.length || 0}
              </span>
            )}
            {activeCategory === "all" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary"></span>
            )}
          </button>

          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium relative whitespace-nowrap transition-colors duration-200 min-h-[44px] flex items-center ${
                activeCategory === category
                  ? "text-secondary"
                  : "text-gray-500 hover:text-secondary"
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              <span>{category}</span>
              {!loading && (
                <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs">
                  {categorizedFigures[category]?.length || 0}
                </span>
              )}
              {activeCategory === category && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PERFORMANCE: Optimized Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
          <p className="text-gray-600 font-medium">Loading figures...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment on first load</p>
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
            <div className="bg-secondary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* PERFORMANCE: Enhanced Error State with retry functionality */}
      {error && !loading && (
        <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Loading Failed</h3>
          <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-secondary text-dark px-6 py-2 rounded hover:bg-opacity-80 transition-colors font-medium"
            >
              Retry Loading
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                getFigures().then(setAllFigures).catch(() => setError("Failed again"));
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* PERFORMANCE: Empty State */}
      {!loading && !error && allFigures.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No figures found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            There are no figures in the database yet. Check back later!
          </p>
        </div>
      )}

      {/* PERFORMANCE: Optimized Figures Grid with key optimization */}
      {!loading && !error && allFigures.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {currentFigures.map((figure) => (
              <div key={`${figure._id || figure.wikipediaId}-${figure.category}`} className="mx-auto w-full max-w-sm">
                <LazyFigureCard
                  figure={figure}
                  onSaveFigureClick={() => onSaveFigureClick(figure)}
                  onLikeFigureClick={handleLikeClick}
                  onLoginClick={onLoginClick}
                  isSaved={isFigureSaved(figure)}
                  isLiked={isFigureLiked(figure)}
                />
              </div>
            ))}

            {/* PERFORMANCE: Show message when category is empty */}
            {currentFigures.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">No figures in this category</h4>
                <p className="text-gray-500">Try selecting a different category to explore more figures.</p>
              </div>
            )}
          </div>

          {/* PERFORMANCE: Optimized Load More Button */}
          {hasMoreFigures && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={loadMoreFigures}
                disabled={loadingMore}
                className="bg-secondary text-dark px-6 sm:px-8 py-3 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md text-sm sm:text-base min-h-[44px]"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark mr-3"></div>
                    Loading more...
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Load More Figures</span>
                    <span className="sm:hidden">Load More</span>
                    <span className="ml-2 bg-dark bg-opacity-20 px-2 py-1 rounded text-xs sm:text-sm">
                      {(categorizedFigures[activeCategory]?.length || 0) - displayCount} remaining
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* PERFORMANCE: Results summary with performance info */}
          <div className="text-center mt-6 space-y-2">
            <div className="text-sm text-gray-500">
              Showing {currentFigures.length} of {categorizedFigures[activeCategory]?.length || 0} figures
              {activeCategory !== "all" && ` in ${activeCategory}`}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400">
                💡 Dev Mode: Total cached figures: {allFigures.length}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Echoes;