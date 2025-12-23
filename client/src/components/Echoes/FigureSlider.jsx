import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getFeaturedFigures } from "../../utils/api";

// =============================================================================
// PERFORMANCE: Image Optimization Utilities
// =============================================================================

/**
 * Optimize Wikipedia image URL to request smaller thumbnails
 * Reduces image size from ~500KB to ~20-50KB
 * @param {string} url - Original Wikipedia image URL
 * @param {number} size - Desired width in pixels
 * @returns {string} - Optimized URL or original if not Wikipedia
 */
const getOptimizedImageUrl = (url, size = 300) => {
  if (!url) return '';
  
  // Skip placeholder images
  if (url.includes('placeholder')) return url;
  
  // Wikipedia image URLs follow this pattern:
  // https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.ext
  // Can be converted to thumbnail:
  // https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Filename.ext/300px-Filename.ext
  if (url.includes('upload.wikimedia.org') && !url.includes('/thumb/')) {
    const match = url.match(/(.*\/wikipedia\/(?:commons|en)\/)([\w\d]\/[\w\d]{2}\/([^/]+))$/);
    if (match) {
      const [, baseUrl, pathWithFilename, filename] = match;
      return `${baseUrl}thumb/${pathWithFilename}/${size}px-${filename}`;
    }
  }
  
  return url;
};

/**
 * PERFORMANCE: Optimized Image component with blur-up loading
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  priority = false, 
  thumbnailSize = 300,
  heroSize = 800 
}) => {
  const [imageState, setImageState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  
  // Use smaller thumbnail for faster loading
  const optimizedSrc = useMemo(() => 
    getOptimizedImageUrl(src, priority ? heroSize : thumbnailSize), 
    [src, priority, thumbnailSize, heroSize]
  );
  
  const handleLoad = useCallback(() => {
    setImageState('loaded');
  }, []);
  
  const handleError = useCallback(() => {
    setImageState('error');
  }, []);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton placeholder shown while loading */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
      )}
      
      {/* Error fallback */}
      {imageState === 'error' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/50" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Actual image with fade-in transition */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
      />
    </div>
  );
};

// =============================================================================
// PERFORMANCE: Optimized FigureSlider Component
// =============================================================================

function FigureSlider({ onSaveFigureClick, onLikeFigureClick }) {
  const navigate = useNavigate();
  const [figures, setFigures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // PERFORMANCE: Preload hero image on mount
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getFeaturedFigures("", 5)
      .then((data) => {
        if (data && data.length > 0) {
          setFigures(data);
          
          // PERFORMANCE: Preload the first hero image immediately
          if (data[0]?.imageUrl) {
            const heroUrl = getOptimizedImageUrl(data[0].imageUrl, 800);
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = heroUrl;
            document.head.appendChild(preloadLink);
          }
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

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? figures.length - 1 : prev - 1);
  }, [figures.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev === figures.length - 1 ? 0 : prev + 1);
  }, [figures.length]);

  const goToSlide = useCallback((slideIndex) => {
    setCurrentIndex(slideIndex);
  }, []);

  // PERFORMANCE: Memoize current figure to prevent unnecessary recalculations
  const currentFigure = useMemo(() => figures[currentIndex], [figures, currentIndex]);

  // =============================================================================
  // RENDER: Loading State with Skeleton
  // =============================================================================
  
  if (isLoading) {
    return (
      <div className="relative w-full py-8 bg-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8">Featured echoes</h2>
        
        {/* Skeleton for thumbnails */}
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="flex space-x-4 pb-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex-shrink-0 w-32 h-40 rounded-lg bg-gray-300 animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Skeleton for hero */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-96 rounded-lg bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 animate-pulse flex flex-col justify-end p-6">
            <div className="space-y-3">
              <div className="h-8 w-64 bg-gray-400/50 rounded" />
              <div className="h-4 w-32 bg-gray-400/40 rounded" />
              <div className="h-4 w-full max-w-lg bg-gray-400/30 rounded" />
              <div className="h-4 w-3/4 max-w-md bg-gray-400/30 rounded" />
            </div>
          </div>
        </div>
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

  return (
    <div className="relative w-full py-8 bg-gray-100">
      <h2 className="text-3xl font-bold text-center mb-8">Featured echoes</h2>

      {/* PERFORMANCE: Thumbnail strip with lazy loading */}
      <div className="max-w-6xl mx-auto px-4 mb-6 overflow-hidden">
        <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide">
          {figures.map((figure, idx) => (
            <div
              key={figure._id || idx}
              className={`flex-shrink-0 w-32 h-40 cursor-pointer transition-all duration-300 transform 
                ${idx === currentIndex ? "scale-110 ring-2 ring-black" : "opacity-60 hover:opacity-90"}`}
              onClick={() => goToSlide(idx)}
            >
              <div className="w-full h-full rounded-lg overflow-hidden shadow-md">
                <div className="w-full h-full relative">
                  {/* PERFORMANCE: Optimized thumbnail with lazy loading */}
                  <OptimizedImage
                    src={figure.imageUrl}
                    alt={figure.name}
                    className="w-full h-full"
                    thumbnailSize={150}
                    priority={idx === 0} // Only prioritize first thumbnail
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
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

      {/* PERFORMANCE: Main Featured Figure Display with optimized hero image */}
      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
          {/* PERFORMANCE: Optimized hero image with blur-up loading */}
          <div className="absolute inset-0">
            <OptimizedImage
              src={currentFigure.imageUrl}
              alt={currentFigure.name}
              className="w-full h-full"
              priority={true}
              heroSize={800}
            />
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Content */}
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
                  {currentFigure.likes?.length || currentFigure.likes || 0}
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
