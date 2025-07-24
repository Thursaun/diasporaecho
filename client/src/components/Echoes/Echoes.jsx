import { useState, useEffect } from 'react';
import { getFigures } from '../../utils/api'; 
import FigureCard from './FigureCard';

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

function Echoes({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [] }) {
  const [allFigures, setAllFigures] = useState([]); // Changed from figures
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categorizedFigures, setCategorizedFigures] = useState({});

  // Check if a figure is saved by the current user
  const isFigureSaved = (figure) => {
    if (!figure || !savedFigures) return false;
    
    const figureId = figure.wikipediaId || figure._id;
    return savedFigures.some((savedFigure) => {
      const savedId = savedFigure.wikipediaId || savedFigure._id;
      return savedId === figureId;
    });
  };

  useEffect(() => {
    setLoading(true);
    getFigures() // Changed from getSavedFigures()
      .then((data) => {
        console.log("Fetched all figures:", data);
        setAllFigures(data);

        // Categorize ALL figures (not just saved ones)
        const categorized = { all: data };
        categories.forEach((category) => {
          categorized[category] = data.filter(
            (figure) => figure.category === category
          );
        });
        setCategorizedFigures(categorized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching figures:", err);
        setError("Failed to load figures.");
        setLoading(false);
      });
  }, []); // No dependencies needed since we want all figures

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Echoes Gallery</h1>
      <p className="text-center text-gray-600 mb-8">
        Explore {allFigures.length} inspiring figures from history.
      </p>

      {/* Category Navigation */}
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
            All Figures
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
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && allFigures.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No figures found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            There are no figures in the database yet.
          </p>
        </div>
      )}

      {/* Figures Grid */}
      {!loading && !error && allFigures.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categorizedFigures[activeCategory]?.map((figure) => (
            <FigureCard
              key={figure._id || figure.wikipediaId}
              figure={figure}
              onSaveFigureClick={() => onSaveFigureClick(figure)}
              onLikeFigureClick={() => onLikeFigureClick(figure)}
              onLoginClick={onLoginClick}
              isSaved={isFigureSaved(figure)} // This checks against savedFigures prop
            />
          ))}

          {categorizedFigures[activeCategory]?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No figures in this category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Echoes;