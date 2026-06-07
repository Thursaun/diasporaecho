import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getFigures } from '../../utils/api';
import { fuzzySearchFilter } from '../../utils/fuzzySearch';
import LazyFigureCard from './LazyFigureCard';

// Historical eras definitions & styling

const determineClientEra = (years) => {
  if (!years || typeof years !== 'string') return "Unknown Era";
  const match = years.match(/\b\d{4}\b/);
  if (!match) return "Unknown Era";
  const year = parseInt(match[0], 10);
  
  if (year < 1865) return "Slavery & Abolition Era";
  if (year >= 1865 && year <= 1877) return "Reconstruction Era";
  if (year > 1877 && year <= 1915) return "Jim Crow & Early Activism";
  if (year > 1915 && year <= 1940) return "Harlem Renaissance & New Negro";
  if (year > 1940 && year <= 1968) return "Civil Rights Movement";
  return "Post-Civil Rights & Modern Era";
};

const eras = [
  {
    id: "Slavery & Abolition Era",
    name: "Slavery & Abolition",
    years: "Before 1865",
    description: "The struggle against chattel slavery, the Underground Railroad, and the rise of early abolitionists.",
    badgeStyle: "bg-secondary/85 text-white border-secondary/40",
    colorClass: "from-secondary/15 to-secondary/30 border-secondary/20 text-red-100 shadow-secondary/5 hover:border-secondary/40",
    activeColorClass: "from-secondary/90 to-secondary border-secondary text-white shadow-lg shadow-secondary/30 ring-2 ring-secondary/20",
    accentColor: "#632420", // secondary
  },
  {
    id: "Reconstruction Era",
    name: "Reconstruction Era",
    years: "1865 - 1877",
    description: "Post-Civil War rebuilding, Black political empowerment, and attempts to secure civil rights.",
    badgeStyle: "bg-accent/85 text-white border-accent/40",
    colorClass: "from-accent/15 to-accent/30 border-accent/20 text-orange-100 shadow-accent/5 hover:border-accent/40",
    activeColorClass: "from-accent/90 to-accent border-accent text-white shadow-lg shadow-accent/30 ring-2 ring-accent/20",
    accentColor: "#C95C2C", // accent
  },
  {
    id: "Jim Crow & Early Activism",
    name: "Jim Crow & Early Activism",
    years: "1878 - 1915",
    description: "The rise of state-segregation, racial terror, and foundations of founding activist organizations.",
    badgeStyle: "bg-dark/85 text-white border-dark/40",
    colorClass: "from-dark/40 to-slate-900/60 border-dark/30 text-slate-300 shadow-dark/5 hover:border-dark/40",
    activeColorClass: "from-slate-800 to-dark border-dark text-white shadow-lg shadow-dark/50 ring-2 ring-dark/20",
    accentColor: "#1C1A1A", // dark
  },
  {
    id: "Harlem Renaissance & New Negro",
    name: "Harlem Renaissance",
    years: "1916 - 1940",
    description: "A cultural, literary, and social explosion celebrating Black identity and intellectual achievements.",
    badgeStyle: "bg-gold/85 text-slate-950 border-gold/40",
    colorClass: "from-gold/15 to-gold/30 border-gold/20 text-amber-100 shadow-gold/5 hover:border-gold/40",
    activeColorClass: "from-gold/90 to-gold border-gold text-slate-950 shadow-lg shadow-gold/30 ring-2 ring-gold/20",
    accentColor: "#E8AC49", // gold
  },
  {
    id: "Civil Rights Movement",
    name: "Civil Rights Movement",
    years: "1941 - 1968",
    description: "Mid-20th century mass campaign of boycotts, marches, and policy wins to dismantle segregation.",
    badgeStyle: "bg-primary/85 text-white border-primary/40",
    colorClass: "from-primary/15 to-primary/30 border-primary/20 text-emerald-100 shadow-primary/5 hover:border-primary/40",
    activeColorClass: "from-primary/90 to-primary border-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20",
    accentColor: "#28715E", // primary
  },
  {
    id: "Post-Civil Rights & Modern Era",
    name: "Post-Civil Rights & Modern",
    years: "After 1968",
    description: "Expanding representation, cultural influence, and modern struggles for systemic equity and justice.",
    badgeStyle: "bg-slate-700/85 text-white border-slate-600/40",
    colorClass: "from-slate-800/40 to-slate-900/60 border-slate-700/30 text-slate-200 shadow-slate-900/5 hover:border-slate-600/40",
    activeColorClass: "from-slate-700 to-slate-800 border-slate-500 text-white shadow-lg shadow-slate-700/30 ring-2 ring-slate-500/20",
    accentColor: "#4b5563", // charcoal gray
  }
];

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

function Echoes({ 
  onLikeFigureClick, 
  onSaveFigureClick, 
  onLoginClick, 
  savedFigures = [], 
  currentUser,
  allFigures: propAllFigures = [],  // SYNERGY: Receive from App.jsx
  setAllFigures: propSetAllFigures  // SYNERGY: Receive from App.jsx
}) {
  // State management: Use App state or fallback to local state

  // SYNERGY: Use props if available, otherwise fall back to local state
  const [localFigures, setLocalFigures] = useState(() => {
    try {
      const cached = localStorage.getItem('diaspora_figures');
      if (cached) {
        console.log('⚡ Initializing with cached figures from localStorage');
        return JSON.parse(cached);
      }
    } catch { /* ignore */ }
    return [];
  });

  // Use App's state if available, else local state
  const allFigures = propAllFigures.length > 0 ? propAllFigures : localFigures;
  const setAllFigures = propSetAllFigures || setLocalFigures;

  // Only show loading if we have NO figures at all
  const [loading, setLoading] = useState(() => allFigures.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeEra, setActiveEra] = useState("all");
  const [hoveredEra, setHoveredEra] = useState(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const [searchQuery, setSearchQuery] = useState(""); // Filter figures by name
  const observerTarget = useRef(null);

  // Optimistic like handler with local state update

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
  }, [onLikeFigureClick, setAllFigures]);

  // Memoized calculations
  
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
    
    // Apply Era Filter
    let filtered = categoryFigures;
    if (activeEra !== "all") {
      filtered = filtered.filter((figure) => {
        const displayEra = figure.era || determineClientEra(figure.years);
        return displayEra === activeEra;
      });
    }

    // Use fuzzy search for precise, ranked filtering
    if (searchQuery.trim()) {
      filtered = fuzzySearchFilter(filtered, searchQuery);
    }
    
    const sliced = filtered.slice(0, displayCount);
    return sliced;
  }, [categorizedFigures, activeCategory, activeEra, displayCount, searchQuery]);

  // PERFORMANCE: Check if more figures can be loaded (accounting for search filter)
  const hasMoreFigures = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    
    let filtered = categoryFigures;
    if (activeEra !== "all") {
      filtered = filtered.filter((figure) => {
        const displayEra = figure.era || determineClientEra(figure.years);
        return displayEra === activeEra;
      });
    }

    if (searchQuery.trim()) {
      filtered = fuzzySearchFilter(filtered, searchQuery);
    }
    return displayCount < filtered.length;
  }, [categorizedFigures, activeCategory, activeEra, displayCount, searchQuery]);

  // Count the total matching figures after category, era, and search filters are applied
  const totalFilteredCount = useMemo(() => {
    const categoryFigures = categorizedFigures[activeCategory] || [];
    
    let filtered = categoryFigures;
    if (activeEra !== "all") {
      filtered = filtered.filter((figure) => {
        const displayEra = figure.era || determineClientEra(figure.years);
        return displayEra === activeEra;
      });
    }

    if (searchQuery.trim()) {
      filtered = fuzzySearchFilter(filtered, searchQuery);
    }
    return filtered.length;
  }, [categorizedFigures, activeCategory, activeEra, searchQuery]);

  // Dynamic description for the currently hovered or active era
  const currentDescription = useMemo(() => {
    const eraId = hoveredEra || activeEra;
    if (eraId && eraId !== "all") {
      const era = eras.find((e) => e.id === eraId);
      return era ? era.description : "";
    }
    return "Hover or click an era to explore its figures and trace the history of Black achievements.";
  }, [hoveredEra, activeEra]);

  // Dynamic name for the currently hovered or active era
  const currentEraName = useMemo(() => {
    const eraId = hoveredEra || activeEra;
    if (eraId && eraId !== "all") {
      const era = eras.find((e) => e.id === eraId);
      return era ? era.name : "";
    }
    return "";
  }, [hoveredEra, activeEra]);

  // Helper functions
  
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

  // Reset display count and select/toggle active era
  const handleEraChange = useCallback((eraId) => {
    console.log(`🔄 Switching era to ${eraId}`);
    setActiveEra(prevEra => (prevEra === eraId ? "all" : eraId));
    setDisplayCount(INITIAL_LOAD);
  }, []);

  // Infinite Scroll Observer using IntersectionObserver
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFigures && !loadingMore && !loading) {
          loadMoreFigures();
        }
      },
      {
        root: null, // viewport
        rootMargin: '200px', // load ahead
        threshold: 0.1,
      }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreFigures, loadingMore, loading, loadMoreFigures]);

  // Data fetching
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Era Timeline Hero Section */}
        <div className="relative bg-gradient-to-r from-secondary to-red-950 border border-red-900/30 rounded-2xl p-3 sm:p-4 mb-6 overflow-hidden shadow-xl">
          {/* Glowing gradients */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-2xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -z-10"></div>
          
          {/* 6-Column Era Row (desktop is 6 columns, tablet 3, mobile 2) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {eras.map((era) => {
              const isActive = activeEra === era.id;
              const isHovered = hoveredEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => handleEraChange(era.id)}
                  onMouseEnter={() => setHoveredEra(era.id)}
                  onMouseLeave={() => setHoveredEra(null)}
                  className={`flex flex-col justify-center items-center text-center p-2 rounded-xl border transition-all duration-200 focus:outline-none h-[64px] sm:h-[70px] ${
                    isActive 
                      ? era.activeColorClass 
                      : isHovered
                        ? `bg-black/35 border-white/30 text-white scale-[1.02]`
                        : `bg-black/20 border-red-950/40 text-red-100 hover:scale-[1.01] hover:border-white/20`
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-75 tracking-wider mb-0.5">
                    {era.years}
                  </span>
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-tight leading-tight line-clamp-2">
                    {era.name}
                  </h3>
                </button>
              );
            })}
          </div>

          {/* Dynamic description banner */}
          <div className="relative z-10 mt-3 bg-black/30 border border-white/5 rounded-xl px-4 py-2 flex items-center justify-center gap-2 min-h-[40px]">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0"></span>
            <p className="text-[11px] sm:text-xs text-red-200/90 leading-relaxed text-center font-medium m-0">
              {currentEraName && <strong className="text-white mr-1.5">{currentEraName}:</strong>}
              {currentDescription}
            </p>
          </div>
        </div>

      {/* FILTER BAR: Dropdown + Search */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Category Dropdown */}
          <div className="relative flex-shrink-0 sm:w-64">
            <select
              value={activeCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer shadow-sm hover:border-gray-400 transition-colors"
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
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
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
        {(activeCategory !== "all" || activeEra !== "all" || searchQuery) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Filtering:</span>
            {activeEra !== "all" && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                eras.find(e => e.id === activeEra)?.badgeStyle || ''
              }`}>
                {eras.find(e => e.id === activeEra)?.name || activeEra}
                <button onClick={() => handleEraChange(activeEra)} className="hover:opacity-75 ml-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {activeCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {activeCategory}
                <button onClick={() => setActiveCategory("all")} className="hover:text-primary/70">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery("")} className="hover:text-gray-800">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => { setActiveCategory("all"); setActiveEra("all"); setSearchQuery(""); }}
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
                <p className="text-gray-500">Try selecting a different category or era to explore more figures.</p>
              </div>
            )}
          </div>

          {/* Infinite Scroll Sentinel / Spinner */}
          <div 
            ref={observerTarget} 
            className="w-full py-8 flex flex-col justify-center items-center"
          >
            {hasMoreFigures && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                <p className="text-xs text-gray-500 animate-pulse font-medium">Loading more historical figures...</p>
              </div>
            )}
            {!hasMoreFigures && currentFigures.length > 0 && (
              <div className="text-center text-sm text-gray-400 py-6 font-medium border-t border-gray-200/50 w-full max-w-md mx-auto mt-4">
                ✨ You've reached the end of the records.
              </div>
            )}
          </div>

          {/* PERFORMANCE: Results summary with performance info */}
          <div className="text-center mt-2 space-y-2">
            <div className="text-sm text-gray-500">
              Showing {currentFigures.length} of {totalFilteredCount} figures
              {activeCategory !== "all" && ` in ${activeCategory}`}
              {activeEra !== "all" && ` (${eras.find(e => e.id === activeEra)?.name})`}
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