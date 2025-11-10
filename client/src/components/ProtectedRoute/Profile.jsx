import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CurrentUserContext from "../../contexts/CurrentUserContext";
import FigureCard from '../Echoes/FigureCard';

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

function Profile({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [] }) {
  const currentUser = useContext(CurrentUserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categorizedFigures, setCategorizedFigures] = useState({});

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
      
      const categorized = { all: validFigures };
      categories.forEach((category) => {
        categorized[category] = validFigures.filter(
          (figure) => figure.category === category
        );
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

  if (!currentUser) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">My Collection</h1>
      <p className="text-center text-gray-600 mb-8">
        Welcome back, {currentUser.name}! You have {savedFigures.length} saved figure{savedFigures.length !== 1 ? 's' : ''}.
      </p>

      <div className="mb-8 overflow-x-auto">
        <div className="inline-flex border-b border-gray-300 w-full">
          <button
            className={`px-6 py-3 text-sm font-medium relative whitespace-nowrap ${
              activeCategory === "all"
                ? "text-secondary"
                : "text-gray-500 hover:text-secondary"
            }`}
            onClick={() => setActiveCategory("all")}
          >
            All Saved
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              {categorizedFigures.all?.length || 0}
            </span>
            {activeCategory === "all" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary"></span>
            )}
          </button>

          {categories.map((category) => (
            <button
              key={category}
              className={`px-6 py-3 text-sm font-medium relative whitespace-nowrap ${
                activeCategory === category
                  ? "text-secondary"
                  : "text-gray-500 hover:text-secondary"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {categorizedFigures[category]?.length || 0}
              </span>
              {activeCategory === category && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary"></span>
              )}
            </button>
          ))}
        </div>
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
      {!loading && !error && savedFigures.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categorizedFigures[activeCategory]?.map((figure, index) => {
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
              />
            );
          })}

          {categorizedFigures[activeCategory]?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No saved figures in this category</p>
              <p className="text-sm text-gray-400 mt-2">
                Try exploring the <span className="font-medium">{activeCategory}</span> category to find figures to save!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;