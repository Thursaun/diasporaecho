import { BASE_URL } from "./constants";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  console.log("Using token:", token ? "Present" : "Missing");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const checkResponse = (res) => {
  if (res.ok) {
    return res.json();
  }
  return Promise.reject(`Error: ${res.status}`);
};

const getFigures = () => {
  return fetch(`${BASE_URL}/figures`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error fetching figures:", err);
      throw err;
    });
};

const getFeaturedFigures = () => {
  return fetch(`${BASE_URL}/figures/featured`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error fetching featured figures:", err);
      throw err;
    });
};

const searchFigures = (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.query || params.searchTerm) {
    queryParams.append("query", params.query || params.searchTerm);
  }

  // First, search local database
  return fetch(`${BASE_URL}/figures/search?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(checkResponse)
    .then((localResults) => {
      // If we have results from database, return them
      if (localResults && localResults.length > 0) {
        return localResults;
      }
      
      // If no local results, search Wikipedia and return results with isFromWikipedia flag
      return fetch(`${BASE_URL}/search?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(checkResponse)
        .then((wikipediaResults) => {
          if (!wikipediaResults || !Array.isArray(wikipediaResults)) {
            return [];
          }

          // Add isFromWikipedia flag to distinguish Wikipedia results
          return wikipediaResults.map((result) => ({
            ...result,
            wikipediaId: result.wikipediaId || result._id,
            imageUrl: result.imageUrl || result.image,
            category: result.category || matchToCategory(result),
            source: result.source || 'Wikipedia',
            isFromWikipedia: true // This flag identifies Wikipedia results
          }));
        })
        .catch((wikiError) => {
          console.error("Wikipedia search failed:", wikiError);
          return [];
        });
    })
    .catch((localError) => {
      console.error("Local database search failed:", localError);
      return [];
    });
};

const getFigureById = (id) => {
  return fetch(`${BASE_URL}/figures/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error fetching figure by ID:", err);
      throw err;
    });
};

const getFigureByWikipediaId = (wikipediaId) => {
  return fetch(`${BASE_URL}/figures/wiki/${wikipediaId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error fetching figure by Wikipedia ID:", err);
      throw err;  
    });
};


const likeFigure = (id) => {
  return fetch(`${BASE_URL}/figures/${id}/like`, {
    method: "POST",
    headers: getHeaders(),
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error liking figure:", err);
      throw err;
    });
};

const getSavedFigures = () => {
  return fetch(`${BASE_URL}/users/me/saved`, {
    method: "GET",
    headers: getHeaders(),
  })
    .then(checkResponse)
    .catch((err) => {
      console.error("Error fetching saved figures:", err);
      return [];
    });
};

const saveFigure = (figure) => {
  const figureToSave = {
    ...figure,
    imageUrl: figure.imageUrl || figure.image,
    category: figure.category || matchToCategory(figure),
    ...(figure.wikipediaId && { wikipediaId: figure.wikipediaId }),
  };

  console.log("Saving figure with data:", figureToSave);

  return fetch(`${BASE_URL}/figures/save`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(figureToSave),
  }).then(checkResponse);
};

const unsaveFigure = (figureId) => {
  return fetch(`${BASE_URL}/figures/unsave/${figureId}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then(checkResponse);
};


const matchToCategory = (figure) => {
  if (!figure || !figure.description) {
    return "Intellectuals Leaders";
  }

  const description = figure.description.toLowerCase();
  const tags = figure.tags ? figure.tags.map((tag) => tag.toLowerCase()) : [];

  if (
    description.includes("civil rights") ||
    description.includes("rights movement") ||
    description.includes("activist") ||
    description.includes("protest") ||
    description.includes("discrimination") ||
    description.includes("segregation") ||
    tags.some((tag) => tag.includes("civil rights") || tag.includes("activist"))
  ) {
    return "Civil Rights Activists";
  }

  if (
    description.includes("president") ||
    description.includes("senator") ||
    description.includes("congressman") ||
    description.includes("politician") ||
    description.includes("mayor") ||
    description.includes("governor") ||
    description.includes("political") ||
    tags.some((tag) => tag.includes("political") || tag.includes("president"))
  ) {
    return "Political Leaders";
  }

  if (
    description.includes("actor") ||
    description.includes("actress") ||
    description.includes("singer") ||
    description.includes("musician") ||
    description.includes("artist") ||
    description.includes("entertainer") ||
    description.includes("performer") ||
    description.includes("music") ||
    description.includes("film") ||
    description.includes("television") ||
    tags.some(
      (tag) =>
        tag.includes("music") || tag.includes("actor") || tag.includes("artist")
    )
  ) {
    return "Arts, Culture & Entertainment";
  }

  if (
    description.includes("author") ||
    description.includes("writer") ||
    description.includes("poet") ||
    description.includes("novelist") ||
    description.includes("literature") ||
    description.includes("book") ||
    description.includes("poetry") ||
    tags.some(
      (tag) =>
        tag.includes("author") || tag.includes("writer") || tag.includes("poet")
    )
  ) {
    return "Literary Icons";
  }

  // Check for Educators & Scholars keywords
  if (
    description.includes("professor") ||
    description.includes("teacher") ||
    description.includes("educator") ||
    description.includes("scholar") ||
    description.includes("university") ||
    description.includes("education") ||
    description.includes("academic") ||
    tags.some((tag) => tag.includes("education") || tag.includes("scholar"))
  ) {
    return "Educators & Scholars";
  }

  // Check for Inventors & Innovators keywords
  if (
    description.includes("inventor") ||
    description.includes("invention") ||
    description.includes("innovator") ||
    description.includes("scientist") ||
    description.includes("engineer") ||
    description.includes("researcher") ||
    description.includes("technology") ||
    tags.some((tag) => tag.includes("inventor") || tag.includes("scientist"))
  ) {
    return "Inventors & Innovators";
  }

  // Check for Athletic Icons keywords
  if (
    description.includes("athlete") ||
    description.includes("sports") ||
    description.includes("olympic") ||
    description.includes("baseball") ||
    description.includes("basketball") ||
    description.includes("football") ||
    description.includes("boxing") ||
    description.includes("tennis") ||
    tags.some((tag) => tag.includes("sport") || tag.includes("athlete"))
  ) {
    return "Athletic Icons";
  }

  // Check for Freedom Fighters keywords
  if (
    description.includes("freedom fighter") ||
    description.includes("revolutionary") ||
    description.includes("resistance") ||
    description.includes("liberation") ||
    description.includes("independence") ||
    description.includes("rebellion") ||
    tags.some((tag) => tag.includes("freedom") || tag.includes("revolutionary"))
  ) {
    return "Freedom Fighters";
  }

  // Check for Pan-African Leaders keywords
  if (
    description.includes("pan-african") ||
    description.includes("african unity") ||
    description.includes("diaspora") ||
    description.includes("african nationalism") ||
    tags.some((tag) => tag.includes("pan-african") || tag.includes("diaspora"))
  ) {
    return "Pan-African Leaders";
  }

  // Default category
  return "Intellectuals Leaders";
};


export {
  getFigures,
  getFeaturedFigures,
  searchFigures,
  getFigureById,
  getFigureByWikipediaId,
  likeFigure,
  getSavedFigures,
  saveFigure,
  unsaveFigure,
  matchToCategory,
};
