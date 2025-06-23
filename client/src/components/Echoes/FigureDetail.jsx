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

    const currentFigure = (selectedFigure && 
      (selectedFigure.wikipediaId === id || selectedFigure._id === id)) 
      ? selectedFigure 
      : figure;

    const isSaved = currentFigure && isLoggedIn ?
        savedFigures.some((savedFigure) => 
          savedFigure.wikipediaId === currentFigure.wikipediaId ||
          savedFigure._id === currentFigure._id
        ) : false;
    
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
            <div className="container mx-auto px-4 py-16 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-red-50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!currentFigure) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="bg-yellow-50 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold text-yellow-800 mb-2">Figure Not Found</h2>
                    <p className="text-yellow-700">The figure you&apos;re looking for doesn&apos;t exist.</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-yellow-800 text-white rounded hover:bg-yellow-900"
                    >
                        Go Back
                    </button>
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
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-gray-600 hover:text-black"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back
                </button>
            </div>

            <header className="border-b border-gray-200 pb-6 mb-8">
                <h1 className="text-4xl font-bold mb-2">{name}</h1>
                {years && <p className="text-xl text-gray-600 mb-4">{years}</p>}
                
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <button
                                onClick={handleLikeClick}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                Like ({typeof likes === 'number' ? likes : 0})
                            </button>
                            
                            <button
                                onClick={handleSaveClick}
                                className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                                    isSaved 
                                    ? "bg-black text-white hover:bg-gray-800" 
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                                {isSaved ? "Saved" : "Save"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                        >
                            Sign in to Like and Save
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-1/3">
                    <div className="sticky top-8">
                        <div className="rounded-lg overflow-hidden shadow-lg mb-6">
                            <img 
                                src={imageUrl} 
                                alt={name} 
                                className="w-full object-cover"
                            />
                            <div className="p-4 bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    {name} ({years || "Unknown"})
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 shadow-lg">
                            <h2 className="text-xl font-bold border-b border-gray-200 pb-2 mb-4">Quick Facts</h2>
                            
                            <dl className="space-y-3">
                                {years && (
                                    <>
                                        <dt className="font-semibold">Years</dt>
                                        <dd className="ml-4 text-gray-700">{years}</dd>
                                    </>
                                )}
                                
                                {tags && tags.length > 0 && (
                                    <>
                                        <dt className="font-semibold">Categories</dt>
                                        <dd className="ml-4">
                                            <div className="flex flex-wrap gap-1">
                                                {tags.map((tag, index) => (
                                                    <span key={index} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </dd>
                                    </>
                                )}
                                
                                <dt className="font-semibold">Source</dt>
                                <dd className="ml-4">
                                    {sourceUrl ? (
                                        <a 
                                            href={sourceUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {source || "Unknown"}
                                        </a>
                                    ) : (
                                        <span>{source || "Unknown"}</span>
                                    )}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </aside>

                <main className="lg:w-2/3">
                    <article className="prose lg:prose-lg max-w-none">
                        <h2>Biography</h2>
                        {paragraphs.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}

                        {contributions && contributions.length > 0 && (
                            <>
                                <h2>Contributions</h2>
                                <ul>
                                    {contributions.map((contribution, index) => (
                                        <li key={index}>{contribution}</li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <h2>References</h2>
                        <ol className="list-decimal pl-5">
                            <li>
                                <a 
                                    href={sourceUrl || "#"} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {source || "Primary source"}
                                </a>
                            </li>
                        </ol>
                    </article>
                </main>
            </div>
        </div>
    );
}

export default FigureDetail;