import { useContext, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";

// =============================================================================
// PERFORMANCE IMPROVEMENT: Memoized Component
// =============================================================================

const FigureCard = memo(function FigureCard({
  figure,
  onLikeFigureClick,
  onSaveFigureClick,
  isSaved,
  onLoginClick,
}) {
  // =============================================================================
  // HOOKS & STATE: Optimized for performance
  // =============================================================================
  
  const navigate = useNavigate();
  const currentUser = useContext(CurrentUserContext);
  const isLoggedIn = !!currentUser;
  
  // PERFORMANCE: Image loading states for better UX
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // PERFORMANCE: Early return for invalid data
  if (!figure) {
    console.warn('FigureCard received invalid figure data');
    return null;
  }

  // =============================================================================
  // DATA EXTRACTION: Optimized destructuring
  // =============================================================================
  
  const {
    _id,
    wikipediaId,
    name,
    imageUrl,
    description,
    years,
    tags = [],
    likes = 0,
    source,
  } = figure;

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Event Handlers
  // =============================================================================
  
  const handleLikeClick = useCallback((e) => {
    e.stopPropagation();
    console.log('👍 Like clicked for:', name);
    onLikeFigureClick(figure);
  }, [figure, name, onLikeFigureClick]);

  const handleSaveClick = useCallback((e) => {
    e.stopPropagation();
    console.log('💾 Save clicked for:', name);
    onSaveFigureClick(figure);
  }, [figure, name, onSaveFigureClick]);

  const handleCardClick = useCallback(() => {
    const navId = _id || wikipediaId;
    
    if (!navId) {
      console.error("❌ No valid navigation ID found for figure:", figure);
      return;
    }
    
    console.log('🔗 Navigating to figure:', name, 'with ID:', navId);
    
    if (_id) {
      navigate(`/figures/${_id}`);
    } else if (wikipediaId) {
      navigate(`/figures/${wikipediaId}`);
    }
  }, [_id, wikipediaId, figure, name, navigate]);

  // PERFORMANCE: Optimized image loading handlers
  const handleImageLoad = useCallback(() => {
    console.log('🖼️ Image loaded for:', name);
    setImageLoaded(true);
  }, [name]);

  const handleImageError = useCallback(() => {
    console.warn('❌ Image failed to load for:', name, imageUrl);
    setImageError(true);
    setImageLoaded(true);
  }, [name, imageUrl]);

  const handleLoginClick = useCallback((e) => {
    e.stopPropagation();
    console.log('🔐 Login prompt for:', name);
    onLoginClick();
  }, [name, onLoginClick]);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Data Processing
  // =============================================================================
  
  // PERFORMANCE: Process years data only once
  const displayYears = years && years !== "Unknown" ? years : null;
  
  // PERFORMANCE: Process tags only when needed
  const visibleTags = tags.length > 0 ? tags.slice(0, 3) : [];
  const hasMoreTags = tags.length > 3;

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Rendering
  // =============================================================================

  return (
    <div
      className="card group relative w-full max-w-sm aspect-[1/1.4] rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
      onClick={handleCardClick}
    >
      {/* PERFORMANCE: Optimized Image Container with Loading States */}
      <div className="image-box absolute inset-0 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm font-medium">Loading...</div>
          </div>
        )}
        
        {!imageError ? (
          <img
            src={imageUrl}
            alt={`Portrait of ${name}`}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:brightness-[0.4] group-hover:grayscale ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy" // PERFORMANCE: Native lazy loading
          />
        ) : (
          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-xs">Image unavailable</p>
            </div>
          </div>
        )}
        
        {/* PERFORMANCE: Optimized gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95"></div>
      </div>

      {/* PERFORMANCE: Optimized Hover Border Effect */}
      <div className="absolute inset-0 border-0 border-white rounded-lg opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:inset-[20px] pointer-events-none"></div>

      {/* PERFORMANCE: Conditionally rendered badge to avoid empty divs */}
      {displayYears && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-secondary text-dark text-xs font-medium px-3 py-1 rounded-full shadow-lg">
            {displayYears}
          </span>
        </div>
      )}

      {/* PERFORMANCE: Optimized Content Container */}
      <div className="content absolute inset-0 flex flex-col p-6 z-10 pt-12">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-2 mb-4">
          <h2 className="text-xl font-bold text-white bg-black/40 backdrop-blur-sm px-3 py-2 rounded-md shadow-md line-clamp-2">
            {name}
          </h2>
        </div>

        {/* PERFORMANCE: Optimized Description Section */}
        <div className="flex-1 mb-3 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-6">
            {description}
          </p>
        </div>

        {/* PERFORMANCE: Conditionally render tags only if they exist */}
        {visibleTags.length > 0 && (
          <div className="mb-2 opacity-0 translate-y-4 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:translate-y-0">
            <div className="flex items-center gap-1 overflow-hidden">
              {visibleTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`} // PERFORMANCE: Better key for React optimization
                  className="bg-white/20 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
              {hasMoreTags && (
                <span className="text-white/70 text-xs whitespace-nowrap flex-shrink-0">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* PERFORMANCE: Optimized Bottom Actions Section */}
        <div className="flex justify-between items-end opacity-0 translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-0">
          <p className="flex items-end text-xs text-white/70 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md flex-shrink-0">
            Source: {source}
          </p>

          <div className="flex gap-2 items-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleLikeClick}
                  className="px-2 py-1 rounded hover:bg-white/30 transition-colors flex items-center text-xs bg-white/20 text-white"
                  aria-label={`Like ${name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
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
                  {likes}
                </button>

                <button
                  onClick={handleSaveClick}
                  className={`px-3 py-1 rounded flex items-center text-sm transition-colors ${
                    isSaved
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2z"></path>
                  </svg>
                  {isSaved ? "Saved" : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors text-xs"
                aria-label="Sign in to interact with figures"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default FigureCard;