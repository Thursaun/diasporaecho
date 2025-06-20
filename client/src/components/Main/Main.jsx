import { useState, useEffect } from "react";
import FigureCard from "../Echoes/FigureCard";
import { searchFigures, getFeaturedFigures } from "../../utils/api";


function Main({ onSaveFigureClick, onLikeFigureClick, savedFigures, onLoginClick }) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featuredFigures, setFeaturedFigures] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const checkIsSaved = (figure) => {
  if (!figure || !savedFigures) return false;
  
  const figureId = figure.wikipediaId || figure._id;
  
  return savedFigures.some((savedFigure) => {
    const savedId = savedFigure.wikipediaId || savedFigure._id;
    return savedId === figureId;
  });
};

  useEffect(() => {
    setFeaturedLoading(true);
    getFeaturedFigures()
      .then((figures) => {
        const topFigures = figures
          .sort((a, b) => (b.likes || 0) - (a.likes || 0))
          .slice(0, 3);
        setFeaturedFigures(topFigures);
        setFeaturedLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching featured figures:", err);
        setFeaturedLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) {
      return;
    }
    setIsLoading(true);
    setError(null);

    searchFigures({ query: searchQuery })
      .then((results) => {
        console.log("Search results:", results);
        setSearchResults(results);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching search results:", err);
        setError("Failed to fetch search results. Please try again.");
        setIsLoading(false);
      });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-secondary text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder="Search for historical figures..."
              className="flex-grow p-4 rounded-lg text-black text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-dark text-white px-8 py-4 rounded-lg hover:bg-opacity-90 transition duration-300 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Figures
            </h2>
            <div className="w-72 h-1 bg-gradient-to-r from-secondary to-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the most celebrated figures whose stories continue to inspire and educate
            </p>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredFigures.map((figure, index) => (
                <div
                  key={figure._id}
                  className={`transform transition-all duration-300 hover:scale-105 ${
                    index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div className="relative">
                    {index < 3 && (
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
                      onLikeFigureClick={onLikeFigureClick}
                      onSaveFigureClick={onSaveFigureClick}
                      onLoginClick={onLoginClick}
                      isSaved={checkIsSaved(figure)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <a
              href="/echoes"
              className="inline-flex items-center px-8 py-4 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition duration-300 font-semibold text-lg"
            >
              Explore All Figures
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {searchQuery && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Search Results
              </h2>
              <p className="text-gray-600">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((figure) => (
                  <FigureCard
                    key={figure.wikipediaId || figure._id || `temp-${Date.now()}`}
                    figure={figure}
                    onLikeFigureClick={onLikeFigureClick}
                    onSaveFigureClick={onSaveFigureClick}
                    onLoginClick={onLoginClick}
                    isSaved={checkIsSaved(figure)}
                  />
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
