import { useContext, useState, memo, useCallback, useRef } from "react";
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
  badge = null, // New prop for external badges (e.g., Featured, Rank)
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

  // FLIP CARD STATE
  const [isFlipped, setIsFlipped] = useState(false);
  const hoverTimerRef = useRef(null);

  // =============================================================================
  // DATA EXTRACTION: Optimized destructuring (with fallbacks for null figure)
  // =============================================================================
  
  const {
    _id = null,
    wikipediaId = null,
    name = '',
    imageUrl = '',
    description = '',
    years = null,
    tags = [],
    likes = 0,
    source = '',
    categories = [],
    occupation = [],
  } = figure || {};

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Event Handlers
  // =============================================================================

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Event Handlers
  // =============================================================================
  
  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsFlipped(true);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleFlipBack = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  const handleManualFlip = (e) => {
    e.stopPropagation();
    setIsFlipped(true);
  };

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
    // Prevent navigation if flipped (interaction is on back)
    if (isFlipped) return;

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
  }, [_id, wikipediaId, figure, name, navigate, isFlipped]);

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
  // EARLY RETURN: After all hooks are defined
  // =============================================================================
  
  if (!figure) {
    console.warn('FigureCard received invalid figure data');
    return null;
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  // Helper to get icon based on category
  const getCategoryIcon = () => {
    const mainCategory = categories[0] || (occupation[0] ? occupation[0] : "General");
    const lowerCat = mainCategory.toLowerCase();
    let path = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"; // Default Star

    if (lowerCat.includes("music") || lowerCat.includes("singer")) {
      path = "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"; // Music Note
    } else if (lowerCat.includes("politic") || lowerCat.includes("leader")) {
      path = "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"; // Building
    } else if (lowerCat.includes("scholar") || lowerCat.includes("educator") || lowerCat.includes("writer")) {
      path = "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"; // Book
    } else if (lowerCat.includes("activist") || lowerCat.includes("freedom")) {
      path = "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"; // Fire
    } else if (lowerCat.includes("athlete") || lowerCat.includes("sport")) {
      path = "M8 21h8m-4-8v8m-4.878-8c.915 2.43 2.957 4 5.378 4s4.463-1.57 5.378-4M2 7.7a7 7 0 0113.6 0M2 7.7V5a2 2 0 012-2h12a2 2 0 012 2v2.7A7 7 0 0116.35 15.65"; // Trophy
    }

    return (
      <svg className="w-16 h-16 text-secondary/90 drop-shadow-lg mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
      </svg>
    );
  };

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Data Processing
  // =============================================================================
  
  // PERFORMANCE: Process years data only once
  const displayYears = years && years !== "Unknown" ? years : null;
  
  // PERFORMANCE: Process tags only when needed
  const visibleTags = tags.length > 0 ? tags.slice(0, 3) : [];
  const hasMoreTags = tags.length > 3;

  // =============================================================================
  // PERFORMANCE: Optimized Rendering
  // =============================================================================

  return (
    <div
      className="group relative w-full max-w-sm aspect-[3/4] sm:aspect-[1/1.4] cursor-pointer perspective-1000" // Added perspective
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {/* 3D FLIP CONTAINER */}
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : "rotate-y-0"
        }`}
      >
        
        {/* ======================= FRONT FACE ======================= */}
        <div className="absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
          
          {/* Glass Overlay Ring */}
          <div className="absolute inset-0 rounded-2xl ring-0 ring-secondary/30 group-hover:ring-4 transition-all duration-500 pointer-events-none z-30"></div>

          {/* Image */}
          <div className="image-box absolute inset-0 overflow-hidden">
             {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin"></div>
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
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
             <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
                 <span className="text-gray-500">No Image</span>
             </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-85 transition-all duration-700 group-hover:opacity-95"></div>
          </div>

          {/* Badges & Like Button (Front) */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-wrap gap-2 pointer-events-auto">
              {displayYears && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-gray-900 shadow-lg">
                  {displayYears}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
               {badge && <div className="mb-0.5">{badge}</div>}
               <button onClick={handleLikeClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${isLiked ? "scale-110" : "opacity-90 hover:scale-110"}`}>
                  <div className={`p-2.5 rounded-full shadow-lg border ${isLiked ? "bg-secondary text-white border-secondary" : "bg-white/20 text-white border-white/20"}`}>
                     <svg viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                       <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                     </svg>
                  </div>
                  <span className="text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">{likes}</span>
               </button>
            </div>
          </div>

          {/* Content (Front) */}
          <div className="absolute inset-0 flex flex-col p-4 md:p-6 z-10 pt-12 md:pt-14 justify-end">
             <h2 className="text-lg md:text-xl font-bold text-white mb-2">{name}</h2>
             
             {visibleTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {visibleTags.map((t, i) => (
                        <span key={i} className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">{t}</span>
                    ))}
                    {hasMoreTags && <span className="text-xs text-white/80">+{tags.length - 3}</span>}
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
                  {/* MANUAL FLIP BUTTON */}
                  <button
                     onClick={handleManualFlip}
                     className="group/btn inline-flex items-center justify-center w-[44px] h-[44px] sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-sm"
                     aria-label="View Info"
                     title="View Info"
                   >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                   </button>

                 {isLoggedIn ? (
                   <>
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


        {/* ======================= BACK FACE (Historical Context) ======================= */}
        <div 
          className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl p-6 flex flex-col items-center justify-center text-center z-40 bg-gradient-to-br from-indigo-50 to-white"
        >
          {/* Animated Background Blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center h-full justify-center">
            {getCategoryIcon()}
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">{name}</h3>
            
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary mb-4 border border-secondary/20">
              {categories[0] || "Historical Figure"}
            </span>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-6 mb-6 px-2">
              {description}
            </p>

            <button
              onClick={handleFlipBack}
              className="mt-auto px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Flip Back
            </button>
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
    prevProps.onLoginClick === nextProps.onLoginClick &&
    prevProps.badge === nextProps.badge
  );

  return shouldSkipRender;
});

export default FigureCard;