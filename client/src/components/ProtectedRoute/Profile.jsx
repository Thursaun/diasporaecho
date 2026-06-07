import { useState, useEffect, useContext, useMemo } from 'react';
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

const getFirstSentence = (text) => {
  if (!text || typeof text !== 'string') return "";
  
  let pLevel = 0; // parentheses level ()
  let bLevel = 0; // brackets level []
  let sentenceEnd = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(') pLevel++;
    else if (char === ')') pLevel--;
    else if (char === '[') bLevel++;
    else if (char === ']') bLevel--;
    else if (pLevel === 0 && bLevel === 0 && (char === '.' || char === '!' || char === '?')) {
      const nextText = text.substring(i + 1);
      const hasSpaceAndCapital = /^\s+([A-Z\d]|$)/.test(nextText) || nextText.trim() === "";
      
      const backwardText = text.substring(0, i);
      const isAbbreviation = /\b(c|ca|dr|mr|mrs|ms|jr|sr|st|vs|al|gen|col|maj|capt|lieut|rev|prof|univ|est|dept)\s*$/i.test(backwardText) ||
                             /\b[A-Z]\s*$/i.test(backwardText);
      
      if (hasSpaceAndCapital && !isAbbreviation) {
        sentenceEnd = i;
        break;
      }
    }
  }
  
  let firstSentence = "";
  if (sentenceEnd !== -1) {
    firstSentence = text.substring(0, sentenceEnd + 1).trim();
  } else {
    firstSentence = text.trim();
  }
  
  return firstSentence;
};

const determineClientEra = (years) => {
  if (!years || typeof years !== 'string') return "Unknown Era";
  const match = years.match(/\b\d{4}\b/);
  if (!match) return "Unknown Era";
  
  const birthYear = parseInt(match[0], 10);
  const year = birthYear + 25; // Estimate era based on age of impact (approx. 25 years after birth)
  
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
    const firstSentence = getFirstSentence(figure.description);
    if (firstSentence) {
      return firstSentence.length > 155 ? firstSentence.substring(0, 152) + "..." : firstSentence;
    }
  }
  return "Renowned contributor to culture, history, and society.";
};

const getSanitizedFlashcardText = (figure) => {
  const text = getLegacyText(figure);
  if (!text || !figure || !figure.name) return text;

  const name = figure.name.trim();
  const titleAndShortRegex = /^(dr|mr|mrs|ms|jr|sr|iii|ii|i)\.?$/i;
  const nameParts = name
    .split(/[\s\-]+/)
    .map(part => part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim())
    .filter(part => part.length > 2 && !titleAndShortRegex.test(part));

  let sanitized = text;
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace possessive full name first
  const escapedFullName = escapeRegExp(name);
  const possessiveFullNameRegex = new RegExp(`\\b${escapedFullName}'s\\b`, 'gi');
  sanitized = sanitized.replace(possessiveFullNameRegex, "[This Figure]'s");

  // Replace full name
  const fullNameRegex = new RegExp(`\\b${escapedFullName}\\b`, 'gi');
  sanitized = sanitized.replace(fullNameRegex, '[This Figure]');

  // Replace each name part
  nameParts.sort((a, b) => b.length - a.length);
  nameParts.forEach(part => {
    const escapedPart = escapeRegExp(part);
    const possessivePartRegex = new RegExp(`\\b${escapedPart}'s\\b`, 'gi');
    sanitized = sanitized.replace(possessivePartRegex, "[This Figure]'s");
    
    const partRegex = new RegExp(`\\b${escapedPart}\\b`, 'gi');
    sanitized = sanitized.replace(partRegex, '[This Figure]');
  });

  return sanitized;
};

const getStartYear = (yearsText) => {
  if (!yearsText || typeof yearsText !== 'string') return 9999;
  const match = yearsText.match(/\b\d{4}\b/);
  return match ? parseInt(match[0], 10) : 9999;
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function Profile({ onLikeFigureClick, onSaveFigureClick, onLoginClick, savedFigures = [] }) {
  const currentUser = useContext(CurrentUserContext);
  const navigate = useNavigate();
  const loading = false;
  const error = null;
  const [activeCategory, setActiveCategory] = useState("all");
  const [categorizedFigures, setCategorizedFigures] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("collection"); // "collection" | "timeline" | "flashcards"

  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [shuffledSeed, setShuffledSeed] = useState(0);

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

  // Handle flashcard deck initialization
  useEffect(() => {
    if (Array.isArray(savedFigures) && savedFigures.length > 0) {
      const validFigures = savedFigures.filter(item => typeof item === 'object' && item !== null);
      setFlashcards(shuffleArray(validFigures));
      setFlashcardIndex(0);
      setIsRevealed(false);
    } else {
      setFlashcards([]);
    }
  }, [savedFigures, shuffledSeed]);

  // Compute timeline data
  const timelineFigures = useMemo(() => {
    if (!Array.isArray(savedFigures)) return [];
    return [...savedFigures]
      .filter(item => typeof item === 'object' && item !== null)
      .sort((a, b) => getStartYear(a.years) - getStartYear(b.years));
  }, [savedFigures]);

  const isFigureSaved = () => {
    return true; 
  };

  const isFigureLiked = (figure) => {
    if (!currentUser || !figure) return false;
    const likedBy = figure.likedBy || [];
    return likedBy.includes(currentUser._id);
  };

  const handleNextFlashcard = () => {
    setIsRevealed(false);
    // Add small delay to let card flip back before changing content
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  };

  const handleReshuffle = () => {
    setShuffledSeed(prev => prev + 1);
  };

  if (!currentUser) {
    return null; 
  }

  const currentFlashcard = flashcards[flashcardIndex];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12 px-4 shadow-md mb-8">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">My Study Profile</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base mb-6">
            Welcome, {currentUser.name}! Analyze, timeline, and quiz yourself on the {savedFigures.length} historical figure{savedFigures.length !== 1 ? 's' : ''} in your study deck.
          </p>

          {/* TAB SWITCHER */}
          <div className="inline-flex p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab("collection")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeTab === "collection"
                  ? "bg-white text-dark shadow-md"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My Collection
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeTab === "timeline"
                  ? "bg-white text-dark shadow-md"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline Study
            </button>
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeTab === "flashcards"
                  ? "bg-white text-dark shadow-md"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Flashcards Mode
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-10">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto shadow-md">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && savedFigures.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-150 p-8 max-w-lg mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-secondary/10 rounded-full text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Study Deck is Empty</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Explore our archives, search for historical Black figures, and click &ldquo;Save&rdquo; to build your personal study profile deck!
            </p>
            <a 
              href="/echoes" 
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-xl hover:bg-opacity-95 transition-colors font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Explore Figures
            </a>
          </div>
        )}

        {!loading && !error && savedFigures.length > 0 && (
          <>
            {/* TAB 1: COLLECTION GRID */}
            {activeTab === "collection" && (
              <div>
                {/* FILTER BAR: Dropdown + Search */}
                <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-150">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                    {/* Category Dropdown */}
                    <div className="relative flex-shrink-0 md:w-64">
                      <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <option value="all">All Categories ({categorizedFigures.all?.length || 0})</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category} ({categorizedFigures[category]?.length || 0})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        placeholder="Search your study deck..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <span className="text-xs text-gray-400 font-semibold">Filtering:</span>
                      {activeCategory !== "all" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                          {activeCategory}
                          <button onClick={() => setActiveCategory("all")} className="hover:text-primary/70 ml-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                          &ldquo;{searchQuery}&rdquo;
                          <button onClick={() => setSearchQuery("")} className="hover:text-gray-800 ml-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
                        className="text-xs text-gray-400 hover:text-secondary font-bold underline transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Figures Grid */}
                {(() => {
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
                        if (!figure || typeof figure !== 'object') return null;

                        return (
                          <div key={figure._id || figure.wikipediaId || `figure-${index}`} className="transform transition-transform hover:scale-[1.02] duration-300">
                            <FigureCard
                              figure={figure}
                              onSaveFigureClick={() => onSaveFigureClick(figure)}
                              onLikeFigureClick={() => onLikeFigureClick(figure)}
                              onLoginClick={onLoginClick}
                              isSaved={isFigureSaved(figure)}
                              isLiked={isFigureLiked(figure)}
                            />
                          </div>
                        );
                      })}

                      {filteredFigures.length === 0 && (
                        <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-150">
                          <p className="text-gray-500 font-medium">
                            {searchQuery ? `No figures match "${searchQuery}"` : 'No saved figures in this category'}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {searchQuery 
                              ? 'Try searching for another figure or clear the filter.'
                              : `Check back after saving figures in the ${activeCategory} category!`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 2: TIMELINE STUDY */}
            {activeTab === "timeline" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 mb-8 text-center">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Chronological Timeline
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
                    Study the timeline of Black history through your collection. Figures are ordered chronologically by their active eras. Click any card to study their full biography.
                  </p>
                </div>

                {/* Vertical Timeline component */}
                <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-32 pl-8 space-y-12 py-4">
                  {timelineFigures.map((fig, idx) => {
                    const figEra = determineClientEra(fig.years);
                    const eraStyle = getEraStyles(figEra);
                    const figLegacy = getLegacyText(fig);

                    return (
                      <div key={fig._id || fig.wikipediaId || `timeline-${idx}`} className="relative group">
                        {/* Timeline node marker (Left Era bubble on desktops, node on line for mobile) */}
                        <div className="absolute -left-[45px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-primary flex items-center justify-center group-hover:scale-125 transition-transform duration-300 z-10 shadow-sm" />
                        
                        {/* Left floating Era indicator (desktops only) */}
                        <div className="hidden sm:block absolute -left-[160px] top-1 w-28 text-right text-xs font-bold text-gray-500 pr-4">
                          <span className="block text-primary text-[10px] uppercase tracking-wider">{fig.years || "Unknown"}</span>
                          <span className="block text-gray-400 text-[9px] mt-0.5 leading-snug truncate" title={figEra}>{figEra}</span>
                        </div>

                        {/* Interactive Timeline Card */}
                        <div 
                          onClick={() => navigate(`/figures/${fig._id || fig.wikipediaId}`)}
                          className="bg-white rounded-2xl shadow-sm border border-gray-150 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-5 items-stretch relative overflow-hidden"
                        >
                          {/* Miniature portrait */}
                          <div className="w-full md:w-28 h-32 md:h-auto rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative shadow-inner">
                            <img 
                              src={fig.imageUrl} 
                              alt={fig.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="md:hidden absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-white backdrop-blur-sm">
                              {fig.years}
                            </div>
                          </div>

                          {/* Detail content */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              {/* Mobile-only era tag */}
                              <div className="md:hidden flex flex-wrap gap-1.5 mb-1.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${eraStyle}`}>
                                  {figEra}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                {fig.name}
                                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border bg-gray-50 border-gray-200 text-gray-500">
                                  {fig.categories?.[0] || fig.category || "General"}
                                </span>
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-700 italic border-l-2 border-gold/40 pl-3 py-1 my-2 leading-relaxed bg-amber-50/20 rounded-r-md">
                                &ldquo;{figLegacy}&rdquo;
                              </p>
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <span className="font-semibold text-primary/80">Category: {fig.categories?.[0] || fig.category || "General"}</span>
                              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Read bio 
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: FLASHCARD STUDY */}
            {activeTab === "flashcards" && (
              <div className="max-w-xl mx-auto text-center">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 mb-8">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Flashcard Study Deck
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto">
                    A card is presented with a figure&apos;s Era and place in the Annals of History. Recall who they are, then reveal to check your answer!
                  </p>
                  <div className="mt-3 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block border border-primary/20">
                    Card {flashcardIndex + 1} of {flashcards.length}
                  </div>
                </div>

                {currentFlashcard && (
                  <div className="mb-8">
                    {/* 3D FLIP CONTAINER */}
                    <div 
                      onClick={() => setIsRevealed(!isRevealed)}
                      className="group relative w-full aspect-[3/4] sm:aspect-[1/1.25] max-w-sm mx-auto cursor-pointer perspective-1000 mb-6"
                    >
                      <div 
                        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
                          isRevealed ? "rotate-y-180" : "rotate-y-0"
                        }`}
                      >
                        {/* FRONT FACE (The Mystery Prompt) */}
                        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg border border-gold/30 p-6 flex flex-col justify-between z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                          {/* Top row */}
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                              Mystery Figure
                            </span>
                            <span className="text-xs text-gray-400 font-bold">
                              {currentFlashcard.years}
                            </span>
                          </div>

                          {/* Center Content: Annals text */}
                          <div className="my-auto py-4 space-y-4">
                            <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto border border-gold/20">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="block text-[10px] font-extrabold text-gold uppercase tracking-widest">Annals of History Entry</span>
                            <p className="text-sm sm:text-base md:text-lg font-medium italic leading-relaxed text-gray-100 px-3 line-clamp-6">
                              &ldquo;{getSanitizedFlashcardText(currentFlashcard)}&rdquo;
                            </p>
                          </div>

                          {/* Bottom Row */}
                          <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-gray-400">
                              Historical Era
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${getEraStyles(determineClientEra(currentFlashcard.years))}`}>
                              {determineClientEra(currentFlashcard.years)}
                            </span>
                            <span className="text-[9px] text-gold/60 mt-2 animate-pulse">Click card to reveal identity</span>
                          </div>
                        </div>

                        {/* BACK FACE (Identity Revealed) */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-lg border border-primary/30 p-6 flex flex-col justify-between z-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                          {/* Top Row */}
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                              Identity Revealed
                            </span>
                            <span className="text-xs text-gray-400 font-bold">
                              {currentFlashcard.years}
                            </span>
                          </div>

                          {/* Revealed Content */}
                          <div className="my-auto py-2 flex flex-col items-center">
                            {/* Circle Portrait */}
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-primary mb-3 shadow-md bg-gray-700">
                              <img src={currentFlashcard.imageUrl} alt={currentFlashcard.name} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">{currentFlashcard.name}</h3>
                            <span className="inline-block text-xs font-semibold text-gold/80 mb-2">
                              {currentFlashcard.categories?.[0] || currentFlashcard.category || "Historical Figure"}
                            </span>
                            <p className="text-[10px] sm:text-xs text-gray-400 max-w-xs mx-auto line-clamp-3 leading-relaxed px-4">
                              {currentFlashcard.description}
                            </p>
                          </div>

                          {/* Bottom Row */}
                          <div className="border-t border-white/10 pt-3 flex justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/figures/${currentFlashcard._id || currentFlashcard.wikipediaId}`);
                              }}
                              className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-opacity-90 font-semibold text-xs transition-colors border border-primary/30 shadow-sm flex items-center gap-1.5"
                            >
                              View Biography
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </button>
                            <span className="text-[9px] text-gray-400 self-center">Click card to hide</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={handleReshuffle}
                        className="px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 active:scale-95"
                        title="Shuffle the card deck"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Shuffle Deck
                      </button>

                      <button
                        onClick={isRevealed ? handleNextFlashcard : () => setIsRevealed(true)}
                        className={`px-6 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 text-white ${
                          isRevealed 
                            ? "bg-primary hover:bg-opacity-95" 
                            : "bg-secondary hover:bg-opacity-95"
                        }`}
                      >
                        {isRevealed ? (
                          <>
                            Next Card
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Reveal Identity
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;