import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Login from "../ModalWithForms/Login";
import Register from "../ModalWithForms/Register";
import Loading from "../Loading/Loading";

const Main = lazy(() => import("../Main/Main"));
const Echoes = lazy(() => import("../Echoes/Echoes"));
const Profile = lazy(() => import("../ProtectedRoute/Profile"));
const FigureDetail = lazy(() => import("../Echoes/FigureDetail"));
const AboutUs = lazy(() => import("../About/About"));

import CurrentUserContext from "../../contexts/CurrentUserContext";
import { checkToken, login, register } from "../../utils/auth";
import {
  getSavedFigures,
  unsaveFigure,
  saveFigure,
  likeFigure,
  ensureFigureInDB,
} from "../../utils/api";
import ModalWithForm from "../ModalWithForms/ModalWithForm";

const App = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeModal, setActiveModal] = useState("");
  const [figures, setFigures] = useState([]);
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [savedFigures, setSavedFigures] = useState([]);
  const [pendingSaveAction, setPendingSaveAction] = useState(false);
  const [pendingLikeAction, setPendingLikeAction] = useState(false);
  
  // SYNERGY: Centralized state for all figures (Echoes gallery)
  const [allFigures, setAllFigures] = useState([]);

  // SYNERGY: Update a figure in all state locations
  const updateFigure = useCallback((figureId, updates) => {
    const matchesFigure = (f) => 
      f._id === figureId || f.wikipediaId === figureId;
    
    setAllFigures(prev => prev.map(f => 
      matchesFigure(f) ? { ...f, ...updates } : f
    ));
    setSavedFigures(prev => prev.map(f => 
      matchesFigure(f) ? { ...f, ...updates } : f
    ));
    setFigures(prev => prev.map(f => 
      matchesFigure(f) ? { ...f, ...updates } : f
    ));
    if (selectedFigure && matchesFigure(selectedFigure)) {
      setSelectedFigure(prev => ({ ...prev, ...updates }));
    }
    // Clear localStorage cache so next page load gets fresh data
    localStorage.removeItem('diaspora_figures');
    localStorage.removeItem('diaspora_figures_ts');
  }, [selectedFigure]);

  // SYNERGY: Add a new figure to allFigures
  const addFigure = useCallback((newFigure) => {
    setAllFigures(prev => {
      // Check if already exists
      const exists = prev.some(f => 
        f._id === newFigure._id || f.wikipediaId === newFigure.wikipediaId
      );
      if (exists) {
        return prev.map(f => 
          (f._id === newFigure._id || f.wikipediaId === newFigure.wikipediaId) 
            ? newFigure : f
        );
      }
      return [newFigure, ...prev];
    });
    // Clear localStorage cache
    localStorage.removeItem('diaspora_figures');
    localStorage.removeItem('diaspora_figures_ts');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkToken(token)
        .then((res) => {
          if (res) {
            setLoggedIn(true);
            setCurrentUser(res);
            fetchSavedFigures();
          }
        })
        .catch((err) => console.log(err));
    }
  }, []);

  const fetchSavedFigures = () => {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("Fetching saved figures...");
    getSavedFigures() 
      .then((data) => {
        console.log("✅ Fetched saved figures:", data);
        setSavedFigures(data);
      })
      .catch((err) => {
        console.error("❌ Error fetching saved figures:", err);
        setSavedFigures([]); 
      });
  }
};

  const openModal = (modal) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal("");
    setIsLoading(false);
  };

  const handleLoginClick = (formValues) => {
    setIsLoading(true);
    return login(formValues.email, formValues.password)
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          // Call checkToken to get user data (login only returns token)
          return checkToken(data.token);
        }
        throw new Error("No token received");
      })
      .then((userData) => {
        setLoggedIn(true);
        setCurrentUser(userData);
        closeModal();
        navigate("/");
        fetchSavedFigures();

        if (pendingSaveAction) {
          handleSaveFigureClick(pendingSaveAction);
          setPendingSaveAction(null);
        }

        if (pendingLikeAction) {
          handleLikeFigureClick(pendingLikeAction);
          setPendingLikeAction(null);
        }
      })
      .catch((err) => {
        console.log("Login error:", err);
        throw err; // Re-throw to let Login component handle the error state
      })
      .finally(() => setIsLoading(false));
  };

  const handleRegisterClick = (formValues) => {
    setIsLoading(true);
    register(formValues.name, formValues.email, formValues.password)
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          checkToken(data.token).then((userData) => {
            setLoggedIn(true);
            setCurrentUser(userData);
            closeModal();
            navigate("/");
            fetchSavedFigures();
          });
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));
  };

  const handleSignout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setCurrentUser(null);
    setSavedFigures([]); // Clear saved figures on signout
    navigate("/");
  };

 const handleSaveFigureClick = (figure) => {
  if (!loggedIn) {
    setPendingSaveAction(figure);
    openModal("login");
    return;
  }

  console.log("=== SAVE FIGURE CLICK ===");
  console.log("Figure to save:", figure);

  const getFigureId = (fig) => {
    return fig._id || fig.wikipediaId;
  };

  const figureId = getFigureId(figure);

  if (!figureId) {
    console.error("No valid figure ID found:", figure);
    return;
  }

  console.log("Processing figure with ID:", figureId);

  const isSaved = savedFigures.some(
    (savedFigure) => getFigureId(savedFigure) === figureId
  );

  console.log("Is currently saved:", isSaved);

  if (isSaved) {
    const savedFigure = savedFigures.find(
      (savedFigure) => getFigureId(savedFigure) === figureId
    );

    const figureToUnsave = getFigureId(savedFigure);
    console.log("Unsaving figure with ID:", figureToUnsave);

    // Use unsaveFigure - this only removes user association
    unsaveFigure(figureToUnsave)
      .then(() => {
        console.log("✅ Figure unsaved successfully");
        setSavedFigures((prevSavedFigures) =>
          prevSavedFigures.filter(
            (savedFigure) => getFigureId(savedFigure) !== figureToUnsave
          )
        );
        // Refresh saved figures to update Profile
        fetchSavedFigures();
      })
      .catch((err) => {
        console.error("❌ Error unsaving figure:", err);
      });
  } else {
    console.log("Saving new figure:", figure);
    saveFigure(figure)
      .then((savedFigureResponse) => {
        console.log("✅ Save response:", savedFigureResponse);
        setSavedFigures((prevSavedFigures) => [
          ...prevSavedFigures,
          savedFigureResponse,
        ]);
        // SYNERGY: Add to allFigures so it appears on Echoes immediately
        addFigure(savedFigureResponse);
        fetchSavedFigures();
      })
      .catch((err) => {
        console.error("❌ Error saving figure:", err);
      });
  }
};

  const handleLikeFigureClick = async (figure) => {
  if (!loggedIn) {
    setPendingLikeAction(figure);
    openModal("login");
    return Promise.reject(new Error("User not logged in"));
  }

  const figureId = figure._id || figure.wikipediaId || figure.id;

  if (!figureId) {
    console.error("No valid figure ID found for like:", figure);
    return Promise.reject(new Error("No valid figure ID"));
  }

  console.log("Liking figure with ID:", figureId);

  // If this is a Wikipedia-only figure (not saved to DB yet), save it first
  // FIX: Check source, _source, OR if the figure lacks _id (Wikipedia results don't have _id)
  const isWikipediaOnly = figure.source === 'Wikipedia' || figure._source === 'wikipedia' || (!figure._id && figure.wikipediaId);
  
  if (isWikipediaOnly) {
    console.log("Figure is from Wikipedia, ensuring in DB first...");
    try {
      const dbFigure = await ensureFigureInDB(figure);
      console.log("✅ Figure ensured in DB:", dbFigure.name);
      // Update figure reference with DB version
      figure = dbFigure;
    } catch (err) {
      console.error("❌ Error ensuring figure in DB:", err);
      // Continue trying to like anyway - might already exist
    }
  }

  return likeFigure(figureId)
    .then((updatedFigure) => {
      console.log("Like response:", updatedFigure);

      // SYNERGY: Use updateFigure to propagate changes everywhere
      updateFigure(figureId, {
        likes: updatedFigure.likes,
        likedBy: updatedFigure.likedBy,
        _id: updatedFigure._id, // Ensure we have the DB id
      });

      // Return the updated figure for child components
      return updatedFigure;
    })
    .catch((err) => {
      console.log("Error liking figure:", err);
      throw err;
    });
};

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="app">
        <Header
          loggedIn={loggedIn}
          onLoginClick={() => openModal("login")}
          onRegisterClick={() => openModal("register")}
          onSignOut={handleSignout}
        />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route
              path="/"
              element={
                <Main
                  figures={figures}
                  selectedFigure={selectedFigure}
                  savedFigures={savedFigures}
                  allFigures={allFigures}
                  onSaveFigureClick={handleSaveFigureClick}
                  onLikeFigureClick={handleLikeFigureClick}
                  onLoginClick={() => openModal("login")}
                  currentUser={currentUser}
                  updateFigure={updateFigure}
                />
              }
            />
            <Route
              path="/echoes"
              element={
                <Echoes
                  savedFigures={savedFigures}
                  allFigures={allFigures}
                  setAllFigures={setAllFigures}
                  onSaveFigureClick={handleSaveFigureClick}
                  onLikeFigureClick={handleLikeFigureClick}
                  onLoginClick={() => openModal("login")}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/figures/:id"
              element={
                <FigureDetail
                  onSaveFigureClick={handleSaveFigureClick}
                  onLikeFigureClick={handleLikeFigureClick}
                  onLoginClick={() => openModal("login")}
                  savedFigures={savedFigures}
                  selectedFigure={selectedFigure}
                  setSelectedFigure={setSelectedFigure}
                />
              }
            />
            <Route
              path="/about"
              element={<AboutUs onRegisterClick={() => openModal("register")} />}
            />
            <Route
              path="/profile"
              element={
                <Profile
                  savedFigures={savedFigures}
                  onLikeFigureClick={handleLikeFigureClick}
                  onSaveFigureClick={handleSaveFigureClick}
                  onLoginClick={() => openModal("login")}
                />
              }
            />
          </Routes>
        </Suspense>

        <Login
          isOpen={activeModal === "login"}
          onClose={closeModal}
          onLogin={handleLoginClick}
          onRegisterClick={() => openModal("register")}
          isLoading={isLoading}
        />
        <Register
          isOpen={activeModal === "register"}
          onClose={closeModal}
          onRegister={handleRegisterClick}
          isLoading={isLoading}
          onLoginClick={() => openModal("login")}
        />

        {activeModal === "success" && (
          <ModalWithForm
            name="success"
            title="Success!"
            isOpen={activeModal === "success"}
            onClose={closeModal}
            buttonText="Sign in"
            onSubmit={() => openModal("login")}
          >
            {() => (
              <div>
                <p className="modal__message">
                  Registration successful! You can now log in.
                </p>
              </div>
            )}
          </ModalWithForm>
        )}
      </div>
    </CurrentUserContext.Provider>
  );
};

export default App;
