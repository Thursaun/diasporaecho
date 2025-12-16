import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import FigureCard from "../Echoes/FigureCard";
import LazyFigureCard from "../Echoes/LazyFigureCard";
import { searchFigures, getFeaturedFigures } from "../../utils/api";

function Main({ onSaveFigureClick, onLikeFigureClick, savedFigures, onLoginClick, currentUser }) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featuredFigures, setFeaturedFigures] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // PERFORMANCE: Convert savedFigures array to Map for O(1) lookup instead of O(n)
  const savedFiguresMap = useMemo(() => {
    if (!savedFigures || !Array.isArray(savedFigures)) return new Map();

    const map = new Map();
    savedFigures.forEach((figure) => {
      const id = figure.wikipediaId || figure._id;
      if (id) map.set(id, true);
    });
    return map;
  }, [savedFigures]);

  // PERFORMANCE: Optimized saved check function using Map lookup O(1)
  const checkIsSaved = useCallback((figure) => {
    if (!figure) return false;
    const figureId = figure.wikipediaId || figure._id;
    return savedFiguresMap.has(figureId);
  }, [savedFiguresMap]);

  // PERFORMANCE: Memoized liked check function
  const checkIsLiked = useCallback((figure) => {
    if (!figure || !currentUser) return false;

    const likedBy = figure.likedBy || [];
    return likedBy.includes(currentUser._id);
  }, [currentUser]);

  // PERFORMANCE FIX: Optimized like handler with instant UI update
  const handleLikeClick = useCallback(async (figure) => {
    const figureId = figure._id || figure.wikipediaId;
    console.log(`🎯 Main handleLikeClick: ${figure.name} (current likes: ${figure.likes})`);

    // PERFORMANCE: Optimistic update - immediately update UI for featured figures
    setFeaturedFigures((prevFigures) =>
      prevFigures.map((fig) => {
        const currentId = fig._id || fig.wikipediaId;
        if (currentId === figureId) {
          return { ...fig, likes: (fig.likes || 0) + 1 };
        }
        return fig;
      })
    );

    // PERFORMANCE: Optimistic update - immediately update UI for search results
    setSearchResults((prevResults) =>
      prevResults.map((fig) => {
        const currentId = fig._id || fig.wikipediaId;
        if (currentId === figureId) {
          return { ...fig, likes: (fig.likes || 0) + 1 };
        }
        return fig;
      })
    );

    // Call parent handler in background
    try {
      const updatedFigure = await onLikeFigureClick(figure);
      console.log(`✅ Server like successful for ${figure.name}, new count: ${updatedFigure.likes}`);

      // PERFORMANCE: Update only the specific figure with server response (including likedBy)
      setFeaturedFigures((prevFigures) =>
        prevFigures.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return { ...fig, likes: updatedFigure.likes, likedBy: updatedFigure.likedBy };
          }
          return fig;
        })
      );

      setSearchResults((prevResults) =>
        prevResults.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return { ...fig, likes: updatedFigure.likes, likedBy: updatedFigure.likedBy };
          }
          return fig;
        })
      );
    } catch (error) {
      console.error("❌ Like action failed:", error);

      // PERFORMANCE: Revert optimistic update on error
      setFeaturedFigures((prevFigures) =>
        prevFigures.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return { ...fig, likes: (fig.likes || 1) - 1 };
          }
          return fig;
        })
      );

      setSearchResults((prevResults) =>
        prevResults.map((fig) => {
          const currentId = fig._id || fig.wikipediaId;
          if (currentId === figureId) {
            return { ...fig, likes: (fig.likes || 1) - 1 };
          }
          return fig;
        })
      );
    }
  }, [onLikeFigureClick]);

  // PERFORMANCE: Memoize featured figures to prevent unnecessary re-renders
  // Server returns exactly 3 figures pre-sorted by featuredRank
  const topFeaturedFigures = useMemo(() => featuredFigures, [featuredFigures]);

  // PERFORMANCE: Load featured figures (pre-selected daily, cached on server)
  useEffect(() => {
    setFeaturedLoading(true);
    getFeaturedFigures()
      .then((figures) => {
        console.log('✅ Featured figures loaded:', figures.length);
        setFeaturedFigures(figures);
        setFeaturedLoading(false);

        // PERFORMANCE: Preload featured images for instant display
        figures.slice(0, 3).forEach((figure, index) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = figure.imageUrl;
          link.fetchPriority = index === 0 ? 'high' : 'low';
          document.head.appendChild(link);
        });
      })
      .catch((err) => {
        console.error("❌ Error fetching featured figures:", err);
        setFeaturedLoading(false);
      });
  }, []);

  // PERFORMANCE: Debounced search function to reduce API calls
  const performSearch = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    searchFigures({ query })
      .then((results) => {
        console.log("Search results:", results);
        // Wikipedia backend already handles all filtering and ranking
        setSearchResults(results);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching search results:", err);
        setError("Failed to fetch search results. Please try again.");
        setIsLoading(false);
      });
  }, []);

  // PERFORMANCE: Debounce search input to reduce API calls (300ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery && searchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else if (!searchQuery) {
      setSearchResults([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Handle form submission (immediate search)
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-secondary text-white py-4 sm:py-6">
        <div className="container mx-auto px-4 text-center">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder="Search for historical figures..."
              className="flex-grow p-3 sm:p-4 rounded-lg text-black text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-dark text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-opacity-90 transition duration-300 font-semibold text-base sm:text-lg min-h-[44px]"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </section>

      <section className={`bg-white transition-all duration-500 ${searchQuery ? 'py-4 sm:py-6' : 'py-8 sm:py-12 lg:py-16'}`}>
        <div className="container mx-auto px-4">
          <div className={`text-center transition-all duration-500 ${searchQuery ? 'mb-3 sm:mb-4' : 'mb-6 sm:mb-8 lg:mb-12'}`}>
            <h2 className={`font-bold text-gray-900 transition-all duration-500 ${searchQuery ? 'text-base sm:text-lg md:text-xl mb-1 sm:mb-2' : 'text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4'}`}>
              Featured Figures
            </h2>
            <div className={`bg-gradient-to-r from-secondary to-primary mx-auto transition-all duration-500 ${searchQuery ? 'w-16 sm:w-20 h-px mb-1 sm:mb-2' : 'w-48 sm:w-64 md:w-72 h-1 mb-3 sm:mb-4'}`}></div>
            {!searchQuery && (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Discover the most celebrated figures whose stories continue to inspire and educate
              </p>
            )}
          </div>

          {featuredLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <div className={`grid transition-all duration-500 ${
              searchQuery
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'
            }`}>
              {topFeaturedFigures.map((figure, index) => (
                <div
                  key={figure._id}
                  className={`transform transition-all duration-300 ${
                    searchQuery ? '' : 'hover:scale-105'
                  } mx-auto w-full max-w-sm`}
                >
                  <div className="relative">
                    {!searchQuery && index < 3 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className={`px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          {index === 0 ? '🥇 Most Liked' :
                           index === 1 ? '🥈 Popular' :
                           '🥉 Featured'}
                        </div>
                      </div>
                    )}
                    <FigureCard
                      figure={figure}
                      onLikeFigureClick={handleLikeClick}
                      onSaveFigureClick={onSaveFigureClick}
                      onLoginClick={onLoginClick}
                      isSaved={checkIsSaved(figure)}
                      isLiked={checkIsLiked(figure)}
                      priority={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center mt-8 sm:mt-12">
              <Link
                to="/echoes"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition duration-300 font-semibold text-base sm:text-lg min-h-[44px]"
              >
                Explore All Figures
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {searchQuery && (
        <section className="py-4 sm:py-6 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Search Results
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {searchResults.length > 0
                  ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                  : `Searching for "${searchQuery}"...`
                }
              </p>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
                <p className="text-gray-500">Searching through our collection...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-red-500 mb-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              </div>
            )}

            {searchResults.length === 0 && !isLoading && !error && searchQuery && (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    No results found for &quot;<span className="font-medium">{searchQuery}</span>&quot;
                  </p>
                  <p className="text-sm text-gray-500">
                    Try different keywords or explore our featured figures above
                  </p>
                </div>
              </div>
            )}

            {searchResults.length > 0 && !isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {searchResults.map((figure) => (
                  <div key={figure.wikipediaId || figure._id || `temp-${Date.now()}`} className="mx-auto w-full max-w-sm">
                    <LazyFigureCard
                      figure={figure}
                      onLikeFigureClick={handleLikeClick}
                      onSaveFigureClick={onSaveFigureClick}
                      onLoginClick={onLoginClick}
                      isSaved={checkIsSaved(figure)}
                      isLiked={checkIsLiked(figure)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default Main;
