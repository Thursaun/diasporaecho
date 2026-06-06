import { useContext, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { getOptimizedImageUrl } from "../../utils/imageUtils";

// =============================================================================
// PERFORMANCE IMPROVEMENT: Memoized Component with custom comparison
// =============================================================================

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

const getEraStyles = (eraName) => {
  const name = eraName || "";
  if (name.includes("Slavery")) return "bg-red-950/80 text-red-200 border-red-800/40";
  if (name.includes("Reconstruction")) return "bg-purple-950/80 text-purple-200 border-purple-800/40";
  if (name.includes("Jim Crow")) return "bg-amber-950/80 text-amber-200 border-amber-800/40";
  if (name.includes("Harlem")) return "bg-amber-700/80 text-amber-100 border-amber-600/40";
  if (name.includes("Civil Rights")) return "bg-emerald-950/80 text-emerald-200 border-emerald-800/40";
  return "bg-cyan-950/80 text-cyan-200 border-cyan-800/40";
};

const getLegacyText = (figure) => {
  if (!figure) return "";
  if (figure.legacy) return figure.legacy;
  if (figure.contributions && figure.contributions.length > 0) return figure.contributions[0];
  if (figure.description) {
    const sentences = figure.description.split(/(?<=[.!?])\s+/);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      return firstSentence.length > 150 ? firstSentence.substring(0, 147) + "..." : firstSentence;
    }
  }
  return "Renowned contributor to culture, history, and society.";
};

const getFormattedYearsRange = (yearsStr) => {
  if (!yearsStr || typeof yearsStr !== 'string' || yearsStr === 'Unknown') return '(Unknown Years)';
  
  let clean = yearsStr.replace(/born\s+/i, '').trim();
  clean = clean.replace(/[–—]/g, '-');
  
  const parts = clean.split('-');
  
  if (parts.length === 1) {
    const birth = parts[0].trim();
    if (/^\d{4}$/.test(birth)) {
      return `(${birth}-Present)`;
    }
    return `(${birth})`;
  }
  
  if (parts.length === 2) {
    const birth = parts[0].trim();
    let death = parts[1].trim();
    
    if (!death || death.toLowerCase() === 'present') {
      death = 'Present';
    }
    
    return `(${birth}-${death})`;
  }
  
  return `(${clean.replace(/\s+/g, '')})`;
};

const FigureCard = memo(function FigureCard({
  figure,
  onLikeFigureClick,
  onSaveFigureClick,
  isSaved,
  isLiked,
  onLoginClick,
  priority = false, // PERFORMANCE: Priority loading for above-the-fold images
  badge = null, // New prop for external badges (e.g., Featured, Rank)
  hideInteractions = false, // Hide like/save buttons (for search results)
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
    likes = 0,
    source = '',
    sourceUrl = '',
    categories = [],
    occupation = [],
    // Wikidata metadata for achievements
    awards = [],
    notableWorks = [],
    movement = [],
    birthPlace = null,
    era = null,
    legacy = null,
  } = figure || {};

  const displayEra = era || determineClientEra(years);
  const displayLegacy = legacy || getLegacyText(figure);

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Event Handlers
  // =============================================================================

  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Memoized Event Handlers
  // =============================================================================
  


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
    
    // PERFORMANCE: Pass figure data via state to avoid re-fetching
    const figureState = { figure };
    
    if (_id) {
      navigate(`/figures/${_id}`, { state: figureState });
    } else if (wikipediaId) {
      navigate(`/figures/${wikipediaId}`, { state: figureState });
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



  // =============================================================================
  // PERFORMANCE IMPROVEMENT: Optimized Data Processing
  // =============================================================================
  
  // PERFORMANCE: Process years data only once
  const displayYears = years && years !== "Unknown" ? years : "Unknown Years";
  


  // =============================================================================
  // PERFORMANCE: Optimized Rendering
  // =============================================================================

  return (
    <div
      className="group relative w-full max-w-sm aspect-[3/4] sm:aspect-[1/1.4] cursor-pointer perspective-1000" // Added perspective
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
          <div className="absolute inset-0 rounded-2xl ring-0 ring-secondary/30 pointer-events-none z-30"></div>

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
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-85 transition-all duration-700 group-hover:opacity-95"></div>
          </div>

          {/* Badges & Like Button (Front) */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex justify-between items-center pointer-events-none opacity-0 -translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
            <div className="flex flex-col gap-1.5 pointer-events-auto items-start max-w-[70%]">
              {displayEra && displayEra !== "Unknown Era" && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border shadow-md backdrop-blur-md ${getEraStyles(displayEra)}`}>
                  {displayEra}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
               {!hideInteractions && (
                 <button onClick={handleLikeClick} className={`flex flex-col items-center gap-1 transition-all duration-150 ${isLiked ? "scale-110" : "opacity-90 hover:scale-110"}`}>
                   <div className={`p-2.5 rounded-full shadow-lg border ${isLiked ? "bg-dark/60 backdrop-blur text-white border-white/20" : "bg-white/20 text-white border-white/20"}`}>
                      <svg viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                   </div>
                   <span className="text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">{likes}</span>
                 </button>
               )}
            </div>
          </div>

          {/* Content (Front) */}
          <div className="absolute inset-0 flex flex-col p-4 md:p-6 z-10 pt-12 md:pt-14 justify-end items-center text-center">
             <div className="w-full mb-2">
               <h2 className="text-lg md:text-xl font-bold text-white leading-tight break-words">
                 {name}
               </h2>
               <span className="text-xs md:text-sm font-normal text-white/70 block mt-1">
                 {getFormattedYearsRange(years)}
               </span>
             </div>

             {/* MODERN: Centered Bottom Actions */}
             <div className="flex justify-center items-center gap-2 sm:gap-3 opacity-0 translate-y-6 transition-all duration-600 delay-100 ease-out group-hover:opacity-100 group-hover:translate-y-0 w-full">
                {/* MANUAL FLIP BUTTON */}
                <button
                   onClick={handleManualFlip}
                   className="group/btn inline-flex items-center justify-center w-[44px] h-[44px] sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-sm"
                   aria-label="View Info"
                   title="View Info"
                 >
                    <svg className="w-4 h-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline text-xs font-semibold">Info</span>
                 </button>

               {!hideInteractions && (
                 <>
                   {isLoggedIn ? (
                     <button
                       onClick={handleSaveClick}
                       className={`group/btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0 ${
                         isSaved
                           ? "bg-white text-gray-900 border border-white hover:bg-white/90"
                           : "bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 hover:border-white/30"
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
                         className="transition-transform group-hover/btn:scale-110"
                       >
                         <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                       </svg>
                       <span>{isSaved ? "Saved" : "Save"}</span>
                     </button>
                   ) : (
                     <button
                       onClick={handleLoginClick}
                       className="group/btn inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0"
                       aria-label="Sign in to interact with figures"
                     >
                       <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                       <span>Sign in</span>
                     </button>
                   )}
                 </>
               )}
             </div>
          </div>
        </div>


        {/* ======================= BACK FACE (Achievements) ======================= */}
        <div 
          className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl p-4 sm:p-6 flex flex-col z-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          {/* Header - Name, Badge, Date each on own line centered */}
          <div className="relative z-10 text-center mb-1">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">{name}</h3>
            <div className="flex flex-wrap gap-1.5 justify-center items-center mb-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white/10 text-white/90 border border-white/20">
                {categories[0] || occupation[0] || "Historical Figure"}
              </span>
              {displayEra && displayEra !== "Unknown Era" && (
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${getEraStyles(displayEra)}`}>
                  {displayEra}
                </span>
              )}
            </div>
            {displayYears && (
              <p className="text-xs sm:text-sm text-gray-300 font-medium">{displayYears}</p>
            )}
          </div>
 
          {/* Achievements & Legacy List */}
          <div className="relative z-10 mt-2 overflow-y-auto flex-1 flex flex-col justify-center gap-2 max-h-[60%]">
            {/* Annals of History / Why they are remembered */}
            <div className="border-t border-b border-gold/20 py-2.5 my-1">
              <span className="block text-[10px] font-bold text-gold uppercase tracking-widest text-center mb-1">Annals of History</span>
              <p className="text-xs sm:text-sm text-gray-200 text-center italic leading-relaxed px-2 line-clamp-3">
                &ldquo;{displayLegacy}&rdquo;
              </p>
            </div>

            <div className="w-full mt-1.5 flex flex-col gap-2">
              {(() => {
                const items = [];
                const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

                if (awards && awards.length > 0) {
                  items.push({ label: 'Award', val: capitalize(awards[0]), icon: '🏆' });
                }
                if (notableWorks && notableWorks.length > 0) {
                  items.push({ label: 'Notable Work', val: `"${capitalize(notableWorks[0])}"`, icon: '📚' });
                }
                if (movement && movement.length > 0) {
                  const mText = movement[0].toLowerCase().includes('movement') 
                    ? capitalize(movement[0]) 
                    : `${capitalize(movement[0])} movement`;
                  items.push({ label: 'Movement', val: mText, icon: '✊' });
                }
                if (birthPlace) {
                  items.push({ label: 'Born', val: capitalize(birthPlace), icon: '📍' });
                }

                // If we have at least 2 structured items, render them as a sleek grid!
                if (items.length >= 2) {
                  return (
                    <div className="grid grid-cols-2 gap-2 text-left">
                      {items.slice(0, 4).map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-start gap-2 backdrop-blur-sm hover:bg-white/10 transition-colors">
                          <span className="text-base leading-none mt-0.5">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</span>
                            <span className="block text-[10px] sm:text-xs font-semibold text-white truncate" title={item.val}>{item.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // Fallback: If we don't have enough metadata, render the description sentences in modern full-width cards!
                const sentences = description
                  .split(/(?<=[.!?])\s+/)
                  .map(s => s.trim())
                  .filter(s => {
                    if (!/^[A-Z]/.test(s)) return false;
                    if (s.length < 25 || s.length > 150) return false;
                    if (/^(He|She|They|It) (was|is|were|are) (a|an|the|born)/.test(s)) return false;
                    return true;
                  })
                  .slice(0, 2);

                const displayItems = sentences.length >= 1 
                  ? sentences.map(s => s.replace(/[.!?]$/, ''))
                  : [
                      "Influenced policy, culture, or social progress",
                      "Pioneered pathfinding work in their field"
                    ];

                return (
                  <div className="flex flex-col gap-2 w-full text-left">
                    {displayItems.map((text, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-start gap-2.5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <span className="text-amber-400 text-xs mt-0.5">★</span>
                        <p className="text-[10px] sm:text-xs text-gray-200 leading-normal font-medium mb-0">{text}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer with source link and flip back button */}
          <div className="relative z-10 flex justify-between items-center mt-auto pt-3 border-t border-white/10 gap-2">
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-white/70 hover:text-white bg-white/5 border border-white/10 px-2.5 py-2 rounded-lg transition-all"
              >
                <span>{source || 'Source'}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <span className="text-[10px] sm:text-xs text-white/40">{source || 'Wikipedia'}</span>
            )}
            
            <button
              onClick={handleFlipBack}
              className="px-3.5 py-2 bg-white/10 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-1.5 border border-white/20"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  // PERFORMANCE: Custom comparison to prevent unnecessary re-renders
  // Guard against null/undefined figure (crashes the entire card grid otherwise)
  if (!prevProps.figure || !nextProps.figure) return prevProps.figure === nextProps.figure;

  return (
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
});

export default FigureCard;