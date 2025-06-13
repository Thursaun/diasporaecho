require("dotenv").config();
const Figure = require("../models/figure");
const checkDupes = require("../helper/checkDupes");

const API_BASE_URL = "https://en.wikipedia.org/w/api.php";

const searchController = async (req, res) => {
  try {
    const searchTerm = req.query.query || req.query.searchTerm || "";

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }

    console.log("Searching for:", searchTerm);

    // Step 1: Search database first
    const dbResults = await Figure.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
    }).limit(10);

    console.log(`Found ${dbResults.length} results in database`);

    // If we have sufficient database results, return them
    if (dbResults.length >= 5) {
      return res.json(dbResults);
    }

    // Step 2: If not enough results, search Wikipedia
    const wikiResults = await searchFigures({ searchTerm });
    console.log(`Found ${wikiResults.length} additional results from Wikipedia`);

    // Step 3: REMOVED automatic saving - now just check for duplicates
    const uniqueWikiResults = await Promise.all(
      wikiResults.map(async (figure) => {
        // Skip figures without images
        if (!figure.imageUrl) {
          console.log(`Skipping figure ${figure.name} - no image available`);
          return null;
        }

        // Check if already exists using checkDupes helper
        const isDuplicate = await checkDupes(figure);
        if (isDuplicate) {
          // If it exists, return null to filter it out
          return null;
        }
        
        // Return the figure without saving it
        return figure;
      })
    );

    // Filter out nulls and add to results
    const validWikiResults = uniqueWikiResults.filter(Boolean);

    // Combine results, removing duplicates
    const combinedResults = [...dbResults];
    validWikiResults.forEach((wikiResult) => {
      if (!combinedResults.some((fig) => fig.name === wikiResult.name)) {
        combinedResults.push(wikiResult);
      }
    });

    res.json(combinedResults);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error performing search" });
  }
};

function isSearchingByTopic(searchTerm) {
  if (!searchTerm) return false;

  // Convert to lowercase for consistent matching
  const term = searchTerm.toLowerCase();

  // Common topic keywords
  const topicKeywords = [
    "movement",
    "revolution",
    "rights",
    "history",
    "culture",
    "music",
    "art",
    "education",
    "politics",
    "activism",
    "literature",
    "science",
    "invention",
    "sport",
    "freedom",
    "achievement",
    "renaissance",
    "religion",
    "medicine",
  ];

  // If any topic keywords are in the search term, it's likely a topic search
  if (topicKeywords.some((keyword) => term.includes(keyword))) {
    return true;
  }

  // Check if it looks like a person's name (has 2+ words with capitalization)
  const words = searchTerm.split(" ").filter((word) => word.length > 0);
  const looksLikeName =
    words.length >= 2 &&
    words.every((word) => word[0] === word[0].toUpperCase());

  // If it looks like a name, it's probably not a topic search
  if (looksLikeName) {
    return false;
  }

  // Single words are more likely to be topics than names
  if (words.length === 1 && words[0].length > 3) {
    return true;
  }

  // Default case: assume it's a person search
  return false;
}

const searchFigures = function (params = {}) {
  const searchTerm = params.searchTerm || "";

  // Detect if this is a person search or a topic/tag search
  const isTopicSearch = isSearchingByTopic(searchTerm);

  // Construct appropriate query based on search type
  let formattedSearch;
  if (isTopicSearch) {
    // For topic searches, focus on people related to the topic
    formattedSearch = `African American ${searchTerm} notable figures OR activists OR leaders`;
  } else {
    // For person searches, emphasize biographical information
    formattedSearch = `${searchTerm} African American biography OR historical figure`;
  }

  console.log("Search type:", isTopicSearch ? "Topic/Tag" : "Person");
  console.log("Formatted search:", formattedSearch);

  // First search query to get results
  const searchQueryParams = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: formattedSearch,
    srlimit: params.rows || 20, // Increased limit to get more potential matches
    origin: "*",
  });

  const searchUrl = `${API_BASE_URL}?${searchQueryParams.toString()}`;

  return fetch(searchUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error fetching search results: ${response.statusText}`
        );
      }
      return response.json();
    })
    .then((data) => {
      if (!data.query || !data.query.search || data.query.search.length === 0) {
        console.log("No results found for search term:", searchTerm);
        return [];
      }

      console.log(
        `Found ${data.query.search.length} results for "${searchTerm}"`
      );

      // Get page IDs for second request
      const pageIds = data.query.search.map((item) => item.pageid).join("|");
      return getPageDetails(pageIds, searchTerm, isTopicSearch);
    })
    .then((detailedData) => {
      if (!detailedData || !detailedData.query || !detailedData.query.pages) {
        return [];
      }

      // Format data for FigureCard component with people-only filter
      return formatWikipediaData(detailedData, searchTerm, true);
    })
    .catch((error) => {
      console.error("Wikipedia search error:", error);
      return [];
    });
};

async function getPageDetails(pageIds, searchTerm, isTopicSearch) {
  try {
    console.log(`Fetching details for ${pageIds.split("|").length} pages`);

    const detailsQueryParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|pageimages|info|categories",
      pageids: pageIds,
      exintro: "true",
      explaintext: "true",
      piprop: "original",
      inprop: "url",
      cllimit: "50",
      origin: "*",
    });

    const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
    console.log("Fetching page details from:", detailsUrl);

    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`Error fetching page details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching page details:", error);
    return null;
  }
}

/**
 * Format Wikipedia API data into figure objects
 * @param {Object} data - Wikipedia API response data
 * @param {string} searchTerm - Original search term
 * @param {boolean} peopleOnly - Whether to filter for people only
 * @returns {Array} - Formatted figure objects
 */
// Add after searchFigures and before getFigureById

/**
 * Fetch detailed information for Wikipedia pages
 * @param {string} pageIds - Comma-separated list of page IDs
 * @param {string} searchTerm - Original search term
 * @param {boolean} isTopicSearch - Whether this is a topic search
 * @returns {Promise<Object>} - Wikipedia API response with detailed page data
 */
async function getPageDetails(pageIds, searchTerm, isTopicSearch) {
  try {
    console.log(`Fetching details for ${pageIds.split("|").length} pages`);

    const detailsQueryParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|pageimages|info|categories",
      pageids: pageIds,
      exintro: "true",
      explaintext: "true",
      piprop: "original",
      inprop: "url",
      cllimit: "50",
      origin: "*",
    });

    const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
    console.log("Fetching page details from:", detailsUrl);

    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`Error fetching page details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching page details:", error);
    return null;
  }
}

function formatWikipediaData(data, searchTerm, peopleOnly = false) {
  if (!data || !data.query || !data.query.pages) {
    return [];
  }

  const pages = data.query.pages;
  const figures = [];

  for (const pageId in pages) {
    const page = pages[pageId];

    // Skip pages without extracts
    if (!page.extract) {
      console.log(`Skipping page ${page.title} - no extract available`);
      continue;
    }

    // If peopleOnly is true, check if this page is about a person
    if (peopleOnly && !looksLikePerson(page)) {
      console.log(
        `Skipping page ${page.title} - doesn't appear to be about a person`
      );
      continue;
    }

    // Extract years
    const extractedYears = extractYearsFromText(page.extract);
    console.log(`Years extracted for ${page.title}:`, extractedYears);
    const years = extractedYears || "Unknown";

    // Extract tags
    const tags = extractTags(page);

    // Extract contributions
    const contributions = extractContributions(page.extract);

    // Create figure object
    figures.push({
      _id: pageId,
      name: page.title,
      imageUrl:
        page.original?.source ||
        "https://via.placeholder.com/300x400?text=No+Image",
      description: page.extract || "No description available",
      years: years,
      tags: tags,
      contributions: contributions,
      source: "Wikipedia",
      sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${pageId}`,
      likes: [],
    });
  }

  console.log(`Formatted ${figures.length} figures from Wikipedia data`);
  return figures;
}

/**
 * Determine if a Wikipedia page is about a person
 * @param {Object} page - Wikipedia page object
 * @returns {boolean} - True if the page appears to be about a person
 */
function looksLikePerson(page) {
  if (!page.extract) return false;

  // Check for common biographical patterns
  const personPatterns = [
    /born/i,
    /died/i,
    /was an? American/i,
    /is an? American/i,
    /\(\d{4}.*\d{4}\)/,
    /African[ -]American/i,
  ];

  return personPatterns.some((pattern) => pattern.test(page.extract));
}

function extractYearsFromText(text) {
  if (!text) return null;
  
  // Clean the text to remove odd spacing and normalize dashes
  const cleanText = text.replace(/\s+/g, ' ').replace(/[–—]/g, '-');
  
  // Try different patterns for birth-death years in order of specificity
  const patterns = [
    // Pattern for (YYYY-YYYY) format in parentheses
    /\((\d{4})-(\d{4})\)/,
    
    // Pattern for "born YYYY, died YYYY" format
    /born\s+(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})(?:[^0-9]+)died\s+(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    
    // Pattern for comma-separated years (January 15, 1929 – April 4, 1968)
    /(\d{4})\s*[–—-]\s*(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/,
    
    // Pattern for "YYYY to YYYY" format
    /(\d{4})\s+to\s+(\d{4})/i,
    
    // More flexible patterns
    /born\s+(?:in\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    /died\s+(?:in\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    
    // Last resort - any 4-digit number that could be a year
    /\b(1[7-9]\d\d|20\d\d)\b/
  ];
  
  // Extract birth and death years
  let birthYear = null;
  let deathYear = null;
  
  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (!match) continue;
    
    // If the pattern captures both birth and death (has two capturing groups)
    if (match.length >= 3 && match[1] && match[2]) {
      birthYear = parseInt(match[1]);
      deathYear = parseInt(match[2]);
      break;
    } 
    // If we have a birth year pattern
    else if (pattern.toString().includes('born') && match[1]) {
      birthYear = parseInt(match[1]);
    }
    // If we have a death year pattern
    else if (pattern.toString().includes('died') && match[1]) {
      deathYear = parseInt(match[1]);
    }
    // For the last resort pattern (just finding years)
    else if (!birthYear && match[1]) {
      const year = parseInt(match[1]);
      // If the year is reasonable (not future, not too distant past)
      if (year > 1700 && year <= new Date().getFullYear()) {
        // More recent years are probably birth years for historical figures
        if (year > 1900) {
          birthYear = year;
        }
        // Older single years might be death years for historical figures
        else {
          deathYear = year;
        }
      }
    }
  }
  
  // Find all years in the text as a last resort
  if (!birthYear && !deathYear) {
    const yearMatches = cleanText.match(/\b(1[7-9]\d\d|20\d\d)\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      // Take first and last year if multiple found
      birthYear = parseInt(yearMatches[0]);
      deathYear = parseInt(yearMatches[yearMatches.length - 1]);
    } else if (yearMatches && yearMatches.length === 1) {
      // Just one year found
      birthYear = parseInt(yearMatches[0]);
    }
  }
  
  // Validate the years (ensure birth is before death)
  if (birthYear && deathYear && birthYear >= deathYear) {
    // Invalid combination, use only the most reliable
    if (deathYear < 1700 || deathYear > new Date().getFullYear()) {
      deathYear = null;
    }
    if (birthYear < 1700 || birthYear > new Date().getFullYear()) {
      birthYear = null;
    }
  }
  
  // Format the result
  if (birthYear && deathYear) {
    return `${birthYear}-${deathYear}`;
  } else if (birthYear) {
    // Check if the person might be alive (born in the last ~120 years and no death year)
    const currentYear = new Date().getFullYear();
    if (birthYear > currentYear - 120 && !deathYear) {
      // Check if text indicates person is still alive
      if (
        cleanText.includes('is a') || 
        cleanText.includes('is an') || 
        cleanText.includes('currently') ||
        !cleanText.includes('was a') ||
        cleanText.match(/born.+?in \d{4}/) && !cleanText.includes('died')
      ) {
        return `${birthYear}-Present`;
      }
    }
    return `${birthYear}`;
  } else if (deathYear) {
    return `d. ${deathYear}`;
  }
  
  // Could not extract any years
  return null;
}

/**
 * Determine if a Wikipedia page is about a person
 * @param {Object} page - Wikipedia page object
 * @returns {boolean} - True if the page appears to be about a person
 */
function looksLikePerson(page) {
  if (!page.extract) return false;

  // Check for common biographical patterns
  const personPatterns = [
    /born/i,
    /died/i,
    /was an? American/i,
    /is an? American/i,
    /\(\d{4}.*\d{4}\)/,
    /African[ -]American/i,
  ];

  return personPatterns.some((pattern) => pattern.test(page.extract));
}

/**
 * Extract years (birth-death) from text
 * @param {string} text - Text to extract years from
 * @returns {string|null} - Years in format "YYYY-YYYY" or null if not found
 */
function extractYearsFromText(text) {
  if (!text) return null;
  
  // Clean the text to remove odd spacing and normalize dashes
  const cleanText = text.replace(/\s+/g, ' ').replace(/[–—]/g, '-');
  
  // Try different patterns for birth-death years in order of specificity
  const patterns = [
    // Pattern for (YYYY-YYYY) format in parentheses
    /\((\d{4})-(\d{4})\)/,
    
    // Pattern for "born YYYY, died YYYY" format
    /born\s+(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})(?:[^0-9]+)died\s+(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    
    // Pattern for comma-separated years (January 15, 1929 – April 4, 1968)
    /(\d{4})\s*[–—-]\s*(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/,
    
    // Pattern for "YYYY to YYYY" format
    /(\d{4})\s+to\s+(\d{4})/i,
    
    // More flexible patterns
    /born\s+(?:in\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    /died\s+(?:in\s+)?(?:[A-Za-z]+\s+\d{1,2},?\s+)?(\d{4})/i,
    
    // Last resort - any 4-digit number that could be a year
    /\b(1[7-9]\d\d|20\d\d)\b/
  ];
  
  // Extract birth and death years
  let birthYear = null;
  let deathYear = null;
  
  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (!match) continue;
    
    // If the pattern captures both birth and death (has two capturing groups)
    if (match.length >= 3 && match[1] && match[2]) {
      birthYear = parseInt(match[1]);
      deathYear = parseInt(match[2]);
      break;
    } 
    // If we have a birth year pattern
    else if (pattern.toString().includes('born') && match[1]) {
      birthYear = parseInt(match[1]);
    }
    // If we have a death year pattern
    else if (pattern.toString().includes('died') && match[1]) {
      deathYear = parseInt(match[1]);
    }
    // For the last resort pattern (just finding years)
    else if (!birthYear && match[1]) {
      const year = parseInt(match[1]);
      // If the year is reasonable (not future, not too distant past)
      if (year > 1700 && year <= new Date().getFullYear()) {
        // More recent years are probably birth years for historical figures
        if (year > 1900) {
          birthYear = year;
        }
        // Older single years might be death years for historical figures
        else {
          deathYear = year;
        }
      }
    }
  }
  
  // Find all years in the text as a last resort
  if (!birthYear && !deathYear) {
    const yearMatches = cleanText.match(/\b(1[7-9]\d\d|20\d\d)\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      // Take first and last year if multiple found
      birthYear = parseInt(yearMatches[0]);
      deathYear = parseInt(yearMatches[yearMatches.length - 1]);
    } else if (yearMatches && yearMatches.length === 1) {
      // Just one year found
      birthYear = parseInt(yearMatches[0]);
    }
  }
  
  // Validate the years (ensure birth is before death)
  if (birthYear && deathYear && birthYear >= deathYear) {
    // Invalid combination, use only the most reliable
    if (deathYear < 1700 || deathYear > new Date().getFullYear()) {
      deathYear = null;
    }
    if (birthYear < 1700 || birthYear > new Date().getFullYear()) {
      birthYear = null;
    }
  }
  
  // Format the result
  if (birthYear && deathYear) {
    return `${birthYear}-${deathYear}`;
  } else if (birthYear) {
    return `${birthYear}`;
  } else if (deathYear) {
    return `d. ${deathYear}`;
  }
  
  // Could not extract any years
  return null;
}

/**
 * Extract relevant tags from a Wikipedia page
 * @param {Object} page - Wikipedia page object
 * @returns {Array} - Array of tags
 */
function extractTags(page) {
  const tags = [];

  // Extract from categories if available
  if (page.categories) {
    for (const category of page.categories.slice(0, 10)) {
      const categoryName = category.title.replace("Category:", "");

      // Filter out meta categories
      if (
        !categoryName.includes("Articles") &&
        !categoryName.includes("Pages") &&
        !categoryName.includes("Wikipedia") &&
        !categoryName.includes("CS1")
      ) {
        tags.push(categoryName);
      }
    }
  }

  // Extract common tags from text
  const commonTags = [
    "civil rights",
    "activist",
    "leader",
    "writer",
    "artist",
    "politician",
    "educator",
    "inventor",
    "athlete",
    "musician",
    "actor",
    "author",
    "poet",
    "scientist",
    "scholar",
  ];

  for (const tag of commonTags) {
    if (page.extract?.toLowerCase().includes(tag)) {
      tags.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    }
  }

  // Return unique tags, max 5
  return [...new Set(tags)].slice(0, 5);
}

/**
 * Extract contributions from text
 * @param {string} text - Text to extract contributions from
 * @returns {Array} - Array of contributions
 */
function extractContributions(text) {
  if (!text) return ["Historical Figure"];

  // Look for sentences containing contribution-related keywords
  const contributionKeywords = [
    "known for",
    "famous for",
    "contributed",
    "achievement",
    "legacy",
    "impact",
    "work",
    "recognized for",
  ];

  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Find sentences with contribution keywords
  const contributionSentences = sentences.filter((sentence) =>
    contributionKeywords.some((keyword) =>
      sentence.toLowerCase().includes(keyword)
    )
  );

  // If we found contribution sentences, use them
  if (contributionSentences.length > 0) {
    return contributionSentences.map((s) => s.trim()).slice(0, 3);
  }

  // Otherwise, just take the first sentence as a contribution
  if (sentences.length > 0) {
    return [sentences[0].trim()];
  }

  // Default contribution
  return ["Historical Figure"];
}

const getFigureById = async (id) => {
  try {
    // First try to find the figure in the database
    const figure = await Figure.findById(id);

    if (figure) {
      return figure;
    }

    // If not found in the database, it might be a Wikipedia ID
    if (id.match(/^\d+$/)) {
      // This appears to be a Wikipedia page ID
      const detailsQueryParams = new URLSearchParams({
        action: "query",
        format: "json",
        prop: "extracts|pageimages|info|categories",
        pageids: id,
        exintro: "true",
        explaintext: "true",
        piprop: "original",
        inprop: "url",
        origin: "*",
      });

      const detailsUrl = `${API_BASE_URL}?${detailsQueryParams.toString()}`;
      const response = await fetch(detailsUrl);

      if (!response.ok) {
        throw new Error(
          `Error fetching figure details: ${response.statusText}`
        );
      }

      const data = await response.json();
      const page = data.query?.pages?.[id];

      if (page) {
        // Format the Wikipedia data
        const formattedData = formatWikipediaData(
          { query: { pages: { [id]: page } } },
          "",
          true
        );
        return formattedData[0] || null;
      }
    }

    // Not found in database or Wikipedia
    return null;
  } catch (error) {
    console.error(`Error getting figure by ID ${id}:`, error);
    throw error;
  }
};

const getFeaturedFigures = async function (searchTerm = "", limit = 6) {
  try {
    let query = {};

    // If search term provided, use it to filter results
    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { tags: { $in: [new RegExp(searchTerm, "i")] } },
        ],
      };
    }

    // Get figures with the most likes first, or randomly selected if no likes
    const figures = await Figure.aggregate([
      { $match: query },
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1 } },
      { $limit: limit * 2 }, // Fetch extra to ensure we have enough after filtering
    ]);

    // If we don't have enough results, backfill with random selection
    if (figures.length < limit) {
      const backfillCount = limit - figures.length;
      const existingIds = figures.map((fig) => fig._id);

      const randomFigures = await Figure.aggregate([
        { $match: { _id: { $nin: existingIds } } },
        { $sample: { size: backfillCount } },
      ]);

      figures.push(...randomFigures);
    }

    // Ensure we only return figures that have images and all required fields
    const validFigures = figures
      .filter(
        (figure) =>
          figure.imageUrl &&
          figure.name &&
          figure.description &&
          figure.contributions?.length > 0
      )
      .slice(0, limit);

    console.log(
      `Returning ${validFigures.length} featured figures from database`
    );
    return validFigures;
  } catch (error) {
    console.error("Error fetching featured figures from database:", error);
    return [];
  }
};

// Export both the original WikiService functions and the new search controller
module.exports = {
  searchFigures,
  getFigureById,
  getFeaturedFigures,
  search: searchController,
};
