import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFeaturedFigures } from "../../utils/api";

function FigureSlider({ onSaveFigureClick, onLikeFigureClick }) {
  const navigate = useNavigate();
  const [figures, setFigures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getFeaturedFigures("", 5)
      .then((data) => {
        if (data && data.length > 0) {
          setFigures(data);
        } else {
          setError("No featured echoes found.");
        }
      })
      .catch((err) => {
        console.error("Error fetching featured echoes:", err);
        setError("Failed to load featured echoes. Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? figures.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === figures.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        <p className="mt-4 text-gray-600">Loading featured echoes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!figures || figures.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <p className="text-gray-600">No featured echoes available.</p>
      </div>
    );
  }

  const currentFigure = figures[currentIndex];

  return (
    <div className="relative w-full py-8 bg-gray-100">
      <h2 className="text-3xl font-bold text-center mb-8">Featured echoes</h2>

      <div className="max-w-6xl mx-auto px-4 mb-6 overflow-hidden">
        <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide">
          {figures.map((figure, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 w-32 h-40 cursor-pointer transition-all duration-300 transform 
                ${idx === currentIndex ? "scale-110 ring-2 ring-black" : "opacity-60 hover:opacity-90"}`}
              onClick={() => goToSlide(idx)}
            >
              <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
                <div className="w-full h-full relative">
                  <img
                    src={figure.imageUrl}
                    alt={figure.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="text-white text-xs font-semibold truncate">
                      {figure.name}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Featured Figure Display */}
      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
          <div
            className="w-full h-full bg-cover bg-center transition-opacity duration-500"
            style={{
              backgroundImage: `url(${currentFigure.imageUrl})`,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{currentFigure.name}</h3>
              <p className="text-sm mb-1">{currentFigure.years}</p>
              <p className="line-clamp-3">{currentFigure.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentFigure.tags &&
                  currentFigure.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-white/20 rounded"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition"
                  onClick={() => navigate(`/figures/${currentFigure._id}`)}
                >
                  See More
                </button>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      onLikeFigureClick(currentFigure);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    {currentFigure.likes?.length || 0}
                  </button>

                  <button
                    className="px-4 py-2 border border-white text-white rounded hover:bg-white/20 transition"
                    onClick={(e) => {
                      e.preventDefault();
                      onSaveFigureClick(currentFigure);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4">
          <button
            onClick={goToPrevious}
            className="bg-white/70 hover:bg-white text-black p-2 rounded-full shadow-md z-10"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="bg-white/70 hover:bg-white text-black p-2 rounded-full shadow-md z-10"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FigureSlider;
