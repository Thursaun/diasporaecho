import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import CurrentUserContext from "../../contexts/CurrentUserContext";

function FigureCard({
  figure,
  onLikeFigureClick,
  onSaveFigureClick,
  isSaved,
  onLoginClick,
}) {
  const navigate = useNavigate();
  const currentUser = useContext(CurrentUserContext);
  const isLoggedIn = !!currentUser;

  if (!figure) return null;

  const {
    _id,
    wikipediaId,
    name,
    imageUrl,
    description,
    years,
    tags = [],
    likes = 0,
    likedBy = [],
    source,
  } = figure;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    onLikeFigureClick(figure);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    onSaveFigureClick(figure);
  };

  const handleCardClick = () => {
    const navId = _id || wikipediaId;
    
    if (!navId) {
      console.error("No valid navigation ID found for figure:", figure);
      return;
    }
    
    if (_id) {
      navigate(`/figures/${_id}`);
    } else if (wikipediaId) {
      navigate(`/figures/${wikipediaId}`);
    }
  };

  // Use the years from the server, don't override with client-side extraction
  const displayYears = years && years !== "Unknown" ? years : null;

  return (
    <div
      className="card group relative w-full max-w-sm aspect-[1/1.4] rounded-lg overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="image-box absolute inset-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-[0.4] group-hover:grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95"></div>
      </div>

      <div className="absolute inset-0 border-0 border-white rounded-lg opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:inset-[20px] pointer-events-none"></div>

      <div className="content absolute inset-0 flex flex-col p-6 z-10">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-2 mb-4">
          <h2 className="text-xl font-bold text-white bg-black/40 backdrop-blur-sm px-3 py-2 rounded-md shadow-md inline-block">
            {name}
          </h2>
          {/* Only show years if they were successfully extracted by the server */}
          {displayYears && (
            <p className="text-sm text-white/90 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm inline-block">
              {displayYears}
            </p>
          )}
        </div>

        {/* Description Section - Takes bulk of space */}
        <div className="flex-1 mb-3 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-6">
            {description}
          </p>
        </div>

        {/* Tags Section - Single line, container width based */}
        {tags && tags.length > 0 && (
          <div className="mb-2 opacity-0 translate-y-4 transition-all duration-500 delay-75 group-hover:opacity-100 group-hover:translate-y-0">
            <div className="flex items-center gap-1 overflow-hidden">
              {tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/20 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-white/70 text-xs whitespace-nowrap flex-shrink-0">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

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
                  aria-label="Like"
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
                  className={`px-3 py-1 rounded flex items-center text-sm ${
                    isSaved
                      ? "bg-white text-black hover:bg-white-90"
                      : "bg-white/20 text-white hover:bg-gray-200"
                  }`}
                  aria-label={isSaved ? "Saved" : "Save"}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onLoginClick();
                }}
                className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition-colors"
              >
                Sign in to like/save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FigureCard;