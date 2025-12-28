import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CurrentUserContext from "../../contexts/CurrentUserContext";
import FigureCard from '../Echoes/FigureCard';

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

function Profile({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [] }) {
  const currentUser = useContext(CurrentUserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categorizedFigures, setCategorizedFigures] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); // Filter saved figures

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    console.log("Profile: savedFigures prop changed:", savedFigures);
    
    if (Array.isArray(savedFigures)) {
      const validFigures = savedFigures.filter(item => 
        typeof item === 'object' && 
        item !== null && 
        (item._id || item.name)
      );
      
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
      const categorized = { all: sortByLastName(validFigures) };
      categories.forEach((category) => {
        // Multi-category support: check if figure's categories array includes this category
        const filtered = validFigures.filter((figure) => 
          figure.categories?.includes(category) || figure.category === category
        );
        categorized[category] = sortByLastName(filtered);
      });
      
      setCategorizedFigures(categorized);
    } else {
      console.error("Invalid savedFigures format:", savedFigures);
      setCategorizedFigures({ all: [] });
    }
  }, [savedFigures]); 

  const isFigureSaved = (figure) => {
    return true; 
  };

  // Check if figure is liked by current user
  const isFigureLiked = (figure) => {
    if (!currentUser || !figure) return false;
    const likedBy = figure.likedBy || [];
    return likedBy.includes(currentUser._id);
  };

  if (!currentUser) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">My Collection</h1>
        <p className="text-center text-gray-700 mb-8">
          Welcome back, {currentUser.name}! You have {savedFigures.length} saved figure{savedFigures.length !== 1 ? 's' : ''}.
        </p>

      {/* FILTER BAR: Dropdown + Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Category Dropdown */}
          <div className="relative flex-shrink-0 sm:w-64">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent cursor-pointer shadow-sm hover:border-gray-400 transition-colors"
            >
              <option value="all">All Saved ({categorizedFigures.all?.length || 0})</option>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your saved figures..."
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

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && savedFigures.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved figures yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start exploring and save figures that inspire you! Your saved figures will appear here.
          </p>
          <a 
            href="/echoes" 
            className="inline-flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Explore Figures
          </a>
        </div>
      )}

      {/* Figures Grid */}
      {!loading && !error && savedFigures.length > 0 && (() => {
        // Filter figures by search query
        const categoryFigures = categorizedFigures[activeCategory] || [];
        const filteredFigures = searchQuery.trim()
          ? categoryFigures.filter(fig => {
              const query = searchQuery.toLowerCase();
              return (
                fig.name?.toLowerCase().includes(query) ||
                fig.description?.toLowerCase().includes(query) ||
                fig.tags?.some(tag => tag.toLowerCase().includes(query))
              );
            })
          : categoryFigures;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFigures.map((figure, index) => {
              // Ensure we have a valid figure object
              if (!figure || typeof figure !== 'object') {
                console.warn(`Invalid figure at index ${index}:`, figure);
                return null;
              }

              return (
                <FigureCard
                  key={figure._id || figure.wikipediaId || `figure-${index}`}
                  figure={figure}
                  onSaveFigureClick={() => onSaveFigureClick(figure)}
                  onLikeFigureClick={() => onLikeFigureClick(figure)}
                  onLoginClick={onLoginClick}
                  isSaved={isFigureSaved(figure)}
                  isLiked={isFigureLiked(figure)}
                />
              );
            })}

            {filteredFigures.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? `No figures match "${searchQuery}"` : 'No saved figures in this category'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchQuery 
                    ? 'Try a different search term or clear the filter.'
                    : `Try exploring the ${activeCategory} category to find figures to save!`
                  }
                </p>
              </div>
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
}

export default Profile;