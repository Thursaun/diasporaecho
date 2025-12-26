import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFigures } from '../../utils/api';
import LazyFigureCard from './LazyFigureCard';

// =============================================================================
// PERFORMANCE IMPROVEMENTS: Pagination & Loading Optimization
// =============================================================================

const categories = [
  "Scholars & Educators",
  "Activists & Freedom Fighters",
  "Political Leaders",
  "Arts & Entertainment",
  "Musicians",
  "Inventors & Innovators",
  "Athletes",
  "Pan-African Leaders",
  "Literary Icons",
  "Business & Entrepreneurs",
];

// PERFORMANCE: Pagination constants for faster initial load
const FIGURES_PER_PAGE = 12;
const INITIAL_LOAD = 8; // Load only 8 cards initially for faster rendering

function Echoes({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [], currentUser }) {
  // =============================================================================
  // STATE MANAGEMENT: Optimized for performance
  // =============================================================================

  // PERFORMANCE: Check localStorage for cached figures on mount to avoid loading flash
  const [allFigures, setAllFigures] = useState(() => {
    try {
      const cached = localStorage.getItem('diaspora_figures');
      if (cached) {
        console.log('⚡ Initializing with cached figures from localStorage');
        return JSON.parse(cached);
      }
    } catch (e) { /* ignore */ }
    return [];
  });
  // Only show loading if we have NO cached data
  const [loading, setLoading] = useState(() => !localStorage.getItem('diaspora_figures'));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const [searchQuery, setSearchQuery] = useState(""); // Filter figures by name

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
    
    // Helper: Extract last name (last word of name) for sorting
    const getLastName = (name) => {
      if (!name) return '';
      const parts = name.trim().split(' ');
      return parts[parts.length - 1].toLowerCase();
    };
    
    // Helper: Sort figures by last name A-Z
    const sortByLastName = (figures) => {
      return [...figures].sort((a, b) => {
        const lastNameA = getLastName(a.name);
        const lastNameB = getLastName(b.name);
        return lastNameA.localeCompare(lastNameB);
      });
    };
    
    // Sort "all" and each category by last name
    const categorized = { all: sortByLastName(allFigures) };
    
    categories.forEach((category) => {
      // Multi-category support: check if figure's categories array includes this category
      // Also supports legacy single category field for backwards compatibility
      const filtered = allFigures.filter((figure) => 
        figure.categories?.includes(category) || figure.category === category
      );
      categorized[category] = sortByLastName(filtered);
    });
    
    console.log('✅ Categorized figures calculated (sorted by last name):', Object.keys(categorized).map(key => `${key}: ${categorized[key].length}`));
    return categorized;
  }, [allFigures]);

  // PERFORMANCE: Get current figures to display with pagination and search filter
  const currentFigures = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    
    // Filter by search query if provided
    const filtered = searchQuery.trim()
      ? categoryFigures.filter(fig => {
          const query = searchQuery.toLowerCase();
          return (
            fig.name?.toLowerCase().includes(query) ||
            fig.description?.toLowerCase().includes(query) ||
            fig.tags?.some(tag => tag.toLowerCase().includes(query))
          );
        })
      : categoryFigures;
    
    const sliced = filtered.slice(0, displayCount);
    console.log(`📊 Displaying ${sliced.length} of ${filtered.length} figures (category: ${activeCategory}, search: "${searchQuery}")`);
    return sliced;
  }, [categorizedFigures, activeCategory, displayCount, searchQuery]);

  // PERFORMANCE: Check if more figures can be loaded (accounting for search filter)
  const hasMoreFigures = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    const filtered = searchQuery.trim()
      ? categoryFigures.filter(fig => {
          const query = searchQuery.toLowerCase();
          return (
            fig.name?.toLowerCase().includes(query) ||
            fig.description?.toLowerCase().includes(query) ||
            fig.tags?.some(tag => tag.toLowerCase().includes(query))
          );
        })
      : categoryFigures;
    return displayCount < filtered.length;
  }, [categorizedFigures, activeCategory, displayCount, searchQuery]);

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
    // PERFORMANCE: Only show loading if we don't have cached data already
    if (allFigures.length === 0) {
      setLoading(true);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Header with performance stats */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-gray-900">Echoes Gallery</h1>
          {!loading && allFigures.length > 0 && (
            <p className="text-sm sm:text-base text-gray-600">
              Explore {allFigures.length} inspiring figures from history.
            </p>
          )}
        </div>

      {/* FILTER BAR: Dropdown + Search */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Category Dropdown */}
          <div className="relative flex-shrink-0 sm:w-64">
            <select
              value={activeCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent cursor-pointer shadow-sm hover:border-gray-400 transition-colors"
            >
              <option value="all">All Categories ({categorizedFigures.all?.length || 0})</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category} ({categorizedFigures[category]?.length || 0})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(INITIAL_LOAD); // Reset pagination on search
              }}
              placeholder="Search by name, description, or tags..."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pl-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent shadow-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Active filters indicator */}
        {(activeCategory !== "all" || searchQuery) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Filtering:</span>
            {activeCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                {activeCategory}
                <button onClick={() => setActiveCategory("all")} className="hover:text-secondary/70">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:text-gray-800">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
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
              className="bg-secondary text-white px-6 py-2 rounded hover:bg-opacity-80 transition-colors font-medium"
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
            {currentFigures.map((figure, index) => (
              <div key={`${figure._id || figure.wikipediaId}-${figure.category}`} className="mx-auto w-full max-w-sm">
                <LazyFigureCard
                  figure={figure}
                  onSaveFigureClick={() => onSaveFigureClick(figure)}
                  onLikeFigureClick={handleLikeClick}
                  onLoginClick={onLoginClick}
                  isSaved={isFigureSaved(figure)}
                  isLiked={isFigureLiked(figure)}
                  priority={index < 4} // PERFORMANCE: Eager load first 4 images for better LCP
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
                className="bg-secondary text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md text-sm sm:text-base min-h-[44px]"
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
            {import.meta.env.DEV && (
              <div className="text-xs text-gray-400">
                💡 Dev Mode: Total cached figures: {allFigures.length}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default Echoes;