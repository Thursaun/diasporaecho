import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import Login from "../ModalWithForms/Login";
import Register from "../ModalWithForms/Register";
import Main from "../Main/Main";
import Echoes from "../Echoes/Echoes";
import Profile from "../ProtectedRoute/Profile";
import FigureDetail from "../Echoes/FigureDetail";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { checkToken, login, register } from "../../utils/auth";
import {
  getSavedFigures,
  unsaveFigure,
  saveFigure,
  likeFigure,
} from "../../utils/api";
import ModalWithForm from "../ModalWithForms/ModalWithForm";
import AboutUs from "../About/About";

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
    login(formValues.email, formValues.password)
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          setLoggedIn(true);
          setCurrentUser(data.user);
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
        }
      })
      .catch((err) => console.log(err))
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
        fetchSavedFigures();
      })
      .catch((err) => {
        console.error("❌ Error saving figure:", err);
      });
  }
};

  const handleLikeFigureClick = (figure) => {
  if (!loggedIn) {
    setPendingLikeAction(figure);
    openModal("login");
    return;
  }

  const figureId = figure._id || figure.wikipediaId || figure.id;

  if (!figureId) {
    console.error("No valid figure ID found for like:", figure);
    return;
  }

  console.log("Liking figure with ID:", figureId);

  likeFigure(figureId)
    .then((updatedFigure) => {
      console.log("Like response:", updatedFigure);

      setFigures((prevFigures) =>
        prevFigures.map((fig) =>
          (fig._id || fig.wikipediaId || fig.id) === figureId
            ? {
                ...fig,
                likes: updatedFigure.likes,
                likedBy: updatedFigure.likedBy,
              }
            : fig
        )
      );

      setSavedFigures((prevSaved) =>
        prevSaved.map((fig) =>
          (fig._id || fig.wikipediaId || fig.id) === figureId
            ? {
                ...fig,
                likes: updatedFigure.likes,
                likedBy: updatedFigure.likedBy,
              }
            : fig
        )
      );

      setSelectedFigure((prevSelected) => {
        if (
          prevSelected &&
          (prevSelected._id === figureId ||
            prevSelected.wikipediaId === figureId ||
            prevSelected.id === figureId)
        ) {
          console.log("Updating selectedFigure with new likes:", updatedFigure.likes);
          return {
            ...prevSelected,
            likes: updatedFigure.likes,
            likedBy: updatedFigure.likedBy,
          };
        }
        return prevSelected;
      });
      fetchSavedFigures();
    })
    .catch((err) => console.log("Error liking figure:", err));
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
        <Routes>
          <Route
            path="/"
            element={
              <Main
                figures={figures}
                selectedFigure={selectedFigure}
                savedFigures={savedFigures}
                onSaveFigureClick={handleSaveFigureClick}
                onLikeFigureClick={handleLikeFigureClick}
                onLoginClick={() => openModal("login")}
              />
            }
          />
          <Route
            path="/echoes"
            element={
              <Echoes
                savedFigures={savedFigures}
                onSaveFigureClick={handleSaveFigureClick}
                onLikeFigureClick={handleLikeFigureClick}
                onLoginClick={() => openModal("login")}
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
