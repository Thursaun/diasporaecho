import { useContext, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { getOptimizedImageUrl } from "../../utils/imageUtils";

// =============================================================================
// PERFORMANCE IMPROVEMENT: Memoized Component with custom comparison
// =============================================================================

const FigureCard = memo(function FigureCard({
  figure,
  onLikeFigureClick,
  onSaveFigureClick,
  isSaved,
  isLiked,
  onLoginClick,
  priority = false, // PERFORMANCE: Priority loading for above-the-fold images
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
      className="card group relative w-full max-w-sm aspect-[3/4] sm:aspect-[1/1.4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-secondary/20 shadow-xl"
      onClick={handleCardClick}
      style={{
        transform: 'translateZ(0)', // Hardware acceleration
        willChange: 'transform',
      }}
    >
      {/* MODERN: Glass morphism ring effect on hover */}
      <div className="absolute inset-0 rounded-2xl ring-0 ring-secondary/30 group-hover:ring-4 transition-all duration-500 pointer-events-none z-30"></div>

      {/* PERFORMANCE: Optimized Image Container with Loading States */}
      <div className="image-box absolute inset-0 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-400 text-xs font-medium">Loading...</div>
            </div>
          </div>
        )}

        {!imageError ? (
          <img
            src={getOptimizedImageUrl(imageUrl, 400)}
            alt={`Portrait of ${name}`}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-[0.5] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={priority ? "eager" : "lazy"} // PERFORMANCE: Eager load for above-fold, lazy for others
            decoding="async" // PERFORMANCE: Non-blocking image decode
            fetchPriority={priority ? "high" : "low"} // PERFORMANCE: Prioritize above-the-fold images
            style={{
              contentVisibility: 'auto', // PERFORMANCE: Skip rendering when off-screen
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">Image unavailable</p>
            </div>
          </div>
        )}

        {/* MODERN: Enhanced gradient overlay with subtle shimmer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-85 transition-all duration-700 group-hover:opacity-95 group-hover:from-black/95"></div>

        {/* MODERN: Subtle top gradient for depth */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* MODERN: Animated corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

      {/* MODERN: Enhanced badges with glass morphism */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex justify-between items-start pointer-events-none">
        
        {/* Left Side: Years and other badges */}
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          {displayYears && (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg border border-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {displayYears}
            </span>
          )}
        </div>

        {/* Right Side: Heart Like Button (New Position) */}
        <button
          onClick={handleLikeClick}
          className={`pointer-events-auto group/heart flex flex-col items-center gap-0.5 sm:gap-1 transition-all duration-300 ${
            isLiked ? "scale-110" : "opacity-90 hover:opacity-100 hover:scale-110"
          }`}
          aria-label={isLiked ? `Unlike ${name}` : `Like ${name}`}
        >
          <div className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md shadow-lg border transition-all duration-300 ${
            isLiked 
              ? "bg-secondary text-white border-secondary" 
              : "bg-white/20 text-white border-white/20 hover:bg-white/30"
          }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <span className={`text-[10px] sm:text-xs font-bold drop-shadow-md px-2 py-0.5 rounded-full backdrop-blur-sm ${
            isLiked ? "text-white bg-secondary/80" : "text-white bg-black/40"
          }`}>
            {likes}
          </span>
        </button>
      </div>

      {/* MODERN: Enhanced Content Container */}
      <div className="content absolute inset-0 flex flex-col p-3 sm:p-4 md:p-6 z-10 pt-10 sm:pt-12 md:pt-14">
        {/* MODERN: Enhanced Header Section with gradient backdrop */}
        <div className="flex flex-col items-start gap-1 sm:gap-2 mb-2 sm:mb-3 md:mb-4 mt-auto"> {/* Pushed content down */}
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-md px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl shadow-lg line-clamp-2 border border-white/10 transition-all duration-300 group-hover:border-white/20">
            {name}
          </h2>
        </div>

        {/* MODERN: Enhanced Description with fade effect */}
        <div className="flex-1 mb-2 sm:mb-3 opacity-0 translate-y-6 transition-all duration-600 ease-out group-hover:opacity-100 group-hover:translate-y-0 hidden"> 
          {/* Hidden description for cleaner look on card, or keep? Kept hidden or minimal */}
           <p className="text-white/95 text-xs sm:text-sm leading-relaxed line-clamp-4 sm:line-clamp-5 md:line-clamp-6 drop-shadow-md">
            {description}
          </p>
        </div>

        {/* MODERN: Enhanced tags with modern badge design */}
        {visibleTags.length > 0 && (
          <div className="mb-3 opacity-0 translate-y-6 transition-all duration-600 delay-75 ease-out group-hover:opacity-100 group-hover:translate-y-0">
            <div className="flex items-center gap-2 flex-wrap">
              {visibleTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25 transition-all duration-300 shadow-sm"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {tag}
                </span>
              ))}
              {hasMoreTags && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/80 backdrop-blur-sm text-dark border border-secondary/30 shadow-sm">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* MODERN: Enhanced Bottom Actions with glass morphism */}
        <div className="flex justify-between items-end gap-1.5 sm:gap-2 md:gap-3 opacity-0 translate-y-6 transition-all duration-600 delay-100 ease-out group-hover:opacity-100 group-hover:translate-y-0 w-full">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/80 bg-black/30 backdrop-blur-md px-2 sm:px-3 py-1.5 rounded-lg flex-shrink-0 border border-white/10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{source}</span>
          </div>

          <div className="flex gap-1.5 sm:gap-2 items-center ml-auto sm:ml-0">
            {isLoggedIn ? (
              <>
                {/* Like button moved to top-right, removed here */}
                
                <button
                  onClick={handleSaveClick}
                  className={`group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0 ${
                    isSaved
                      ? "bg-white text-gray-900 border border-white hover:bg-white/90"
                      : "bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 hover:border-white/30"
                  }`}
                  aria-label={isSaved ? `Remove ${name} from saved` : `Save ${name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover/btn:scale-110 sm:w-[14px] sm:h-[14px]"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2z"></path>
                  </svg>
                  <span className="hidden xs:inline">{isSaved ? "Saved" : "Save"}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-1.5 bg-white/15 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0"
                aria-label="Sign in to interact with figures"
              >
                <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // PERFORMANCE: Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these specific props change
  const shouldSkipRender = (
    prevProps.figure._id === nextProps.figure._id &&
    prevProps.figure.wikipediaId === nextProps.figure.wikipediaId &&
    prevProps.figure.likes === nextProps.figure.likes &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.onLikeFigureClick === nextProps.onLikeFigureClick &&
    prevProps.onSaveFigureClick === nextProps.onSaveFigureClick &&
    prevProps.onLoginClick === nextProps.onLoginClick
  );

  // DEBUG: Log when likes change
  if (prevProps.figure.likes !== nextProps.figure.likes) {
    console.log(`👍 FigureCard ${nextProps.figure.name}: likes changed from ${prevProps.figure.likes} to ${nextProps.figure.likes}`);
  }

  // DEBUG: Log when liked status changes
  if (prevProps.isLiked !== nextProps.isLiked) {
    console.log(`❤️ FigureCard ${nextProps.figure.name}: liked status changed to ${nextProps.isLiked}`);
  }

  return shouldSkipRender;
});

export default FigureCard;