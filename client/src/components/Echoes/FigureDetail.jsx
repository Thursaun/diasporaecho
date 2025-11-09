import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFigureById, getFigureByWikipediaId } from '../../utils/api';
import CurrentUserContext from "../../contexts/CurrentUserContext";

function FigureDetail({
  onSaveFigureClick,
  onLikeFigureClick,
  savedFigures = [],
  onLoginClick,
  selectedFigure,
  setSelectedFigure
}) {
    const currentUser = useContext(CurrentUserContext);
    const isLoggedIn = !!currentUser;
    const { id } = useParams();
    const navigate = useNavigate();
    const [figure, setFigure] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    const currentFigure = (selectedFigure &&
      (selectedFigure.wikipediaId === id || selectedFigure._id === id))
      ? selectedFigure
      : figure;

    const isSaved = currentFigure && isLoggedIn ?
        savedFigures.some((savedFigure) =>
          savedFigure.wikipediaId === currentFigure.wikipediaId ||
          savedFigure._id === currentFigure._id
        ) : false;

    // Check if figure is liked
    const isLiked = currentFigure && isLoggedIn && currentUser ?
        (currentFigure.likedBy || []).includes(currentUser._id) : false;

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

        const fetchPromise = isObjectId
          ? getFigureById(id)
          : getFigureByWikipediaId(id);

        fetchPromise
            .then(figureData => {
                console.log("Fetched figure data:", figureData);
                setFigure(figureData);
                if (setSelectedFigure) {
                    setSelectedFigure(figureData);
                }
                setIsLoading(false);
                document.title = `${figureData.name} | Diaspora Echoes`;
            })
            .catch(err => {
                console.error('Error fetching figure:', err);
                setError('Failed to load figure details.');
                setIsLoading(false);
            });

        return () => {
            document.title = 'Diaspora Echoes';
        };
    }, [id, setSelectedFigure]);

    useEffect(() => {
        if (selectedFigure &&
            (selectedFigure.wikipediaId === id || selectedFigure._id === id)) {
            setFigure(selectedFigure);
        }
    }, [selectedFigure, id]);

    const handleLikeClick = () => {
        if (!isLoggedIn) {
            if (onLoginClick) onLoginClick();
            return;
        }
        console.log("FigureDetail: Calling onLikeFigureClick with:", currentFigure);
        onLikeFigureClick(currentFigure);
    };

    const handleSaveClick = () => {
        if (!isLoggedIn) {
            if (onLoginClick) onLoginClick();
            return;
        }
        onSaveFigureClick(currentFigure);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm sm:text-base">Loading figure details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:py-16">
                <div className="container mx-auto max-w-2xl">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-6 sm:p-8 rounded-2xl shadow-xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-red-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-2">Error Loading Figure</h2>
                                <p className="text-sm sm:text-base text-red-700">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md min-h-[44px]"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentFigure) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-8 sm:py-16">
                <div className="container mx-auto max-w-2xl">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 p-6 sm:p-8 rounded-2xl shadow-xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-yellow-500 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-yellow-900 mb-2">Figure Not Found</h2>
                                <p className="text-sm sm:text-base text-yellow-700">The figure you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold shadow-md min-h-[44px]"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const {
        name,
        imageUrl,
        description,
        years,
        tags = [],
        contributions = [],
        source,
        sourceUrl,
        likes = 0
    } = currentFigure;

    console.log("Rendering FigureDetail with likes:", likes, typeof likes);

    const paragraphs = description.split(/\n+/).filter(p => p.trim());

    return (
        <div className="min-h-screen bg-black">
            {/* MODERN: Dramatic Hero Section with Figure Image Background */}
            <div className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] bg-black overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt={name}
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
                    {/* Additional gradient for bottom fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-4 py-4 sm:py-6 min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex flex-col">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-white/90 hover:text-white transition-colors group mb-auto min-h-[44px] px-2 sm:px-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <span className="text-sm sm:text-base font-medium">Back</span>
                    </button>

                    {/* Hero Content - Name and Actions */}
                    <div className="mt-auto pb-6 sm:pb-8 md:pb-12">
                        {/* Figure Name with dramatic styling */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-white drop-shadow-2xl">
                            {name}
                        </h1>

                        {/* Years Badge */}
                        {years && (
                            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 mb-4 sm:mb-6 shadow-2xl">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-base sm:text-lg md:text-xl font-semibold text-white">{years}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {isLoggedIn ? (
                                <>
                                    <button
                                        onClick={handleLikeClick}
                                        className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold transition-all shadow-2xl hover:scale-105 min-h-[44px] text-sm sm:text-base backdrop-blur-md ${
                                            isLiked
                                                ? "bg-white text-black border-2 border-white"
                                                : "bg-white/20 text-white border-2 border-white/40 hover:bg-white/30"
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                        <span>{isLiked ? "Liked" : "Like"} ({typeof likes === 'number' ? likes : 0})</span>
                                    </button>

                                    <button
                                        onClick={handleSaveClick}
                                        className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold transition-all shadow-2xl hover:scale-105 min-h-[44px] text-sm sm:text-base backdrop-blur-md ${
                                            isSaved
                                                ? "bg-white text-black border-2 border-white"
                                                : "bg-white/20 text-white border-2 border-white/40 hover:bg-white/30"
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>{isSaved ? "Saved" : "Save"}</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onLoginClick}
                                    className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-white text-black rounded-xl font-bold transition-all shadow-2xl hover:scale-105 min-h-[44px] text-sm sm:text-base backdrop-blur-md"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Sign in to Like and Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODERN: Content Section */}
            <div className="bg-gradient-to-b from-black to-gray-900">
                <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                        {/* MODERN: Sidebar */}
                        <aside className="lg:w-1/3">
                            <div className="lg:sticky lg:top-8">
                                {/* MODERN: Quick Facts Card */}
                                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                                <div className="bg-gradient-to-r from-secondary to-dark px-6 py-4">
                                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Quick Facts
                                    </h2>
                                </div>

                                    <div className="p-6">
                                        <dl className="space-y-4">
                                            {years && (
                                                <div className="border-b border-gray-700 pb-4">
                                                    <dt className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Years</dt>
                                                    <dd className="text-base font-medium text-white">{years}</dd>
                                                </div>
                                            )}

                                            {tags && tags.length > 0 && (
                                                <div className="border-b border-gray-700 pb-4">
                                                    <dt className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Categories</dt>
                                                    <dd>
                                                        <div className="flex flex-wrap gap-2">
                                                            {tags.map((tag, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-secondary/30 to-dark/30 text-white border border-secondary/40 rounded-full text-xs font-semibold"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </dd>
                                                </div>
                                            )}

                                            <div>
                                                <dt className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Source</dt>
                                                <dd>
                                                    {sourceUrl ? (
                                                        <a
                                                            href={sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-secondary hover:text-light font-medium transition-colors group"
                                                        >
                                                            <span>{source || "View Source"}</span>
                                                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-300">{source || "Unknown"}</span>
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* MODERN: Main Content */}
                        <main className="lg:w-2/3">
                            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                                <div className="p-6 sm:p-8 lg:p-10">
                                    <article className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-secondary prose-strong:text-white prose-li:text-gray-300">
                                        <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white mb-6 pb-4 border-b-2 border-secondary/40">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                            </svg>
                                            Biography
                                        </h2>

                                        {paragraphs.map((paragraph, index) => (
                                            <p key={index} className="leading-relaxed mb-4 text-gray-300">{paragraph}</p>
                                        ))}

                                        {contributions && contributions.length > 0 && (
                                            <>
                                                <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white mt-8 mb-6 pb-4 border-b-2 border-secondary/40">
                                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Key Contributions
                                                </h2>
                                                <ul className="space-y-3">
                                                    {contributions.map((contribution, index) => (
                                                        <li key={index} className="flex items-start gap-3 text-gray-300">
                                                            <span className="flex-shrink-0 w-6 h-6 bg-secondary/30 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">
                                                                {index + 1}
                                                            </span>
                                                            <span className="flex-1">{contribution}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}

                                        <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white mt-8 mb-6 pb-4 border-b-2 border-secondary/40">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                            </svg>
                                            References
                                        </h2>
                                        <ol className="list-decimal pl-6 space-y-2">
                                            <li className="text-gray-300">
                                                <a
                                                    href={sourceUrl || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-secondary hover:text-light font-medium inline-flex items-center gap-2 group"
                                                >
                                                    <span>{source || "Primary source"}</span>
                                                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </li>
                                        </ol>
                                    </article>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FigureDetail;
